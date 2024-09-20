import { useCallback, useEffect, useState } from "react";
import { DebitAuthorization, LiveDebitRequest, LiveDebitRequest_debit_type } from "../../Api/pub/autogenerated/ts/types";
import { SourceDebitRequest } from "../../globalTypes";
import { getNostrClient, parseNprofile } from "../../Api/nostr";
import { selectNostrSpends, useSelector } from "../../State/store";

export const DebitRequestHandler = () => {
    const nostrSpends = useSelector(selectNostrSpends);
    const nodedUp = useSelector(state => state.nostrPrivateKey);
    const [requestData, setRequestData] = useState<SourceDebitRequest | null>(null);
    useEffect(() => {
        if (!nodedUp) {
            return;
        }
        console.log("inside")
        nostrSpends.forEach(source => {
            const { pubkey, relays } = parseNprofile(source.pasteField)
            getNostrClient({ pubkey, relays }, source.keys).then(c => {
                c.GetLiveDebitRequests(debitReq => {
                    if (debitReq.status === "OK") {
                        console.log("Got one")
                        setRequestData({ request: debitReq, source })
                    }
                })
            })
        });
    }, [nostrSpends, nodedUp])
    const authroizeRequest = useCallback(async (request: SourceDebitRequest) => {
        const res = await (await getNostrClient(request.source.pasteField, request.source.keys)).AuthorizeDebit({ authorize_npub: request.request.npub, rules: [] });
        if (res.status !== "OK") {
            throw new Error(res.reason);
        }
        setRequestData(null)
    }, [])
    if (!requestData) {
        return null
    }
    return (
        <>
            <div className='Sources_modal_header'>Incoming Request</div>
            <div className='Sources_modal_discription'>{requestData.request.npub}</div>
            <div className='Sources_modal_discription'>
                {
                    requestData.request.debit.type === LiveDebitRequest_debit_type.FREQUENCY
                        ?
                        `Wants you to pay ${requestData.request.amount} sats per ${requestData.request.debit.frequency.interval}, ${requestData.request.debit.frequency.number_of_intervals} times`
                        :
                        `Wants you to pay ${requestData.request.amount} sats`
                }
            </div>
            <div className='Sources_modal_discription'>Wants to spend</div>
            <div className='Sources_modal_discription'>{requestData.request.amount}</div>
            <div className="Sources_modal_add_btn">
                <button onClick={() => close()}>Deny</button>
                <button onClick={() => authroizeRequest(requestData)}>{requestData.request.debit.type === LiveDebitRequest_debit_type.FREQUENCY ? "Allow" : "Pay"}</button>
            </div>
        </>
    )
}