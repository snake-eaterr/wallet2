import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";
import { UseModal } from '../../Hooks/UseModal';
import { useSelector, useDispatch, selectEnabledSpends } from '../../State/store';
import axios, { isAxiosError } from 'axios';
import { useIonRouter } from '@ionic/react';
import { Modal } from '../../Components/Modals/Modal';
import SpendFromDropdown from '../../Components/Dropdowns/SpendFromDropdown';
import { defaultMempool } from '../../constants';
import { questionMark } from "../../Assets/SvgIconLibrary";
import { parseBitcoinInput, InputClassification, Destination } from '../../constants';
import { procOperationsUpdateHook, removeOptimisticOperation, updateOptimisticOperation } from '../../State/Slices/HistorySlice';
import * as Types from '../../Api/pub/autogenerated/ts/types'
import { ChainFeesInter } from '../Prefs';
import useDebounce from '../../Hooks/useDebounce';
import classnames from "classnames";
import { createLnurlInvoice, handlePayBitcoinAddress, handlePayInvoice } from '../../Api/helpers';
import { useLocation } from 'react-router';
import { addAddressbookLink, addIdentifierMemo } from '../../State/Slices/addressbookSlice';
import { toast } from "react-toastify";
import Toast from "../../Components/Toast";


const determineOperationType = (destinationType: InputClassification) => {
  switch (destinationType) {
    case InputClassification.LN_INVOICE:
    case InputClassification.LN_ADDRESS:
    case InputClassification.LNURL:
      return Types.UserOperationType.OUTGOING_INVOICE;
    case InputClassification.BITCOIN_ADDRESS:
      return Types.UserOperationType.OUTGOING_TX;
    default:
      return Types.UserOperationType.OUTGOING_INVOICE;
  }
}





