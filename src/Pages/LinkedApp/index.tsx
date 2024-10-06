import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { selectNostrSpends, useDispatch, useSelector } from "../../State/store";
import { getNostrClient, parseNprofile } from "../../Api/nostr";
import { DebitAuthorization, DebitRule_rule_type, } from "../../Api/pub/autogenerated/ts/types";
import { SpendFrom } from "../../globalTypes";
import { getDebitAppNameAndAvatarUrl } from "../../Components/Modals/DebitRequestModal/helpers";
import { NOSTR_RELAYS } from "../../constants";
import { nip19 } from "nostr-tools";
import moment from "moment";
import SpendFromDropdown from "../../Components/Dropdowns/SpendFromDropdown";
import { Clipboard } from "@capacitor/clipboard";
import { toast } from "react-toastify";
import styles from "./styles/index.module.scss";
import classNames from "classnames";
import { EditSource } from "../../Assets/SvgIconLibrary";
import { setDebitToEdit } from "../../State/Slices/modalsSlice";
import Checkbox from "../../Components/Checkbox";
import { formatNumberWithCommas } from "../../utils/numbers";
import { useIonRouter } from "@ionic/react";
import Toast from "../../Components/Toast";
import { flipSourceNdebitDiscoverable } from "../../State/Slices/paySourcesSlice";

type StateDebitAuth = DebitAuthorization & { source: SpendFrom, domainName?: string, avatarUrl?: string }

