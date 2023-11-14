import React, { useEffect, useState } from 'react';
import { ReactQrCode } from '@devmehq/react-qr-code';
import { getNostrClient } from '../../Api'

//It import svg icons library
import * as Icons from "../../Assets/SvgIconLibrary";
import { AddressType } from '../../Api/autogenerated/ts/types';
import { UseModal } from '../../Hooks/UseModal';
import { useSelector, useDispatch } from 'react-redux';
import { notification } from 'antd';
import { NotificationPlacement } from 'antd/es/notification/interface';
import axios from 'axios';
import { Modal } from '../../Components/Modals/Modal';
import { useIonRouter } from '@ionic/react';
import { Buffer } from 'buffer';
import { bech32 } from 'bech32';
import { PayTo } from '../../globalTypes';

export const Receive = () => {
  //reducer
  const paySource = useSelector((state: any) => state.paySource).map((e: any) => { return { ...e } });
  const receiveHistory = useSelector((state: any) => state.history);

  const price = useSelector((state: any) => state.usdToBTC);
  const [deg, setDeg] = useState("rotate(0deg)");
  const [vReceive, setVReceive] = useState(1);
  const { isShown, toggle } = UseModal();
  const [amount, setAmount] = useState("0");
  const [amountValue, setAmountValue] = useState("");
  const [LNInvoice, setLNInvoice] = useState("");
  const [LNurl, setLNurl] = useState("");
  const [valueQR, setValueQR] = useState("");
  const [lightningAdd, setLightningAdd] = useState("");
  const [tag, setTag] = useState(0);
  const [bitcoinAdd, setBitcoinAdd] = useState("");
  const [bitcoinAddText, setBitcoinAddText] = useState("");
  const router = useIonRouter();
  const nostrSource = paySource.filter((e: any) => e.pasteField.includes("nprofile"));

  const headerText: string[]=[
    'LNURL',
    'Lightning Invoice',
    'Chain Address'
  ]

  const buttonText: string[]=[
    'LNURL',
    'INVOICE',
    'CHAIN'
  ]

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (placement: NotificationPlacement, header: string, text: string) => {
    api.info({
      message: header,
      description:
        text,
      placement
    });
  };

  useEffect(() => {
    if (paySource.length === 0) {
      setTimeout(() => {
        router.push("/home");
      }, 1000);
      return openNotification("top", "Error", "You don't have any source!");
    } else {
      configLNURL();
      configInvoice();
      ChainAddress();
    }
  }, []);

  useEffect(()=>{
    if (receiveHistory.latestOperation!=undefined&&receiveHistory.latestOperation.identifier === LNInvoice.replaceAll("lightning:", "")) {
      setTimeout(() => {
        router.push("/home");
      }, 1000);
      return openNotification("top", "Success", "Payment received!");
    }
  },[])

  const CreateNostrInvoice = async () => {
    console.log("here", amount);

    if (!nostrSource.length) return;
    const res = await (await getNostrClient(nostrSource[0].pasteField)).NewInvoice({
      amountSats: +amount,
      memo: ""
    })

    if (res.status !== 'OK') {
      // setError(res.reason)
      return
    }
    console.log(res.invoice, " this is invoice");

    if (LNInvoice != "") {
      setValueQR(`lightning:${res.invoice}`);
    }
    setLNInvoice(`lightning:${res.invoice}`);
  }

  const CreateNostrPayLink = async () => {
    if (!nostrSource.length) return;
    const res = await (await getNostrClient(nostrSource[0].pasteField)).GetLnurlPayLink()
    
    if (res.status !== 'OK') {
      // setError(res.reason)
      return
    }

    setLNurl("lightning:" + res.lnurl);
    setValueQR("lightning:" + res.lnurl);
  }

  const copyToClip = () => {
    navigator.clipboard.writeText(valueQR)
    return openNotification("top", "Success", "Copied!");
  }

  const configInvoice = async () => {    
    const address = configLNaddress();
    if (paySource[0].pasteField.includes("nprofile")) {
      await CreateNostrInvoice();
      return;
    }
    try {
      const callAddress = await axios.get(address.valueOfQR);
      if (amount === "") {
        setAmountValue((callAddress.data.minSendable / 1000).toString())
        setAmount((callAddress.data.minSendable / 1000).toString())
      } else if (parseInt(amount) < callAddress.data.minSendable / 1000) {
        return openNotification("top", "Error", "Please set amount is bigger than" + callAddress.data.minSendable);
      }
      console.log(callAddress.data.callback + "&amount=" + callAddress.data.minSendable);

      const callbackURL = await axios.get(
        callAddress.data.callback + (callAddress.data.callback.includes('?') ? "&" : "?") + "amount=" + (amount === "" ? callAddress.data.minSendable : parseInt(amount) * 1000),
        {
          headers: {
            'Content-Type': 'application/json',
            withCredentials: false,
          }
        }
      );
      if (LNInvoice != "") {
        setValueQR("lightning:" + callbackURL.data.pr);
      }
      setLNInvoice("lightning:" + callbackURL.data.pr);
    } catch (error: any) {
      return openNotification("top", "Error", "Cors error");
    }
  }

  const configLNURL = () => {
    if (LNurl != '') return;
    if (paySource[0].pasteField.includes("nprofile")) {
      CreateNostrPayLink();
      return;
    }
    const address = configLNaddress();
    let words = bech32.toWords(Buffer.from(address.valueOfQR, 'utf8'))
    const lnaddress = bech32.encode("lnurl", words, 999999);
    setLightningAdd(address.lithningAdd)
    setLNurl("lightning:" + lnaddress);
    setValueQR("lightning:" + lnaddress);
  }

  const configLNaddress = () => {
    let lnadd = "";
    let valueOfQR = "";
    if (paySource[0].pasteField.includes("@")) {
      lnadd = paySource[0].pasteField;
      valueOfQR = "https://" + paySource[0].pasteField.split("@")[1] + "/.well-known/lnurlp/" + paySource[0].pasteField.split("@")[0];
    } else if (!paySource[0].pasteField.includes("nprofile")) {
      let { words: dataPart } = bech32.decode(paySource[0].pasteField.replace("lightning:", ""), 2000);
      let sourceURL = bech32.fromWords(dataPart);
      const payLink = Buffer.from(sourceURL).toString();
      const url = new URL(payLink);
      lnadd = url.hostname;
      valueOfQR = Buffer.from(sourceURL).toString();
    }
    return {
      lithningAdd: lnadd,
      valueOfQR: valueOfQR
    };
  }

  const ChainAddress = async () => {
    if (bitcoinAdd != '') return;
    if (!nostrSource.length) return;
    if (!nostrSource[0].pasteField.includes("nprofile")) {
      return;
    }
    const res = await (await getNostrClient(nostrSource[0].pasteField)).NewAddress({ addressType: AddressType.WITNESS_PUBKEY_HASH })
    if (res.status !== 'OK') {
      // setError(res.reason)
      return
    }
    setBitcoinAdd(res.address);
    setBitcoinAddText(
      res.address.substr(0, 5) + "..." + res.address.substr(res.address.length - 5, 5)
    )
  }

  const updateInvoice = async () => {
    setAmountValue(amount);
    configInvoice();
    setTag(1);
    toggle();
  }

  const changeQRcode = (index: number) => {
    setTag(index);
    switch (index) {
      case 0:
        setValueQR(LNurl);
        break;
    
      case 1:
        if (LNInvoice == "") {
          toggle();
          return;
        }
        setValueQR(LNInvoice);
        break;
    
      case 2:
        setValueQR(`bitcoin:${bitcoinAdd}`);
        break;
    
      default:
        break;
    }
  }

  const setAmountContent = <React.Fragment>
    <div className="Sources_notify">
      <div className="Sources_notify_title">Amount to Receive</div>
      <div className="Receive_result_input">
        <input
          type="number"
          onChange={(e) => { setAmount(e.target.value === "" ? "" : parseInt(e.target.value).toString()) }}
          placeholder="Enter amount in sats"
          value={amount}
        />
      </div>
      <div className='Receive_modal_amount'>
        ~ ${parseInt(amount === "" ? "0" : amount) === 0 ? 0 : (parseInt(amount === "" ? "0" : amount) * price.buyPrice * 0.00000001).toFixed(2)}
      </div>
      <button className="Sources_notify_button" onClick={updateInvoice}>OK</button>
    </div>
  </React.Fragment>;

  return (
    <div>
      {contextHolder}
      <div className="Receive" style={{ opacity: vReceive, zIndex: vReceive ? 1000 : -1 }}>
        <div className="Receive_QR_text">{headerText[tag]}</div>
        <div className="Receive_QR" style={{ transform: deg }}>
          {valueQR == "" ? <div></div> : <ReactQrCode
            style={{ height: "auto", maxWidth: "300px", textAlign: "center", transitionDuration: "500ms" }}
            value={valueQR}
            size={250}
            renderAs="svg"
          />
          }
          <div className="Receive_logo_container">
            {Icons.Logo()}
          </div>
        </div >
        <div className='Receive_copy'>
          {tag==1 ? '~ $' + (parseInt(amountValue === "" ? "0" : amountValue) === 0 ? 0 : (parseInt(amountValue === "" ? "0" : amountValue) * price.buyPrice * 0.00000001).toFixed(2)) : tag==2 ? bitcoinAddText : lightningAdd}
        </div>
        <div className="Receive_set_amount">
          <button onClick={toggle}>SET AMOUNT</button>
        </div>
        <div className="Receive_set_amount_copy">
          <button onClick={copyToClip} style={{ width: "130px" }}>{Icons.copy()}COPY</button>
          <div style={{ width: "20px" }} />
          <button onClick={() => { }} style={{ width: "130px" }}>{Icons.share()}SHARE</button>
        </div>
        <div className="Receive_other_options">
          <div className="Receive_lnurl">
            <button onClick={()=>{changeQRcode((tag+1)%3)}}>
              {Icons.arrowLeft()}{buttonText[(tag+1)%3]}
            </button>
          </div>
          <div className="Receive_chain">
            <button onClick={()=>{changeQRcode((tag+2)%3)}}>
              {buttonText[(tag+2)%3]}{Icons.arrowRight()}
            </button>
          </div>
        </div>
      </div >
      <Modal isShown={isShown} hide={toggle} modalContent={setAmountContent} headerText={''} />
    </div >
  )
}
