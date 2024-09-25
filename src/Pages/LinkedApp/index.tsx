import { useCallback, useEffect, useMemo, useState } from "react";
import { selectNostrSpends, useSelector } from "../../State/store";
import { getNostrClient, parseNprofile } from "../../Api/nostr";
import { DebitAuthorization, DebitRule_rule_type, } from "../../Api/pub/autogenerated/ts/types";
import { SpendFrom } from "../../globalTypes";
import { getDebitAppNameAndAvatarUrl } from "../../Components/BackgroundJobs/DebitRequestHandler/helpers";
import { NOSTR_RELAYS } from "../../constants";
import { nip19 } from "nostr-tools";
import moment from "moment";
import SpendFromDropdown from "../../Components/Dropdowns/SpendFromDropdown";
import { Clipboard } from "@capacitor/clipboard";
import { toast } from "react-toastify";

export const LinkedApp = () => {
  const [debitAuthorizations, setDebitAuthorizations] = useState<(DebitAuthorization & { source: SpendFrom, domainName?: string, avatarUrl?: string })[]>([])
  const nodedUp = useSelector(state => state.nostrPrivateKey);
  const nostrSpends = useSelector(selectNostrSpends);

  const [selectedSource, setSelectedSource] = useState(nostrSpends[0]);

  const fetchAuths = useCallback(() => {
    const { pubkey, relays } = parseNprofile(selectedSource.pasteField)
    getNostrClient({ pubkey, relays }, selectedSource.keys).then(c => {
      c.GetDebitAuthorizations().then(res => {
        if (res.status === "OK") {
          setDebitAuthorizations(res.debits.map(debit => ({ ...debit, source: selectedSource })));
        }
      })
    })
  }, [selectedSource])

  useEffect(() => {
    if (!nodedUp) {
      return;
    }
    fetchAuths()
  }, [fetchAuths, nodedUp, /* updatehook */])

  const resetAuth = useCallback(async (request: { source: SpendFrom, npub: string }) => {
    const res = await (await getNostrClient(request.source.pasteField, request.source.keys)).ResetDebit({ npub: request.npub });
    if (res.status !== "OK") {
      throw new Error(res.reason);
    }
    fetchAuths()
  }, [fetchAuths])


  const cardsToRender = useMemo(() => {
    return debitAuthorizations.map((debitAuth, index) => {
      const npub = nip19.npubEncode(debitAuth.npub);
      const substringedNpub = `${npub.substring(0, 20)}...${npub.substring(npub.length - 20, npub.length)}`;

      if (!debitAuth.avatarUrl) {
        
        getDebitAppNameAndAvatarUrl(debitAuth.npub, parseNprofile(debitAuth.source.pasteField).relays || NOSTR_RELAYS).then(({ requestorDomain, avatarUrl }) => {
          setDebitAuthorizations(state =>
            state.map((item, i) =>
              i === index ? { ...debitAuth, domainName: requestorDomain, avatarUrl: avatarUrl } : item
            )
          );
        })
      }

      return (
        <div key={debitAuth.debit_id} className="LinkedApp_app_card">
          <div className="LinkedApp_app_card_left">
            {
              debitAuth.avatarUrl
              ?
              <img src={debitAuth.avatarUrl} />
              :
              "avatar"
            }
          </div>
          <div className="LinkedApp_app_card_right">
            {
              debitAuth.domainName
              &&
              <span className="LinkedApp_app_card_right_name">
                {debitAuth.domainName}
              </span>
            }
            <span className="LinkedApp_app_card_right_npub">
              {substringedNpub}
            </span>
            <div className="LinkedApp_app_card_right_rules">
              {
                debitAuth.rules.map((rule, i) => {
                  if (rule.rule.type === DebitRule_rule_type.FREQUENCY_RULE) {
                    return <span key={i}><span>{rule.rule.frequency_rule.amount} sats</span> per {rule.rule.frequency_rule.interval}</span>
                  } else {
                    return <span key={i}><span>Expires {moment(rule.rule.expiration_rule.expires_at_unix).fromNow()}</span></span>
                  }
                })
              }
            </div>
            <div className="LinkedApp_app_card_right_reset" onClick={() => resetAuth({ source: debitAuth.source, npub: debitAuth.npub })}>
              Reset
            </div>
          </div>

        </div>
      )
    })
  }, [debitAuthorizations, resetAuth])

  return (
    <div className="LinkedApp_container">
      <div className="LinkedApp">
        <div className="LinkedApp_header_text">Linked Apps</div>
        <div className="LinkedApp_source_selection">
          <SpendFromDropdown values={nostrSpends} value={selectedSource} callback={setSelectedSource} />
        </div>
        <div className="LinkedApp_scroller">
          {cardsToRender}
        </div>
        <div className="LinkedApp_app_card LinkedApp_app_card_column">
          <span className="LinkedApp_app_card_title">My debit string:</span>
          <span className="LinkedApp_app_card_ndebit">{selectedSource.ndebit}</span>
          <button className="LinkedApp_button" onClick={async () => {
            await Clipboard.write({ string: selectedSource.ndebit })
            toast.success("Copied to clipboard.")
          }}>Copy</button>
        </div>
      </div>
    </div>
  );
};


