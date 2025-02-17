import { toast } from "react-toastify";
import * as Icons from "../../Assets/SvgIconLibrary";
import { Clipboard } from "@capacitor/clipboard";
import React, { useEffect, useMemo, useState } from "react";
import BootstrapSource from "../../Assets/Images/bootstrap_source.jpg";
import { useSelector, useDispatch, selectEnabledSpends, selectConnectedNostrSpends } from '../../State/store';
import { PayTo } from "../../globalTypes";
import { getNostrClient } from "../../Api";
import { useParams, useLocation } from "react-router";
import * as Types from '../../Api/pub/autogenerated/ts/types'
import Checkbox from "../../Components/Checkbox";
type OfferItemType = {
  title: string;
  value: string;
  type: string;
};

export const OfferInfo = () => {
  const location = useLocation()
  const sources = useSelector(s => s.paySource.sources)
  const [selectedSource, setSelectedSource] = useState<PayTo>()
  const [offerConfig, setOfferConfig] = useState<Types.OfferConfig>()
  const [spontPayment, setSpontPayment] = useState<boolean>(false)
  const [expectedData, setExpectedData] = useState<string[]>([])
  const [expectedDataToAdd, setExpectedDataToAdd] = useState<string>("")
  const [offerInvoices, setOfferInvoices] = useState<Types.OfferInvoice[]>([])
  const [showUnpaid, setShowUnpaid] = useState<boolean>(false)
  const params = useMemo(() => {
    const p = new URLSearchParams(location.search)
    const offerId = p.get('o')
    const source = p.get('s')
    const defaultOffer = p.get('d')
    return { offerId, source, defaultOffer }
  }, [location.search])
  useEffect(() => {
    if (!params.offerId || !params.source) {
      return
    }
    const source = sources[params.source]
    if (!source) {
      return
    }
    setSelectedSource(source)
    getNostrClient(source.pasteField, source.keys).then(c =>
      c.GetUserOffer({ offer_id: params.offerId! }).then(res => {
        if (res.status !== "OK") {
          toast.error("failed to fetch offer info " + res.reason)
          console.log(res)

          return
        }
        setOfferConfig(res)
        setSpontPayment(!res.price_sats)
        setExpectedData(Object.keys(res.expected_data))
      }).catch(e => toast.error("failed to fetch offer info"))
    )
  }, [params.offerId])

  useEffect(() => {
    if (!offerConfig || !selectedSource) {
      return
    }
    getNostrClient(selectedSource.pasteField, selectedSource.keys).then(c =>
      c.GetUserOfferInvoices({ offer_id: params.offerId!, include_unpaid: showUnpaid }).then(res => {
        if (res.status !== "OK") {
          toast.error("failed to fetch offer invoices " + res.reason)
          console.log(res)

          return
        }
        setOfferInvoices(res.invoices)
      }).catch(e => toast.error("failed to fetch offer invoices"))
    )
  }, [offerConfig?.offer_id, showUnpaid])

  const save = () => {
    if (!offerConfig || !selectedSource) {
      return
    }
    const data = {
      ...offerConfig,
      expected_data: expectedData.reduce((acc, d) => ({ ...acc, [d]: Types.OfferDataType.DATA_STRING }), {}),
      price_sats: spontPayment ? 0 : offerConfig.price_sats
    }
    getNostrClient(selectedSource.pasteField, selectedSource.keys).then(c =>
      c.UpdateUserOffer(data).then(res => {
        if (res.status !== "OK") {
          toast.error("failed to update offer " + res.reason)
          return
        }

        toast.success("Offer updated")
      }).catch(e => toast.error("failed to update offer"))
    )
  }
  const addExpectedData = () => {
    if (!expectedDataToAdd) {
      return
    }
    const exists = expectedData.find(d => d === expectedDataToAdd)
    if (!exists) {
      setExpectedData([...expectedData, expectedDataToAdd])
    }
    setExpectedDataToAdd("")
  }

  const dataQuery = useMemo(() => {
    if (expectedData.length === 0) {
      return ""
    }
    return "&" + expectedData.map(e => `${e}=%[${e}]`).join('&')

  }, [expectedData])

  if (!offerConfig) {
    return <div className="Offers_container">
      <div className="Offers">
        <div className="Offers_header_text">Loading Offer...</div>

      </div>
    </div>
  }
  return (
    <div className="Offers_container" style={{ overflow: 'scroll' }}>
      <div className="Offers" >
        <div className="Offers_header_text">{offerConfig.label}</div>
        <p><span>Offer: </span>{offerConfig.offer_id}</p>
        <br />
        <p><span>Noffer: </span>{offerConfig.noffer}</p>
        <br />
        <label>Label: </label>
        <input type="text" style={{ color: 'black' }} value={offerConfig.label} onChange={e => setOfferConfig({ ...offerConfig, label: e.target.value })} />
        <br />
        <label>Expected Data: </label>
        <div>
          {expectedData.map((e, i) => <div key={i}><span onClick={() => setExpectedData(expectedData.filter(d => d !== e))}>❌</span><strong>{e}</strong>: %[{e}]</div>)}
          <input type="text" style={{ color: 'black' }} value={expectedDataToAdd} onChange={e => { if (e.target.value === encodeURIComponent(e.target.value)) { setExpectedDataToAdd(e.target.value) } }} /><span onClick={() => addExpectedData()}>➕</span>
        </div>
        <br />
        <label>Callback Url: </label>
        <input type="text" style={{ color: 'black' }} value={offerConfig.callback_url}
          onChange={e => setOfferConfig({ ...offerConfig, callback_url: e.target.value })}
          placeholder="https://yourdomain.com/callback"
        />
        <span>Query example: {"?i=%[invoice]&a=%[amount]" + dataQuery}</span>
        <br />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <label>Spontaneous Payment: </label>
          <Checkbox id="check" state={spontPayment} setState={(e) => { setSpontPayment(e.target.checked) }} />
        </div>
        {!spontPayment && <>
          <label>Price Sats: </label>
          <input type="number" style={{ color: 'black' }} value={offerConfig.price_sats} onChange={e => setOfferConfig({ ...offerConfig, price_sats: e.target.valueAsNumber })} />
        </>}
        <br />
        <button style={{ height: 40 }} onClick={() => save()}>SAVE</button>
        <br />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <label>Show unpaid: </label>
          <Checkbox id="check" state={showUnpaid} setState={(e) => { setShowUnpaid(e.target.checked) }} />
        </div>
        {offerInvoices.map((invoice, i) => <div key={i}>
          <p>Invoice: {invoice.invoice}</p>
          <br />
          <p>Amount: {invoice.amount}</p>
          <br />
          {invoice.paid_at_unix > 0 && <p>Paid at: {new Date(invoice.paid_at_unix * 1000).toLocaleString()}</p>}
          {invoice.paid_at_unix <= 0 && <p>Unpaid</p>}
          <br />
          <p>Payer Data:</p>
          {Object.keys(invoice.data).map((d, i) => <div key={i}><span>{d}: </span>{invoice.data[d]}</div>)}
          <br />
        </div>)}
      </div>
      <div style={{ height: 500 }}></div>
    </div>
  );
};
