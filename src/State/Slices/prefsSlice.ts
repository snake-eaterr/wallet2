import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import loadInitialState, { MigrationFunction, applyMigrations, getStateAndVersion } from './migrations';
import { syncRedux } from '../store';
import { BackupAction } from '../types';
type FeeOptions = "asap" | "avg" | "eco" | ""
type FiatCurrencyUrl = {
  url: string
  symbol?: string
  currency: string
}
export interface PrefsInterface {
  mempoolUrl: string
  FiatUnit: FiatCurrencyUrl
  selected: FeeOptions
  debugMode?: boolean
}

export const storageKey = "prefs"
export const VERSION = 2;
export const migrations: Record<number, MigrationFunction<PrefsInterface>> = {
  // the Fiaturl to FiatUni migration
  1: (state) => {
    console.log("running migration v1 of prefs")
    if (state.Fiaturl) {
      const { Fiaturl, ...rest } = state;
      return { ...rest, FiatUnit: Fiaturl };
    } else {
      return state
    }
  },
  // Neither Fiaturl or FiatUnit existing at all migration
  2: (state) => {
    if (!state.FiatUnit) {
      state.FiatUnit = {url: "https://api.coinbase.com/v2/prices/BTC-USD/spot", symbol: "$", currency: "USD"};
      return state;
    }
    return state;
  }
};



export const mergeLogic = (serialLocal: string, serialRemote: string): { data: string, actions: BackupAction[] } => {
  /* const local = JSON.parse(serialLocal) as PrefsInterface
  const remote = JSON.parse(serialRemote) */
  const local = getStateAndVersion(serialLocal);
  const remote = getStateAndVersion(serialRemote);

  const migratedRemote = applyMigrations(remote.state, remote.version, migrations);
  const migratedLocal = applyMigrations(local.state, local.version, migrations);

  const actions: BackupAction[] = [];

  const merged: PrefsInterface = {
    mempoolUrl: migratedLocal.mempoolUrl || migratedRemote.mempoolUrl,
    FiatUnit: migratedLocal.FiatUnit || migratedRemote.FiatUnit,
    selected: migratedLocal.selected || migratedRemote.selected,
    debugMode: migratedLocal.debugMode,
  }
  actions.push({
    type: "prefs/setPrefs",
    payload: merged
  })
  return {
    data: JSON.stringify({
      version: VERSION,
      data: merged
    }),
    actions
  }
  
}



const update = (value: PrefsInterface) => {
  const stateToSave = {
    version: VERSION,
    data: value,
  };
  localStorage.setItem(storageKey, JSON.stringify(stateToSave));
}



const initialState: PrefsInterface = loadInitialState(
  storageKey,
  '{"selected":"","mempoolUrl":"", "FiatUnit": {"url": "https://api.coinbase.com/v2/prices/BTC-USD/spot", "symbol": "$", "currency": "USD"}}',
  migrations,
  update
);

const prefsSlice = createSlice({
  name: storageKey,
  initialState,
  reducers: {
    setPrefs: (state, action: PayloadAction<PrefsInterface>) => {
      state.mempoolUrl = action.payload.mempoolUrl;
      state.FiatUnit = action.payload.FiatUnit
      state.selected = action.payload.selected
      update(state)
    },
    setDebugMode: (state, action: PayloadAction<boolean>) => {
      state.debugMode = action.payload
      update(state)
    },
  },
  extraReducers: (builder) => {
    builder.addCase(syncRedux, () => {
      return loadInitialState(
        storageKey,
        '{"selected":"","mempoolUrl":"", "FiatUnit": {"url": "https://api.coinbase.com/v2/prices/BTC-USD/spot", "symbol": "$", "currency": "USD"}}',
        migrations,
        update
      );
    })
  }
});

export const { setPrefs, setDebugMode } = prefsSlice.actions;
export default prefsSlice.reducer;
