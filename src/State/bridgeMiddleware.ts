import { AnyAction, createAction, createListenerMiddleware, isAnyOf, ListenerEffectAPI, TypedStartListening } from "@reduxjs/toolkit";
import { addPaySources } from "./Slices/paySourcesSlice";
import { AppDispatch, State } from "./store";
import { PayTo } from "../globalTypes";
import { getNostrClient } from "../Api";
import Bridge from "../Api/bridge";

import { finalizeEvent, nip98, nip19 } from 'nostr-tools'
const { getToken } = nip98
const { decode } = nip19

export const upgradeSourcesToNofferBridge = createAction("upgradeSourcesToNofferBridge");

function sortObject(obj: Record<string, any>): any {
	const allKeys = Object.keys(obj).sort(); // Sort keys
	const sortedObj: Record<string, any> = {};

	// Build new object with sorted keys
	for (const key of allKeys) {
		sortedObj[key] = obj[key];
	}

	// Now stringify the object with sorted keys
	return sortedObj;
}
const enrollToBridge = async (source: PayTo, dispatchCallback: (vanityname: string) => void) => {
	//throw new Error("needs fixing!")
	const data = decode(source.pasteField)
	if (!data || data.type !== 'nprofile') {
		throw new Error("Invalid paste field")
	}
	const { pubkey, relays } = data.data
	const nostrClient = await getNostrClient({ pubkey, relays }, source.keys);

	const userInfoRes = await nostrClient.GetUserInfo();
	if (userInfoRes.status !== "OK") {
		throw new Error(userInfoRes.reason);
	}

	// we still get and send the k1 so that legacy mappings in bridge are moved to nofferMapping
	const lnurlPayLinkRes = await nostrClient.GetLnurlPayLink();
	let k1: string | undefined = undefined;
	if (lnurlPayLinkRes.status === "OK") {
		k1 = lnurlPayLinkRes.k1
	}

	const bridgeUrl = userInfoRes.bridge_url;
	if (!bridgeUrl) return;


	const payload = { k1, noffer: userInfoRes.noffer }
	const nostrHeader = await getToken(`${bridgeUrl}/api/v1/noffer/vanity`, "POST", e => finalizeEvent(e, Buffer.from(source.keys.privateKey, 'hex')), true, payload)
	const bridgeHandler = new Bridge(bridgeUrl, nostrHeader);
	const bridgeRes = await bridgeHandler.GetOrCreateNofferName(sortObject(payload));
	if (bridgeRes.status !== "OK") {
		throw new Error(bridgeRes.reason);
	}
	const hostName = new URL(bridgeUrl);
	const parts = hostName.hostname.split(".");
	const domainName = parts.slice(-2).join('.');

	dispatchCallback(`${bridgeRes.vanity_name}@${domainName}`)

}

export const bridgeListener = {
	matcher: isAnyOf(addPaySources, upgradeSourcesToNofferBridge),
	effect: async (action: AnyAction, listenerApi: ListenerEffectAPI<State, AppDispatch>) => {
		if (upgradeSourcesToNofferBridge.match(action)) {
			const paySources = listenerApi.getState().paySource;
			const nostrPayTos = Object.values(paySources.sources).filter(source => source.pubSource);
			await Promise.all(nostrPayTos.map(async source => enrollToBridge(
				source,
				(vanityName) => listenerApi.dispatch({ type: "paySources/editPaySources", payload: { ...source, vanityName }, meta: { skipChangelog: true } })
			)))
			return;
		}

		if (addPaySources.match(action)) {
			const source = action.payload.source;

			await enrollToBridge(
				source,
				(vanityName) => listenerApi.dispatch({ type: "paySources/editPaySources", payload: { ...source, vanityName }, meta: { skipChangelog: true } })
			)

		}
	}
}

export const bridgeMiddleware = createListenerMiddleware()
const typedStartListening = bridgeMiddleware.startListening as TypedStartListening<State, AppDispatch>
typedStartListening(bridgeListener);