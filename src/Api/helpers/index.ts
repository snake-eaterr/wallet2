import axios from "axios";
import { getNostrClient } from "..";
import { Destination, SANCTUM_URL, decodeLnurl, getClientKey, keylinkUrl } from "../../constants";
import { AddressType } from "../autogenerated/ts/types";
import { NostrKeyPair } from "../nostrHandler";
import { SpendFrom } from "../../globalTypes";
import { State } from "../../State/store";
import { Action, ThunkDispatch } from "@reduxjs/toolkit";


/* This file includes all possible transactional operations.
	I found myself wanting to do the same operations in different pages,
	like creating a nostr invoice for the sweep in send page, and the sweep itself in sources page
	so it's better to have them importable from one place.

	Error handling is done by throwing errors
*/

export const createNostrInvoice = async (pasteField: string, keys: NostrKeyPair, amount: number, memo?: string) => {
	const res = await (await getNostrClient(pasteField, keys)).NewInvoice({
		amountSats: +amount,
		memo: memo || ""
	})

	if (res.status !== 'OK') {
		throw new Error(res.reason);
	}
	return res.invoice;
}

export const createNostrPayLink = async (pasteField: string, keys: NostrKeyPair) => {
	const res = await (await getNostrClient(pasteField, keys)).GetLnurlPayLink()

	if (res.status !== 'OK') {
		throw new Error(res.reason);
	}
	return res.lnurl;
}

export const getNostrBtcAddress = async (pasteField: string, keys: NostrKeyPair) => {
	const res = await (await getNostrClient(pasteField, keys)).NewAddress({ addressType: AddressType.WITNESS_PUBKEY_HASH })
	if (res.status !== 'OK') {
		throw new Error(res.reason);
	}

	return res.address
}

// both lnurl and ln address
export const createLnurlInvoice = async (amountToPay: number, dest: Destination) => {
	if (amountToPay === 0) {
		throw new Error("No amount set");
	}
	const { callback, min, max } = dest as { callback: string, min: number, max: number };
	if (amountToPay < min || amountToPay > max) {
		throw new Error(`Can only send between ${min} and ${max} sats.`);
	}
	const resp = await axios.get(
		callback + (callback.includes('?') ? "&" : "?") + "amount=" + amountToPay * 1000,
		{
			headers: {
				'Content-Type': 'application/json',
				withCredentials: false,
			}
		}
	);

	if (resp.data.status === "ERROR") {
		throw new Error(resp.data.reason);
	}
	return resp.data.pr
};

const handleLnurlWithdrawPay = async (lnurl: string, invoice: string) => {
	const lnurlEndpoint = decodeLnurl(lnurl);
		const res = await axios.get(lnurlEndpoint);
		const { k1, callback } = res.data as { k1: string, callback: string };
		const resp = await axios.get(
			callback + (callback.includes('?') ? "&" : "?") + "k1=" + k1 + "&" + "pr=" + invoice,
			{
				headers: {
					'Content-Type': 'application/json',
					withCredentials: false,
				}
			}
		);

		if (resp.data.status === "ERROR") {
			throw new Error(res.data.reason);
		}
		
		return { operation_id: `lnurl-withdraw-${Date.now()}`, service_fee: 0, network_fee: 0, data: invoice }
}

export const handlePayInvoice = async (invoice: string, source: SpendFrom | string) => {

	if (typeof source != "string") {

		if (source.pubSource && source.keys) {
			const payRes = await (await getNostrClient(source.pasteField, source.keys)).PayInvoice({
				invoice: invoice,
				amount: 0,
			})
			if (payRes.status == "OK") {
				return { ...payRes, data: invoice };
			} else {
				throw new Error(payRes.reason);
			}
		} else {
			// lnurl-withdraw source
			return handleLnurlWithdrawPay(source.pasteField, invoice);
		}
	} else {
		return handleLnurlWithdrawPay(source, invoice);
	}
};

export const handlePayBitcoinAddress = async (source: SpendFrom, address: string, amount: number, satsPerVByte: number) => {
	if (!source.pubSource || !source.keys) throw new Error("Source is not nprofile");
	const payRes = await (await getNostrClient(source.pasteField, source.keys)).PayAddress({
		address,
		amoutSats: +amount,
		satsPerVByte
	})
	
	if (payRes.status == "OK") {
		return { ...payRes, data: address  };
	} else {
		throw new Error(payRes.reason);
	}
};




type SuccessObject = {
    accessToken: string;
    nsec: string;
    identifier: string;
  }

type NewSocketReq = {
  sendOnOpen: Record<string, string | number | boolean>;
  onToStartSanctum: (requestToken: string) => void;
  onError: (reason: string) => void;
  onSuccess: (data: SuccessObject) => void;
  onGenericData?: (data: any) => void
  onUnexpectedClosure?: () => void
  dispatch?: ThunkDispatch<State, undefined, Action>;
};
export const newSocket = ({
  sendOnOpen,
  onToStartSanctum,
  onError,
  onSuccess,
  onGenericData,
  onUnexpectedClosure,
}: NewSocketReq) => {
  const toSendPrep = sendOnOpen;

	const clientKey = getClientKey();
	toSendPrep.clientKey = clientKey



  const ws = new WebSocket(
    `${SANCTUM_URL.replace("https", "wss").replace("http", "ws")}/`
  );
  let socketClosed = false;

  const closeSocket: () => void = () => {
    if (!socketClosed) {
      socketClosed = true;
      ws.close();
    }
  };
  ws.onclose = () => {
    if (!socketClosed) {
			console.log("Socket closed unexpectedly");
      if (onUnexpectedClosure) { onUnexpectedClosure() }
    }
  }
  ws.onopen = async () => {
    console.log("socketing..");
    const s = JSON.stringify(toSendPrep)
    ws.send(s);
  };
  ws.onmessage = event => {
    const parsed = JSON.parse(event.data as string);

    if (parsed.error) {
      closeSocket();
      onError(parsed.error as string);
      return;
    }
    if (parsed.accessToken) {
      closeSocket();
      onSuccess(parsed);
      return;
    }
    if (parsed.requestToken) {
      onToStartSanctum(parsed.requestToken as string);
      return;
    }
    if (onGenericData) {
      onGenericData(parsed)
    }
  };
  return closeSocket;
};