export const LinkedApp = () => {
  const dispatch = useDispatch();
  const router = useIonRouter()
  const [debitAuthorizations, setDebitAuthorizations] = useState<{
    debitAuths: StateDebitAuth[],
    debitAuthsBanned: StateDebitAuth[]
  }>({
    debitAuths: [],
    debitAuthsBanned: []
  })
  const nodedUp = useSelector(state => state.nostrPrivateKey);
  const nostrSpends = useSelector(selectNostrSpends);
  const paySources = useSelector(state => state.paySource)
  const refetchHook = useSelector(state => state.modalsSlice.debitsRefetchHook);

  const [selectedSource, setSelectedSource] = useState(nostrSpends[0]);
  const [hasNoDebits, setHasNoDebits] = useState(false)

  const [isPubliclyAvailable, setIsPubliclyAvailable] = useState(paySources.sources[selectedSource?.id]?.isNdebitDiscoverable || false);

  const [lnAddress, setLnAddress] = useState("")

  const [isShowingBans, setIsShowingBans] = useState(false);

  useLayoutEffect(() => {
    if (nostrSpends.length === 0) {
      toast.error(<Toast title="Error" message="You don't have any spend sources." />)
      router.push("/home");
    }
    setSelectedSource(nostrSpends[0]);
  }, [nostrSpends, router]);




  const fetchAuths = useCallback(() => {
    if (!selectedSource) return;
    const counterpartPaySource = paySources.sources[selectedSource.id]
    if (counterpartPaySource) {
      setLnAddress(counterpartPaySource.vanityName || "")
      setIsPubliclyAvailable(!!counterpartPaySource.isNdebitDiscoverable)
    }
    const { pubkey, relays } = parseNprofile(selectedSource.pasteField)
    getNostrClient({ pubkey, relays }, selectedSource.keys).then(c => {
      c.GetDebitAuthorizations().then(res => {
        if (res.status === "OK") {
          if (res.debits.length === 0) {
            setHasNoDebits(true);
          } else {
            setDebitAuthorizations({
              debitAuths: res.debits.filter(d => d.authorized).map(debit => ({ ...debit, source: selectedSource })),
              debitAuthsBanned: res.debits.filter(d => !d.authorized).map(debit => ({ ...debit, source: selectedSource }))
            })
          }

        }
      })
    })
  }, [selectedSource])

  useEffect(() => {
    if (!nodedUp) {
      return;
    }
    setDebitAuthorizations({ debitAuths: [], debitAuthsBanned: [] })
    setHasNoDebits(false);
    fetchAuths()
  }, [fetchAuths, nodedUp, refetchHook])



  const cardsToRender = useMemo(() => {
    const debitsToShow: StateDebitAuth[] = isShowingBans ? debitAuthorizations.debitAuthsBanned : debitAuthorizations.debitAuths
    return debitsToShow.map((debitAuth, index) => {
      const npub = nip19.npubEncode(debitAuth.npub);
      const substringedNpub = `${npub.substring(0, 20)}...${npub.substring(npub.length - 20, npub.length)}`;

      if (!debitAuth.avatarUrl) {

        getDebitAppNameAndAvatarUrl(debitAuth.npub, parseNprofile(debitAuth.source.pasteField).relays || NOSTR_RELAYS).then(({ requestorDomain, avatarUrl }) => {
          console.log({avatarUrl})
          setDebitAuthorizations(state => {
            if (isShowingBans) {
              return {
                ...state,
                debitAuthsBanned: state.debitAuthsBanned.map((item, i) =>
                  i === index ? { ...debitAuth, domainName: requestorDomain, avatarUrl } : item
                )
              }
            } else {
              return {
                ...state,
                debitAuths: state.debitAuths.map((item, i) =>
                  i === index ? { ...debitAuth, domainName: requestorDomain, avatarUrl } : item
                )
              }
            }
          });
        })
      }

      return (
        <div key={debitAuth.debit_id} className={styles["app-card"]}>
          <div className={styles.left}>
            <img src={debitAuth.avatarUrl} />
          </div>
          <div className={styles["right"]}>
            {
              debitAuth.domainName
              ?
              <span className={styles["name"]}>
                {debitAuth.domainName}
              </span>
              :
              <span className={classNames(styles["name"], styles["unknown-app"])}>
                Unknown App
              </span>
            }
            <span className={styles["npub"]}>
              {substringedNpub}
            </span>
            <div className={styles["rules"]}>
              {
                debitAuth.rules.map((rule, i) => {
                  if (rule.rule.type === DebitRule_rule_type.FREQUENCY_RULE) {
                    return <span key={i}><span className={styles["blue-text"]}>{formatNumberWithCommas(rule.rule.frequency_rule.amount.toString())} sats</span> per {rule.rule.frequency_rule.interval}</span>
                  } else {
                    return <span key={i}><span>Expires {moment(rule.rule.expiration_rule.expires_at_unix).fromNow()}</span></span>
                  }
                })
              }
            </div>
            {/* <div className={styles["reset"]} onClick={() => resetAuth({ source: debitAuth.source, npub: debitAuth.npub })}>
              Reset
            </div> */}
            <div className={styles["edit-icon"]} onClick={() => {
              dispatch(setDebitToEdit({ ...debitAuth, sourceId: debitAuth.source.id }))
            }}>
              <EditSource />
            </div>
          </div>

        </div>
      )
    })
  }, [debitAuthorizations, dispatch, isShowingBans])



  const handleFlipPubliclyDiscoverable = (checked: boolean) => {
    if (!selectedSource) return;
    const counterpartPaySource = paySources.sources[selectedSource.id]
    if (counterpartPaySource) {
      dispatch(flipSourceNdebitDiscoverable({ ...counterpartPaySource, isNdebitDiscoverable: checked }));
      setIsPubliclyAvailable(checked)
    }
  }

  return (
    <div className={styles["wrapper"]} key={selectedSource.id}>
      <div className={styles["container"]}>

        <div className={styles["page-header"]}>Linked Apps</div>
        <div className={styles["source-selection"]}>
          <SpendFromDropdown values={nostrSpends} value={selectedSource} callback={setSelectedSource} />
        </div>
        <div className={styles["list-scroller"]}>

          {
            (debitAuthorizations.debitAuths.length > 0 || debitAuthorizations.debitAuthsBanned.length > 0) ? (
              cardsToRender
            ) : (
              <div style={{
                marginTop: '40px',
                fontSize: '18px',
                color: '#a3a3a3',
                width: '100%',
                textAlign: 'center'
              }}>
                <span>Approval rules will be listed here.</span>
              </div>
            )
          }
        </div>
        <div style={{ width: '100%' }}>
          <div 
            className={classNames(styles["app-card"], styles["column"])}
            style={{
              fontSize: '1.2rem',
              width: '100%',
              marginBottom: '5px',
              borderRadius: '5px',
              border: '1px solid #2a3035',
              boxShadow: '0px 0px 2px rgba(0, 0, 0, 1)',
              backgroundColor: '#16191c',
              padding: '10px'
            }}
          >
            <span className={styles["title"]}>My debit string:</span>
            <span 
              className={styles["debit-string"]} 
              onClick={async () => {
                await Clipboard.write({ string: selectedSource.ndebit })
                toast.success("Copied to clipboard.")
              }}
            >
              {selectedSource.ndebit}
            </span>
            {
              lnAddress
              &&
              <>
                <div className={styles["checkbox-container"]} style={{ marginTop: "12px" }}>
                  <span className={styles["label"]}>Make publicly discoverable via Lightning Address:</span>
                  <Checkbox id="publicly-available" state={isPubliclyAvailable} setState={(e) => handleFlipPubliclyDiscoverable(e.target.checked)} />
                </div>
                <div className={styles["checkbox-container"]}>
                  <span className={styles["ln-address"]}>&#40;{lnAddress}&#41;</span>
                </div>
              </>
            }
          </div>
        </div>
        <div className={styles["change-view-button-container"]}>
          <div onClick={() => setIsShowingBans(!isShowingBans)}>
            {
              isShowingBans
              ?
              <span >&lt; Back to approved list </span>
              :
              <span> View ban list &gt;</span>
            }
          </div>
        </div>
      </div>
    </div>
  );
};


