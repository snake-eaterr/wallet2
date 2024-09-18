import React, { useCallback, useEffect, useState } from "react";
import { Modal } from "../../Components/Modals/Modal";
import { UseModal } from "../../Hooks/UseModal";
import { selectNostrSpends, useSelector } from "../../State/store";
import { getNostrClient, parseNprofile } from "../../Api/nostr";
import { DebitAuthorization, LiveDebitRequest, LiveDebitRequest_debit_type } from "../../Api/pub/autogenerated/ts/types";
import { SpendFrom } from "../../globalTypes";

type SourceDebitRequest = { request: LiveDebitRequest, source: SpendFrom }

export const LinkedApp = () => {

  const { isShown, toggle } = UseModal();
  const [requestData, setRequestData] = useState<SourceDebitRequest | null>(null);
  const [debitAuthorizations, setDebitAuthorizations] = useState<DebitAuthorization[]>([])
  const nodedUp = useSelector(state => state.nostrPrivateKey);
  const nostrSpends = useSelector(selectNostrSpends);
  const [updatehook, setUpdateHook] = useState(0)

  useEffect(() => {
		if (!nodedUp) {
			return;
		}
		nostrSpends.forEach(source => {
			const { pubkey, relays } = parseNprofile(source.pasteField)

			getNostrClient({ pubkey, relays }, source.keys).then(c => {
        c.GetDebitAuthorizations().then(res => {
          if (res.status === "OK") {
            setDebitAuthorizations((state) => [...state, ...res.debits])
          }
        })
				
			})
		});
	}, [nostrSpends, nodedUp, toggle, updatehook])

  useEffect(() => {
		if (!nodedUp) {
			return;
		}
		nostrSpends.forEach(source => {
			const { pubkey, relays } = parseNprofile(source.pasteField)

			getNostrClient({ pubkey, relays }, source.keys).then(c => {
				c.GetLiveDebitRequests(debitReq => {
					if (debitReq.status === "OK") {
            console.log("Got one")
            setRequestData({ request: debitReq, source })
            toggle();
					}
				})
			})
		});
	}, [nostrSpends, nodedUp, toggle])


  const authroizeRequest = useCallback(async (request: SourceDebitRequest) => {
    const res = await (await getNostrClient(request.source.pasteField, request.source.keys)).AuthorizeDebit({ authorize_npub: request.request.npub, rules: [] });
    if (res.status !=="OK") {
      throw new Error(res.reason);
    }
    setUpdateHook(Math.random())
    toggle();

  }, [toggle])




  

  return (
    <div className="LinkedApp_container">
      <div className="LinkedApp">
        <div className="LinkedApp_header_text">Linked Apps</div>
        <div>
          { debitAuthorizations.map(res => (
            <div key={res.debit_id}>
              <span>{res.npub}</span>
            </div>
          )) }
        </div>
        <Modal isShown={isShown} hide={toggle} modalContent={<IncomingRequestModal request={requestData!} authorize={authroizeRequest} toggle={toggle} />} headerText={''} />
      </div>
    </div>
  );
};
interface Props {
  request: SourceDebitRequest,
  authorize: (request: SourceDebitRequest) => Promise<void>,
  toggle: () => void
}
const IncomingRequestModal = ({ request, authorize, toggle }: Props) => {
  return (
    <React.Fragment>
      <div className='Sources_modal_header'>Incoming Request</div>
      <div className='Sources_modal_discription'>{request.request.npub}</div>
      <div className='Sources_modal_discription'>
        {
          request.request.debit.type === LiveDebitRequest_debit_type.FREQUENCY
          ?
          `Wants you to pay ${request.request.amount} sats per ${request.request.debit.frequency.interval}, ${request.request.debit.frequency.number_of_intervals} times`
          :
          `Wants you to pay ${request.request.amount} sats`
        }
      </div>
      <div className='Sources_modal_discription'>Wants to spend</div>
      <div className='Sources_modal_discription'>{request.request.amount}</div>

      <div className="Sources_modal_add_btn">
        <button onClick={() => toggle()}>Deny</button>
        <button onClick={() => authorize(request)}>{request.request.debit.type === LiveDebitRequest_debit_type.FREQUENCY ? "Allow" : "Pay"}</button>
      </div>

    </React.Fragment>
  )
}
