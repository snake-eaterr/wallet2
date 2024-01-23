import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "../State/store";
import { setLatestOperation, setSourceHistory } from "../State/Slices/HistorySlice";
import { getNostrClient } from "../Api";
import * as Types from '../Api/autogenerated/ts/types'
import { addNotification } from "../State/Slices/notificationSlice";
import { decodeLnurl, getFormattedTime } from "../constants";
import { useIonRouter } from "@ionic/react";
import { Modal } from "./Modals/Modal";
import { UseModal } from "../Hooks/UseModal";
import * as icons from '../Assets/SvgIconLibrary';
import { Clipboard } from '@capacitor/clipboard';
import { validate } from 'bitcoin-address-validation';
import { parseNprofile } from "../Api/nostr";
import { editSpendSources } from "../State/Slices/spendSourcesSlice";
import axios, { isAxiosError } from "axios";
import { openNotification } from "../constants";
import { SubscriptionsBackground } from "./BackgroundJobs/subscriptions";

export const Background = () => {

	const router = useIonRouter();
	//reducer
	const savedAssets = useSelector(state => state.generatedAssets.assets)
	const spendSource = useSelector((state) => state.spendSource)
	const nostrSource = useSelector((state) => state.spendSource).map((e) => { return { ...e } }).filter((e) => e.pasteField.includes("nprofile"));
	const paySource = useSelector((state) => state.paySource)
	const cursor = useSelector(({ history }) => history.cursor) || {}
	const latestOp = useSelector(({ history }) => history.latestOperation) || {}
	const dispatch = useDispatch();
	const [initialFetch, setInitialFetch] = useState(true)
	const [clipText, setClipText] = useState("")
	const { isShown, toggle } = UseModal();
	const latestAckedClipboard = useRef("");
	const isShownRef = useRef(false);

	useEffect(() => {
		isShownRef.current = isShown;
	}, [isShown])


	window.onbeforeunload = function () { return null; };

	useEffect(() => {
		const handleBeforeUnload = () => {
			// Call your function here
			localStorage.setItem("lastOnline", Date.now().toString())
			localStorage.setItem("getHistory", "false");
			return false;
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			return window.removeEventListener('beforeunload', handleBeforeUnload);
		}
	}, []);

	useEffect(() => {

		nostrSource.forEach(source => {
			const { pubkey, relays } = parseNprofile(source.pasteField)

			getNostrClient({ pubkey, relays }).then(c => {
				c.GetLiveUserOperations(newOp => {
					if (newOp.status === "OK") {
						console.log("New operation", newOp)
						openNotification("top", "Payments", "You received payment.");
						dispatch(setLatestOperation({ pub: pubkey, operation: newOp.operation }))
					} else {
						console.log(newOp.reason)
					}
				})
			})
		});
	}, [nostrSource, dispatch])

	useEffect(() => {
		const nostrSpends = spendSource.filter((e) => e.pasteField.includes("nprofile"));
		const otherPaySources = paySource.filter((e) => !e.pasteField.includes("nprofile"));
		const otherSpendSources = spendSource.filter((e) => !e.pasteField.includes("nprofile"));

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
			openNotification("top", "Reminder", "Please back up your credentials!", () => { router.push("/auth") });
		}
	}, [paySource, spendSource, dispatch, router])

	useEffect(() => {
		if (Object.entries(latestOp).length === 0 && !initialFetch) {
			return
		}

		setInitialFetch(false)
		nostrSource.forEach(source => {
			const { pubkey, relays } = parseNprofile(source.pasteField)

			getNostrClient({ pubkey, relays }).then(c => {
				const req = populateCursorRequest(cursor)
				c.BatchUser([
					{ rpcName: 'GetUserInfo' },
					{ rpcName: 'GetUserOperations', req },
				]).then(res => {
					if (res.status === 'ERROR') {
						console.log(res.reason)
						return
					}
					const [infoResponse, operationsResponse] = res.responses as [Types.GetUserInfo_Output, Types.GetUserOperations_Output]
					if (infoResponse.status === 'ERROR') {
						console.log(infoResponse.reason)
					} else {
						dispatch(editSpendSources({ ...source, balance: `${infoResponse.balance}`, maxWithdrawable: `${infoResponse.max_withdrawable}` }));
					}
					if (operationsResponse.status === 'ERROR') {
						console.log(operationsResponse.reason)
					} else {
						console.log((operationsResponse), "ops")
						const totalHistory = parseOperationsResponse(operationsResponse);
						const lastTimestamp = parseInt(localStorage.getItem('lastOnline') ?? "0")
						const payments = totalHistory.operations.filter((e) => e.inbound && e.paidAtUnix * 1000 > lastTimestamp)
						if (payments.length > 0) {
							if (localStorage.getItem("getHistory") === "true") return;
							dispatch(addNotification({
								header: 'Payments',
								icon: '⚡',
								desc: 'You received ' + payments.length + ' payments since ' + getFormattedTime(lastTimestamp),
								date: Date.now(),
								link: '/home',
							}))
							localStorage.setItem("getHistory", "true");
						}
						dispatch(setSourceHistory({ pub: pubkey, ...totalHistory }));
					}
				})
			})
		})
	}, [latestOp, initialFetch])


	// reset spend for lnurl
	useEffect(() => {
		const sources = spendSource.map(s => ({ ...s }));
		sources.filter(s => !s.disabled).forEach(async source => {
			if (!source.pasteField.includes("nprofile")) {
				try {
					const lnurlEndpoint = decodeLnurl(source.pasteField);
					const response = await axios.get(lnurlEndpoint);
					source.balance = Math.round(response.data.maxWithdrawable / 1000).toString();
					dispatch(editSpendSources(source));
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
						source.disabled = err.response.data.reason;
						dispatch(editSpendSources(source));
					} else if (err instanceof Error) {
						openNotification("top", "Error", err.message);
					} else {
						console.log("Unknown error occured", err);
					}
				}
			}
		})
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router, dispatch])



	const checkClipboard = useCallback(async () => {
		window.onbeforeunload = null;
		let text = '';
		document.getElementById('focus_div')?.focus();
		if (document.hidden) {
			window.focus();
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
			//console.error('Error reading clipboard data:', error);
		}
		if (savedAssets?.includes(text)) {
			return;
		}
		text = text.replaceAll('lightning:', "")
		if (!text.length) {
			return
		}
		if (text === latestAckedClipboard.current) {
			return
		}
		const expression: RegExp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
		const boolLnAddress = expression.test(text);
		let boolLnInvoice = false;
		if (text.startsWith("ln") && nostrSource.length > 0) {

			const result = await (await getNostrClient(nostrSource[0].pasteField)).DecodeInvoice({ invoice: text });
			boolLnInvoice = result.status == "OK";
		}
		const boolAddress = validate(text);
		const boolLnurl = text.startsWith("lnurl");
		if (boolAddress || boolLnInvoice || boolLnAddress || boolLnurl) {
			setClipText(text);
			toggle();
		}
	}, [nostrSource, toggle, savedAssets]);

	useEffect(() => {
		window.addEventListener("visibilitychange", checkClipboard);
		window.addEventListener("focus", checkClipboard);

		return () => {
			window.removeEventListener("visibilitychange", checkClipboard);
			window.removeEventListener("focus", checkClipboard);
		};
	}, [checkClipboard])

	useEffect(() => {
		checkClipboard();
	}, [checkClipboard])


	const clipBoardContent = <React.Fragment>
		<div className='Home_modal_header'>Clipboard Detected</div>
		<div className='Home_modal_discription'>Would you like to use it?</div>
		<div className='Home_modal_clipboard'>{clipText}</div>
		<div className="Home_add_btn">
			<div className='Home_add_btn_container'>
				<button onClick={() => { toggle(); latestAckedClipboard.current = clipText; }}>
					{icons.Close()}NO
				</button>
			</div>
			<div className='Home_add_btn_container'>
				<button onClick={() => { toggle(); latestAckedClipboard.current = clipText; router.push("/send?url=" + clipText) }}>
					{icons.clipboard()}YES
				</button>
			</div>
		</div>
	</React.Fragment>;

	return <div id="focus_div">
		<SubscriptionsBackground />
		<Modal isShown={isShown} hide={() => { toggle(); latestAckedClipboard.current = clipText; }} modalContent={clipBoardContent} headerText={''} />
	</div>
}

