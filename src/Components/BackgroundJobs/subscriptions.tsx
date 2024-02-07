import { useCallback, useEffect } from "react"
import { useDispatch, useSelector } from "../../State/store"
import { Subscription, SubscriptionPayment, addSubPayment, updateActiveSub } from "../../State/Slices/subscriptionsSlice"
import { InputClassification, openNotification } from "../../constants"
import { createLnurlInvoice, handlePayInvoice } from "../../Api/helpers"
import axios from "axios"
import { parseNprofile } from "../../Api/nostr"
import { setLatestOperation } from "../../State/Slices/HistorySlice"
import { UserOperationType } from "../../Api/autogenerated/ts/types"
import { addNotification } from "../../State/Slices/notificationSlice"
import { PaymentLock, lockSubscriptionPayment, unlockSubscriptionPayment } from "../../helpers/remoteBackups"
const SubsCheckIntervalSeconds = 60 * 60
export const SubscriptionsBackground = () => {
	const activeSubs = useSelector(({ subscriptions }) => subscriptions.activeSubs.filter(s => s.enabled))
	const payments = useSelector(({ subscriptions }) => subscriptions.payments)
	const fiatUnit = useSelector(({ prefs }) => prefs.FiatUnit)
	const spendSources = useSelector((state) => state.spendSource.filter(s => !s.disabled));
	const dispatch = useDispatch();

	const sendSubPayment = useCallback(async (sub: Subscription, latestPayment: SubscriptionPayment | null) => {
		if (sub.destionation.type !== InputClassification.LN_ADDRESS) {
			console.log("subscription payment destionation not supported", sub.destionation.type)
			return
		}
		const paymentId = `${sub.subId}:${latestPayment ? latestPayment.periodNumber + 1 : 1}`;
		const locked = await lockSubscriptionPayment(paymentId)
		if (locked === PaymentLock.ALREADY_PENDING) {
			console.log("unable to obtain the lock for payment")
			return
		} else if (locked === PaymentLock.ALREADY_SUCCESS) {
			console.log("the payment was already made by another device, updating local storage")
			const periodStartUnix = latestPayment ? latestPayment.periodEndUnix : sub.subbedAtUnix
			dispatch(addSubPayment({
				payment: {
					operationId: "",
					paidSats: 0,
					subId: sub.subId,
					periodNumber: latestPayment ? latestPayment.periodNumber + 1 : 1,
					periodStartUnix,
					periodEndUnix: periodStartUnix + sub.periodSeconds
				}
			}))
		}
		try {
			let sats = sub.price.amt
			const spendSource = spendSources[0]
			if (sub.price.type === 'cents') {
				const { data } = await axios.get(fiatUnit.url);
				const btcFiatCurrency = data.amount as number
				const satsFiatCurrency = btcFiatCurrency / 100_000_000
				sats = (sub.price.amt / 100) / satsFiatCurrency
			}
			const invoice = await createLnurlInvoice(sats, sub.destionation);
			const payRes = await handlePayInvoice(invoice, spendSource.pasteField);
			const now = Date.now() / 1000
			dispatch(setLatestOperation({
				pub: parseNprofile(spendSource.pasteField).pubkey, operation: {
					amount: sats, identifier: invoice, inbound: false, operationId: payRes.operation_id,
					paidAtUnix: now, type: UserOperationType.OUTGOING_INVOICE, network_fee: payRes.network_fee, service_fee: payRes.service_fee,
					confirmed: true,
				}
			}))
			const periodNumber = latestPayment ? latestPayment.periodNumber + 1 : 1
			const periodStartUnix = latestPayment ? latestPayment.periodEndUnix : sub.subbedAtUnix
			dispatch(addSubPayment({
				payment: {
					operationId: payRes.operation_id,
					paidSats: sats,
					subId: sub.subId,
					periodNumber,
					periodStartUnix,
					periodEndUnix: periodStartUnix + sub.periodSeconds
				}
			}))
			await unlockSubscriptionPayment(paymentId, true)
		} catch (err: any) {
			console.log("failed to renew sub", sub.subId);
			dispatch(addNotification({
				header: 'Recurring Payment Error',
				icon: '⚠️',
				desc: `Failed to pay recurring payment. Reason: ${err.message}`,
				date: Date.now(),
				link: '/automation',
			}))
			await unlockSubscriptionPayment(paymentId, false)
			console.log(err)
			return
		}
		openNotification("top", "Success", "Subscription renewed.");
	}, [fiatUnit, dispatch, spendSources])

	const checkSubsState = useCallback(() => {
		console.log("checking subscriptions state...")
		const nowUnix = Math.floor(Date.now() / 1000)
		let neededPayment: { sub: Subscription, payment: SubscriptionPayment | null } | null = null
		activeSubs.forEach(sub => {
			let maxEnd = 0
			let maxIndex = -1
			const subPayments = (payments[sub.subId] || [])
			subPayments.forEach((payment, index) => {
				if (payment.periodEndUnix > maxEnd) {
					maxEnd = payment.periodEndUnix
					maxIndex = index
				}
			})
			console.log({ maxEnd, nowUnix, sub })
			if (maxEnd < nowUnix && maxIndex !== -1) {
				console.log("sub", sub.subId, "expired")
				dispatch(updateActiveSub({ sub: { ...sub, unsubReason: "expire", unsubbedAtUnix: Math.floor(Date.now() / 1000) } }));
				return
			}
			const offset = (Math.random() * 0.15)
			const period = sub.periodSeconds * (0.7 + offset)
			if (maxEnd > nowUnix + period) {
				console.log("sub", sub.subId, "is up to date")
				return
			}
			console.log("subscription", sub.subId, "needs renew")
			if (neededPayment) {
				console.log("already found a sub to pay, will to it next time")
			} else {
				neededPayment = { sub, payment: maxIndex !== -1 ? subPayments[maxIndex] : null }
			}
		})
		if (neededPayment) {
			const { sub, payment } = neededPayment as { sub: Subscription, payment: SubscriptionPayment | null }
			sendSubPayment(sub, payment)
		}
	}, [activeSubs, dispatch, payments, sendSubPayment])

	useEffect(() => {
		const interval = setInterval(() => {
			checkSubsState()
		}, SubsCheckIntervalSeconds * 1000)
		checkSubsState()
		return () => {
			clearInterval(interval)
		}
	}, [checkSubsState])



	return null
}