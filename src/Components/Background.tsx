import React, { useCallback, useEffect, useRef, useState } from "react";
import { selectNostrSpends, useDispatch, useSelector } from "../State/store";
import { removeOptimisticOperation, setLatestOperation, setSourceHistory } from "../State/Slices/HistorySlice";
import { addAsset } from '../State/Slices/generatedAssets';
import { getNostrClient } from "../Api";
import * as Types from '../Api/pub/autogenerated/ts/types'
import { addNotification } from "../State/Slices/notificationSlice";
import { Destination, InputClassification, decodeLnurl, getFormattedTime, parseBitcoinInput } from "../constants";
import { useIonRouter } from "@ionic/react";
import { Modal } from "./Modals/Modal";
import { UseModal } from "../Hooks/UseModal";
import * as icons from '../Assets/SvgIconLibrary';
import { Clipboard } from '@capacitor/clipboard';
import { Client as NostrClient, parseNprofile } from "../Api/nostr";
import { editSpendSources } from "../State/Slices/spendSourcesSlice";
import axios, { isAxiosError } from "axios";
import { SubscriptionsBackground } from "./BackgroundJobs/subscriptions";
import { HealthCheck } from "./BackgroundJobs/HealthCheck";
import { LnAddressCheck } from "./BackgroundJobs/LnAddressCheck";
import { SpendFrom } from "../globalTypes";
import { NewSourceCheck } from "./BackgroundJobs/NewSourceCheck";
import { NodeUpCheck } from "./BackgroundJobs/NodeUpCheck";
import { toast } from "react-toastify";
import Toast from "./Toast";
import { useHistory } from "react-router";