const populateCursorRequest = (p: Partial<Types.GetUserOperationsRequest>): Types.GetUserOperationsRequest => {
	console.log(p)
	return {
		// latestIncomingInvoice: p.latestIncomingInvoice || 0,
		// latestOutgoingInvoice: p.latestOutgoingInvoice || 0,
		// latestIncomingTx: p.latestIncomingTx || 0,
		// latestOutgoingTx: p.latestOutgoingTx || 0,
		// latestIncomingUserToUserPayment: p.latestIncomingUserToUserPayment || 0,
		// latestOutgoingUserToUserPayment: p.latestOutgoingUserToUserPayment || 0,

		latestIncomingInvoice: 0,
		latestOutgoingInvoice: 0,
		latestIncomingTx: 0,
		latestOutgoingTx: 0,
		latestIncomingUserToUserPayment: 0,
		latestOutgoingUserToUserPayment: 0,
	}
}

const parseOperationsResponse = (r: Types.GetUserOperationsResponse): { cursor: Types.GetUserOperationsRequest, operations: Types.UserOperation[] } => {
	const cursor = {
		latestIncomingInvoice: r.latestIncomingInvoiceOperations.toIndex,
		latestOutgoingInvoice: r.latestOutgoingInvoiceOperations.toIndex,
		latestIncomingTx: r.latestIncomingTxOperations.toIndex,
		latestOutgoingTx: r.latestOutgoingTxOperations.toIndex,
		latestIncomingUserToUserPayment: r.latestIncomingUserToUserPayemnts.toIndex,
		latestOutgoingUserToUserPayment: r.latestOutgoingUserToUserPayemnts.toIndex,
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
	return { cursor, operations }
}