export const Send = () => {

  const price = useSelector((state) => state.usdToBTC);
  const location = useLocation();

  //reducer
  const dispatch = useDispatch();
  const enabledSpendSources = useSelector(selectEnabledSpends);
  const spendSources = useSelector(state => state.spendSource)
  const mempoolUrl = useSelector(({ prefs }) => prefs.mempoolUrl) || defaultMempool;
  const fiatUnit = useSelector((state) => state.prefs.FiatUnit);
  const selectedChainFee = useSelector(({ prefs }) => prefs.selected);
  const optimisticOperations = useSelector(state => state.history.optimisticOperations)

  const [amountAssets, setAmountAssets] = useState("sats");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const { isShown, toggle } = UseModal();
  const [selectedSource, setSelectedSource] = useState(enabledSpendSources[0]);
  const [modalContent, setModalContent] = useState<undefined | null | "confirm" | "notify">();


  useEffect(() => {
    if (selectedSource && Number(selectedSource.balance) === 0) {
      const foundOneWithBalance = enabledSpendSources.find(s => Number(s.balance) > 0);
      console.log({foundOneWithBalance})
      if (foundOneWithBalance) {
        setSelectedSource(foundOneWithBalance)
      }
    } 
  }, [enabledSpendSources, selectedSource])

  const [satsPerByte, setSatsPerByte] = useState(0)
  const [fiatSymbol, setFiatSymbol] = useState('$')
  const [sendRunning, setSendRunning] = useState(false);
  
  const [to, setTo] = useState({
    input: "",
    parse: false
  });
  
  const debouncedTo = useDebounce(to.input, 500);
  const [destination, setDestination] = useState<Destination>({
    type: InputClassification.UNKNOWN,
    data: "",
  });

  const vReceive = 1;
  const router = useIonRouter();

  const updateSatsPerByte = useCallback(async () => {
    const res = await axios.get(mempoolUrl)
    const data = res.data as ChainFeesInter
    if (!selectedChainFee) {
      setSatsPerByte(data.economyFee)
      return
    }
    switch (selectedChainFee) {
      case "eco": {
        console.log("eco!")
        setSatsPerByte(data.economyFee)
        break
      }
      case "avg": {
        console.log("avg!")
        setSatsPerByte(Math.ceil((data.hourFee + data.halfHourFee) / 2))
        break
      }
      case "asap": {
        console.log("asap!")
        setSatsPerByte(data.fastestFee)
      }
    }
  }, [mempoolUrl, selectedChainFee]);

  useEffect(() => {
    if (fiatUnit.symbol) {
      setFiatSymbol(fiatUnit.symbol);
    }
  }, [fiatUnit])

  useLayoutEffect(() => {
    if (enabledSpendSources.length === 0) {
      toast.error(<Toast title="Error" message="You don't have any sources." />)
      router.push("/home");
    }
  }, [enabledSpendSources]);

  useEffect(() => {
    if (location.state) {
      const receivedDestination = location.state as Destination;
      processParsedDestination(receivedDestination);
      setTo({
        input: receivedDestination.data,
        parse: false
      });
    } else {
      const addressSearch = new URLSearchParams(location.search);
      const data = addressSearch.get("url");
      if (data) {
        setTo({
          input: data,
          parse: true
        });
      }
    }
  }, [location]);

  const processParsedDestination = async (parsedInput: Destination) => {
    if (parsedInput.type === InputClassification.LNURL &&  parsedInput.lnurlType !== "payRequest") {
      throw new Error ("Lnurl cannot be a lnurl-withdraw");
    }

    if (parsedInput.type === InputClassification.LN_INVOICE) {
      setAmount(parsedInput.amount as number);
      if (parsedInput.memo) {
        setNote(parsedInput.memo);
      }
    }
    if (parsedInput.type === InputClassification.BITCOIN_ADDRESS) {
      await updateSatsPerByte();
    }

    setDestination(parsedInput);
  }

  useEffect(() => {
    const determineReceiver = async () => {
      try {
        const parsedInput = await parseBitcoinInput(debouncedTo);
        await processParsedDestination(parsedInput);

      } catch (err: any) {
        if (isAxiosError(err) && err.response) {
          toast.error(<Toast title="Error" message={err.response.data.reason} />)
        } else if (err instanceof Error) {
          toast.error(<Toast title="Error" message={err.message} />)
        } else {
          console.log("Unknown error occured", err);
        }
      }
    }

    if (debouncedTo && to.parse) {
      determineReceiver();
    }
  }, [debouncedTo])




  const setOptimisticOperation = useCallback((amount: number, identifier: string, type: Types.UserOperationType, { operation_id, network_fee, service_fee }: { operation_id: string, network_fee: number, service_fee: number }) => {
    let optLabel = "";
    if (note) {
      optLabel = note
    }
    if (destination.type === InputClassification.LNURL ) {
      optLabel = destination.domainName!
    } else if (destination.type === InputClassification.LN_ADDRESS) {
      optLabel = destination.data;
    }
    const newOptimisticOperation = {
      amount,
      identifier,
      inbound: false,
      operationId: operation_id,
      paidAtUnix: Date.now() / 1000,
      type, network_fee,
      service_fee,
      confirmed: false,
      tx_hash: "",
      internal: true, // so that mempool query on tx info modal doesn't proc
      sourceLabel: selectedSource.label,
      source: selectedSource.id,
      optLabel
    }
    const newOps = [...optimisticOperations, newOptimisticOperation]
    dispatch(updateOptimisticOperation(newOps));
    router.push("/home")

  }, [dispatch, optimisticOperations, router, selectedSource, note, destination]);



  const handleSubmit = useCallback(async () => {
    if (destination.type === InputClassification.UNKNOWN) {
      return;
    }

    if (sendRunning) {
      return
    }

    setSendRunning(true)

    const optimisticOperationId = `opt-op-${Date.now().toString()}`;

    const operationType = determineOperationType(destination.type)
    setOptimisticOperation(amount, destination.data, operationType, { operation_id: optimisticOperationId, service_fee: 0, network_fee: 0 })
    try {
      let payRes;
      switch (destination.type) {
        case InputClassification.LN_INVOICE: {
          payRes = await handlePayInvoice(destination.data, selectedSource);
          break;
        }
        case InputClassification.LN_ADDRESS:
        case InputClassification.LNURL: {
          const invoice = await createLnurlInvoice(amount, destination);
          payRes = await handlePayInvoice(invoice, selectedSource);
          break;
        }
        case InputClassification.BITCOIN_ADDRESS: {
          payRes = await handlePayBitcoinAddress(selectedSource, destination.data, amount, satsPerByte)
        }
      }
      
      dispatch(procOperationsUpdateHook())

      if (note) {
        dispatch(addIdentifierMemo({ identifier: payRes.data, memo: note }));
      }
      if (destination.type === InputClassification.LNURL) {
        dispatch(addAddressbookLink({ identifier: payRes.data, contact: destination.domainName, address: destination.data }))
      } else if (destination.type === InputClassification.LN_ADDRESS) {
        dispatch(addAddressbookLink({ identifier: payRes.data, contact: destination.data }))
      }
      toast.success(<Toast title="Payment" message="Transaction sent." />)
    } catch (err: any) {
      if (isAxiosError(err) && err.response) {
        toast.error(<Toast title="Error" message={err.response.data.reason} />)
      } else if (err instanceof Error) {
        toast.error(<Toast title="Error" message={err.message} />)
      } else {
        console.log("Unknown error occured", err);
      }
      dispatch(removeOptimisticOperation(selectedSource.id));
    }
    setSendRunning(false);

  }, [amount, destination, dispatch, selectedSource, satsPerByte, setOptimisticOperation, sendRunning, note]);




  const confirmContent = <React.Fragment>
    <div className="Sources_notify">
      <div className="Sources_notify_title">Amount to Receive</div>
      <button className="Sources_notify_button" onClick={toggle}>OK</button>
    </div>
  </React.Fragment>;

  const notifyContent = (
    <React.Fragment>
      <div className="Sources_notify">
        <div className="Sources_notify_title">What is this?</div>
        <div className="Sources_notify_textBox">
          The Lightning Network charges fees based on the amount of sats your
          sending, and so you must have more sats than you are planning to spend
          <br />
          <br />
          To ensure high payment success rates and low overall fees, the node
          has defined a fee budget to hold in reserve when spending.
        </div>
        <button className="Sources_notify_button" onClick={toggle}>
          OK
        </button>
      </div>
    </React.Fragment>
  );

  const switchContent = (value: null | undefined | "notify" | "confirm") => {
    switch (value) {
      case "notify":
        return notifyContent;
      case "confirm":
        return confirmContent;
      default:
        return notifyContent;
    }
  };

  const setMaxValue = () => {
    if (destination.type === InputClassification.LNURL && destination.max && selectedSource.maxWithdrawable) {
      setAmount(Math.min(destination.max, parseInt(selectedSource.maxWithdrawable)))
      return;
    }
    if(selectedSource.maxWithdrawable) {
      setAmount(parseInt(selectedSource.maxWithdrawable))
    }
  }

  const Notify_Modal = () => {
    setModalContent("notify");
    toggle();
  };


  return (
    <div className='Send_container'>
      <div className="Send" style={{ opacity: vReceive, zIndex: vReceive ? 1000 : -1 }}>
        <div className="Send_header_text">Send Payment</div>
        <div className="Send_config">
          <div className="Send_amount">
            Amount:
            <div className='Send_amount_container'>
              <div className="Send_maxButton">
                {destination.type !== InputClassification.LN_INVOICE ? <button onClick={setMaxValue}>Max</button> : <div></div>}
              </div>
              <input id="send-amount-input" className="Send_amount_input" type="number" value={amount || ""} readOnly={destination.type === InputClassification.LN_INVOICE} onChange={(e) => { setAmount(+e.target.value) }} />
              <button onClick={() => { setAmountAssets(amountAssets === "BTC" ? "sats" : "BTC") }}>{amountAssets}</button>
            </div>
          </div>
          <div className='Send_available_amount'>
            {!!satsPerByte && <div className='Send_available_amount_sats'>
              <input type='number' value={satsPerByte} onChange={e => setSatsPerByte(+e.target.value)} />
              Sats per vByte
            </div>}
            <p className='Send_available_amount_amount'>
              ~ {fiatSymbol}{amount === 0 ? 0 : (amount * price.buyPrice * (amountAssets === "BTC" ? 1 : 0.00000001)).toFixed(2)}
            </p>
          </div>
          <div className="Send_to">
            <p>To:</p>
            <input id="bitcoin-input" type="text" placeholder="Invoice, Lnurl-p or Lightning Address" value={to.input} onChange={(e) => setTo({input: e.target.value.toLocaleLowerCase(), parse: true})} />
          </div>
          <div className="Send_for">
            <p>For:</p>
            <input id="memo-input" type="text" placeholder="Add a note" value={note} onChange={(e) => { setNote(e.target.value) }} />
          </div>
          <div className="Send_from">
            <p>Spend From:</p>
            <SpendFromDropdown values={enabledSpendSources} value={selectedSource} callback={setSelectedSource} />
          </div>
        </div>
        <div className='Send_note'>
          <div>
            Note: {`NUM`} sats from your balance is held in reserve for network fees.
            <span onClick={Notify_Modal}>{questionMark()}</span>
          </div>
        </div>
      </div>
      <div className="Send_other_options">
        <div className="Send_lnurl">
          <div className="Send_set_amount_copy">
            <button onClick={() => { router.push("/home") }}>{Icons.Close()}CANCEL</button>
          </div>
        </div>
        <div className="Send_chain">
          <div className={classnames({
            ["Send_set_amount_copy"]: true,
            ["Send_not_clickable"]:
              destination.type === InputClassification.UNKNOWN
              ||
              selectedSource.maxWithdrawable === "0"
              ||
              optimisticOperations.find(op => op.source === selectedSource.id)
          })}>
            <button id="send-button" onClick={handleSubmit}>{Icons.send()}SEND</button>
          </div>
        </div>
      </div>
      <Modal isShown={isShown} hide={toggle} modalContent={switchContent(modalContent)} headerText={''} />
    </div>
  )
}