export const Background = () => {
	const history = useHistory();
	const router = useIonRouter();
	const savedAssets = useSelector(state => state.generatedAssets.assets)
	const spendSource = useSelector((state) => state.spendSource)
	const nostrSpends = useSelector(selectNostrSpends);
	const paySource = useSelector((state) => state.paySource)
	const { cursor, latestOperation: latestOp, operations: operationGroups, operationsUpdateHook } = useSelector(state => state.history)
	const nodedUp = useSelector(state => state.nostrPrivateKey);
	const dispatch = useDispatch();
	const [parsedClipboard, setParsedClipbaord] = useState<Destination>({
    type: InputClassification.UNKNOWN,
    data: "",
  });
	const [refresh, setRefresh] = useState<number | null>(null);
	const { isShown, toggle } = UseModal();
	const isShownRef = useRef(false);

	useEffect(() => {
		isShownRef.current = isShown;
	}, [isShown])


	window.onbeforeunload = function () { return null; };

	useEffect(() => {
		const handleBeforeUnload = () => {
			// Call your function here
			localStorage.setItem("userStatus", "offline");
			return false;
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			return window.removeEventListener('beforeunload', handleBeforeUnload);
		}
	}, []);

	useEffect(() => {
		if (!nodedUp) {
			return;
		}
		nostrSpends.forEach(source => {
			const { pubkey, relays } = parseNprofile(source.pasteField)

			getNostrClient({ pubkey, relays }, source.keys!).then(c => {
				c.GetLiveUserOperations(newOp => {
					if (newOp.status === "OK") {
						// receiving external on-chain txs causes two getLiveUserOperations procs
						// the history state takes care of this repetition,
						// but we have to deal with the toast not appearing twice here
						if (!operationGroups[pubkey].find(op => op.operationId === newOp.operation.operationId)) {
							toast.info(<Toast title="Payments" message="You received payment." />)
						}
						dispatch(setLatestOperation({ pub: pubkey, operation: newOp.operation }))
					} else {
						console.log(newOp.reason)
					}
				})
			})
		});
	}, [nostrSpends, dispatch, operationGroups, nodedUp])

	useEffect(() => {
		const otherPaySources = Object.values(paySource.sources).filter((e) => !e.pubSource);
		const otherSpendSources = Object.values(spendSource.sources).filter((e) => !e.pubSource);

		if ((nostrSpends.length !== 0 && nostrSpends[0].balance !== "0") || (otherPaySources.length > 0 || otherSpendSources.length > 0)) {
			if (localStorage.getItem("isBackUp") == "1") {
				return;
			}
			dispatch(addNotification({
				header: 'Reminder',
				icon: '⚠️',
				desc: 'Back up your credentials!',
				date: Date.now(),
				link: '/auth',
			}))
			localStorage.setItem("isBackUp", "1")
			toast.warn(
				<Toast
					title="Reminder"
					message="Please back up your credentials"
				/>,
				{
					onClick: () => router.push("/auth")
				}
			)
		}
	}, [paySource, spendSource, dispatch, router])

	const getSourceInfo = async (source: SpendFrom, client: NostrClient) => {
		const res = await client.GetUserInfo()
		if (res.status === 'ERROR') {
			console.log(res.reason)
			return
		}
		dispatch(editSpendSources({
			...source,
			balance: `${res.balance}`,
			maxWithdrawable: `${res.max_withdrawable}`
		}))
	}
	const fetchSourceHistory = useCallback(async (source: SpendFrom, client: NostrClient, pubkey: string, newCurosor?: Partial<Types.GetUserOperationsRequest>, newData?: Types.UserOperation[]) => {
		const req = populateCursorRequest(newCurosor || cursor, !!newData)
		const res = await client.GetUserOperations(req)
		if (res.status === 'ERROR') {
			console.log(res.reason)
			return
		}
		console.log((res), "ops")
		const totalHistory = parseOperationsResponse(res);
		const totalData = (newData || []).concat(totalHistory.operations)
		if (totalHistory.needMoreData) {
			console.log("need more operations from server, fetching...")
			fetchSourceHistory(source, client, pubkey, totalHistory.cursor, totalHistory.operations)
			return
		}

		dispatch(removeOptimisticOperation(pubkey));

		const accumulatedHistory = {
			operations: totalData,
			cursor: totalHistory.cursor
		};

		const populatedEntries = Object.entries(operationGroups).filter(([, operations]) => operations.length > 0);
		if (populatedEntries.length === 0) {
			dispatch(setSourceHistory({ pub: pubkey, ...accumulatedHistory }));
			return;
		}

		let collapsed: Types.UserOperation[] = []
		populatedEntries.forEach(([, operations]) => {
			if (operations) collapsed = operations.concat(collapsed)
		})

		const record:Record<string,boolean>={}
		collapsed.forEach(c => record[c.operationId]=true)

		const payments = [...totalData.filter(e => e.inbound && !record[e.operationId])];
		
		if (payments.length > 0 && localStorage.getItem("userStatus") === "offline") {
			dispatch(addNotification({
				header: 'Payments',
				icon: '⚡',
				desc: 'You received ' + payments.length + ' payments since you have been away.',
				date: Date.now(),
				link: '/home',
			}))
			localStorage.setItem("userStatus", "online");
		}
		dispatch(setSourceHistory({ pub: pubkey, ...accumulatedHistory }));
	}, [cursor, dispatch, operationGroups]);

	useEffect(() => {
		if (!nodedUp) {
			return;
		}
		nostrSpends.forEach(async s => {
			const { pubkey, relays } = parseNprofile(s.pasteField)
			const client = await getNostrClient({ pubkey, relays }, s.keys!)
			await getSourceInfo(s, client)
		})
	}, [latestOp, operationsUpdateHook, nostrSpends.length, nodedUp, refresh])


	useEffect(() => {
		if (!nodedUp) {
			return;
		}
		nostrSpends.forEach(async s => {
			const { pubkey, relays } = parseNprofile(s.pasteField)
			const client = await getNostrClient({ pubkey, relays }, s.keys!)
			await fetchSourceHistory(s, client, pubkey)
		})
	}, [operationsUpdateHook, nostrSpends.length, nodedUp, refresh])

	



	// reset spend for lnurl
	useEffect(() => {
		const sources = Object.values(spendSource.sources);
		sources.filter(s => !s.disabled).forEach(async source => {
			if (!source.pubSource) {
				try {
					const lnurlEndpoint = decodeLnurl(source.pasteField);
					const response = await axios.get(lnurlEndpoint);
					const updatedSource = { ...source };
					const amount = Math.round(response.data.maxWithdrawable / 1000).toString()
					updatedSource.balance = amount;
					updatedSource.maxWithdrawable = amount;
					dispatch(editSpendSources(updatedSource));
				} catch (err) {
					if (isAxiosError(err) && err.response) {
						dispatch(addNotification({
							header: 'Spend Source Error',
							icon: '⚠️',
							desc: `Spend source ${source.label} is saying: ${err.response.data.reason}`,
							date: Date.now(),
							link: `/sources?sourceId=${source.id}`,
						}))
						// update the erroring source
						dispatch(editSpendSources({ ...source, disabled: err.response.data.reason }));
					} else if (err instanceof Error) {
						toast.error(<Toast title="Source Error" message={err.message} />)
					} else {
						console.log("Unknown error occured", err);
					}
				}
			}
		})
	}, [router, dispatch])

	const checkClipboard = useCallback(async () => {
		window.onbeforeunload = null;
		let text = '';
		document.getElementById('focus_div')?.focus();
		if (document.hidden) {
			window.focus();
		}
		// don't prompt found clipboard before noding up
		if (!nodedUp) {
			return
		}
		if (isShownRef.current) {
			return;
		}
		try {
			const { type, value } = await Clipboard.read();
			if (type === "text/plain") {
				text = value;
			}
		} catch (error) {
			return console.error("Cannot read clipboard");
		}
		if (savedAssets?.includes(text)) {
			return;
		}
		if (!text.length) {
			return
		}

		let parsed: Destination | null = null;

		try {
      parsed = await parseBitcoinInput(text);
    } catch (err: any) {
      console.log(err)
			return;
    }

		if (
      parsed.type === InputClassification.BITCOIN_ADDRESS
      ||
      parsed.type === InputClassification.LN_INVOICE
      ||
      parsed.type === InputClassification.LN_ADDRESS
      ||
      (parsed.type === InputClassification.LNURL && parsed.lnurlType === "payRequest")
    ) {
			setParsedClipbaord(parsed);
			toggle()
		}
		
	}, [savedAssets, nodedUp]);

	useEffect(() => {

		const visiblityHandler = () => {
			if (document.visibilityState === "visible") {
				setRefresh(Math.random())
			}
			checkClipboard();
		}
		window.addEventListener("visibilitychange", visiblityHandler)
		window.addEventListener("focus", checkClipboard);

		return () => {
			window.removeEventListener("visibilitychange", visiblityHandler);
			window.removeEventListener("focus", checkClipboard);
		};
	}, [checkClipboard])

	useEffect(() => {
		checkClipboard();
	}, [checkClipboard])



	const clipBoardContent = <React.Fragment>
		<div className='Home_modal_header'>Clipboard Detected</div>
		<div className='Home_modal_discription'>Would you like to use it?</div>
		<div className='Home_modal_clipboard'>{parsedClipboard.data}</div>
		<div className="Home_add_btn">
			<div className='Home_add_btn_container'>
				<button onClick={() => { toggle(); dispatch(addAsset({ asset: parsedClipboard.data }));}}>
					{icons.Close()}NO
				</button>
			</div>
			<div className='Home_add_btn_container'>
				<button onClick={() => {
					toggle();
					history.push({
						pathname: "/send",
						state: parsedClipboard
					})
				}}>
					{icons.clipboard()}YES
				</button>
			</div>
		</div>
	</React.Fragment>;

	return <div id="focus_div">
		<SubscriptionsBackground />
		<HealthCheck />
		<NewSourceCheck />
		<LnAddressCheck />
		<NodeUpCheck />
		<Modal isShown={isShown} hide={() => { toggle()}} modalContent={clipBoardContent} headerText={''} />
	</div>
}

