import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { PayTo } from '../../globalTypes';
import { mergeArrayValuesWithOrder, mergeNonFungibleRecords } from './dataMerge';
import loadInitialState, { MigrationFunction, getStateAndVersion, applyMigrations } from './migrations';
import { decodeNprofile, encodeNprofile } from '../../custom-nip19';
import { OLD_NOSTR_PUB_DESTINATION } from '../../constants';
import { syncRedux } from '../store';
import { getNostrPrivateKey } from '../../Api/nostr';
import { getPublicKey } from 'nostr-tools';
import { DataVersion } from '../types';


type PaySourceRecord = Record<string, PayTo>;

export interface PaySourceState {
  sources: PaySourceRecord;
  order: string[];
}


export const storageKey = "payTo"
export const VERSION = 4;
export const migrations: Record<number, MigrationFunction<any>> = {
  // the bridge url encoded in nprofile migration
  1: (data) => {
		console.log("running migration v1 of payToSources");
    const state = data as PayTo[];
    const newState = state.map(source => {
      if (!source.pasteField.startsWith("nprofile") || source.label !== "Bootstrap Node") {
        return source
      } else if (decodeNprofile(source.pasteField).bridge?.length) {
        return source;
      } else {
        const decoded = decodeNprofile(source.pasteField);
        const newNprofile = encodeNprofile({
          pubkey: decoded.pubkey,
          relays: decoded.relays,
          bridge: decoded.pubkey === OLD_NOSTR_PUB_DESTINATION ? ["https://zap.page"] : ["https://shockwallet.app"]
        })
        
        return {
          ...source,
          pasteField: newNprofile
        }
      }
    })
    return newState;
  },
  // the array to record sources migration
  2: (data) => {
    console.log("running migration v2 of payToSources")
    const state = data as PayTo[];
    const order: string[] = [];
    const payToRecord = state.reduce((record: PaySourceRecord, source) => {
      if (!source.pasteField.startsWith("nprofile")) {
        record[source.pasteField] = { ...source, id: source.pasteField };
        order.push(source.pasteField)
      } else {
        const decoded = decodeNprofile(source.pasteField);
        record[decoded.pubkey] = { ...source, pubSource: true, id: decoded.pubkey };
        order.push(decoded.pubkey);
      }
      return record;
    }, {});
    return {
      sources: payToRecord,
      order
    } as PaySourceState;
  },
   // key pair per source migration
   3: (state) => {
    console.log("running migration v3 of payToSources")
    const privateKey = getNostrPrivateKey()
    if (!privateKey) return state;
    if (state.sources) {
      for (const key in state.sources) {
        if (state.sources[key].pubSource && !state.sources[key].keys) {
          state.sources[key].keys = {
            privateKey,
            publicKey: getPublicKey(privateKey)
          }
        }
      }
    }
    return state
  },
  // the order array is now a string of lpk + source npub
  4: (state: PaySourceState) => {
    console.log("running migration v4 of SpendFromSources")

    const order = state.order;
    const sourcesObject = state.sources;


    const newOrderArray = order.map(lpk => {
      if (!sourcesObject[lpk].pubSource) {
        return lpk;
      }
      const source = sourcesObject[lpk]
      const publicKey = source.keys.publicKey;
      return `${lpk}-${publicKey}`;
    });
    
    const newSourcesObject: PaySourceRecord = {};
    for (const key in sourcesObject) {
      // eslint-disable-next-line
      if (sourcesObject.hasOwnProperty(key)) {
        if (!sourcesObject[key].pubSource) {
          newSourcesObject[key] = sourcesObject[key];
        } else {
          const publicKey = sourcesObject[key].keys.publicKey;
          const newKey = `${key}-${publicKey}`;
          newSourcesObject[newKey] = sourcesObject[key];
          newSourcesObject[newKey].id = newKey
        }
      }
    }
    state.order = newOrderArray;
    state.sources = newSourcesObject;
    return state

  }
};



export const mergeLogic = (serialLocal: string, serialRemote: string, localVersion: DataVersion, remoteVersion: DataVersion): string => {
  const local = getStateAndVersion(serialLocal)
  const remote = getStateAndVersion(serialRemote)
  const migratedRemote = applyMigrations(remote.state, remote.version, migrations) as PaySourceState;
  const migratedLocal = applyMigrations(local.state, local.version, migrations) as PaySourceState;
  const merged: PaySourceState = {
    sources: mergeNonFungibleRecords(migratedLocal.sources, migratedRemote.sources, localVersion, remoteVersion),
    order: mergeArrayValuesWithOrder(migratedLocal.order, migratedRemote.order, localVersion, remoteVersion, v => v)
  }

  merged.order = merged.order.filter(source => !!merged.sources[source]);
  
  return JSON.stringify({
    version: VERSION,
    data: merged
  });
}





const update = (value: PaySourceState) => {
  const stateToSave = {
    version: VERSION,
    data: value,
  };
  localStorage.setItem(storageKey, JSON.stringify(stateToSave));
}





const initialState: PaySourceState = loadInitialState(storageKey, JSON.stringify({ sources: {}, order: [] }), migrations, update);



const paySourcesSlice = createSlice({
  name: 'paySources',
  initialState,
  reducers: {
    addPaySources: (state: PaySourceState, action: PayloadAction<PayTo>) => {
      state.sources[action.payload.id] = action.payload;
      state.order.push(action.payload.id);
      update(state);
      return state;
    },
    editPaySources: (state: PaySourceState, action: PayloadAction<PayTo>) => {
      state.sources[action.payload.id] = action.payload
      update(state);
      return state;
    },
    deletePaySources: (state, action: PayloadAction<string>) => {
      delete state.sources[action.payload]
      const newOrder = state.order.filter(s => s !== action.payload);
      state.order = newOrder;
      update(state);
      return state;
    },
    setPaySources: (state, action: PayloadAction<string[]>) => {
      if (state.order.length !== action.payload.length) return;
      state.order = action.payload
      update(state);
      return state;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(syncRedux, () => {
      return loadInitialState(storageKey, JSON.stringify({ sources: {}, order: [] }), migrations, update);
    })
  }
});

export const { addPaySources, editPaySources, deletePaySources, setPaySources } = paySourcesSlice.actions;
export default paySourcesSlice.reducer;