const populateCursorRequest = (p: Partial<Types.GetUserOperationsRequest>, paginated: boolean): Types.GetUserOperationsRequest => {
	console.log(p)
	const thecursor = {
		latestIncomingInvoice: p.latestIncomingInvoice ? (paginated ? p.latestIncomingInvoice + 1 : p.latestIncomingInvoice) : 0,
		latestOutgoingInvoice: p.latestOutgoingInvoice ? (paginated ? p.latestOutgoingInvoice + 1 : p.latestOutgoingInvoice) : 0,
		latestIncomingTx: p.latestIncomingTx ? (paginated ? p.latestIncomingTx + 1 : p.latestIncomingTx) : 0,
		latestOutgoingTx: p.latestOutgoingTx ? (paginated ? p.latestOutgoingTx + 1 : p.latestOutgoingTx) : 0,
		latestIncomingUserToUserPayment: p.latestIncomingUserToUserPayment ? (paginated ? p.latestIncomingUserToUserPayment + 1 : p.latestIncomingUserToUserPayment) : 0,
		latestOutgoingUserToUserPayment: p.latestOutgoingUserToUserPayment ? (paginated ? p.latestOutgoingUserToUserPayment + 1 : p.latestOutgoingUserToUserPayment) : 0,
		max_size: 10
	}
	return thecursor
}

const parseOperationsResponse = (r: Types.GetUserOperationsResponse): { cursor: Types.GetUserOperationsRequest, operations: Types.UserOperation[], needMoreData: boolean } => {
	const cursor = {
		latestIncomingInvoice: r.latestIncomingInvoiceOperations.toIndex,
		latestOutgoingInvoice: r.latestOutgoingInvoiceOperations.toIndex,
		latestIncomingTx: r.latestIncomingTxOperations.toIndex,
		latestOutgoingTx: r.latestOutgoingTxOperations.toIndex,
		latestIncomingUserToUserPayment: r.latestIncomingUserToUserPayemnts.toIndex,
		latestOutgoingUserToUserPayment: r.latestOutgoingUserToUserPayemnts.toIndex,
		max_size: 10
	}

	const operations = [
		...r.latestIncomingInvoiceOperations.operations,
		...r.latestOutgoingInvoiceOperations.operations,
		...r.latestIncomingTxOperations.operations,
		...r.latestOutgoingTxOperations.operations,
		...r.latestIncomingUserToUserPayemnts.operations,
		...r.latestOutgoingUserToUserPayemnts.operations,
	]

	console.log({ operations })
	const needMoreData = isAnyArrayLong([
		r.latestIncomingInvoiceOperations.operations,
		r.latestOutgoingInvoiceOperations.operations,
		r.latestIncomingTxOperations.operations,
		r.latestOutgoingTxOperations.operations,
		r.latestIncomingUserToUserPayemnts.operations,
		r.latestOutgoingUserToUserPayemnts.operations,
	], 10)
	return { cursor, operations, needMoreData }
}

const isAnyArrayLong = (arrays: any[][], max: number): boolean => {
	for (let i = 0; i < arrays.length; i++) {
		const array = arrays[i];
		if (array.length >= max) {
			return true
		}
	}
	return false
}