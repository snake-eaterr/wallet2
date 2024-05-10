import { lightningIcon, linkIcon } from "../../Assets/SvgIconLibrary";
import * as Types from "../../Api/pub/autogenerated/ts/types";
import * as Icons from "../../Assets/SvgIconLibrary";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useSelector } from "../../State/store";
import { getIdentifierLink } from "../../State/Slices/addressbookSlice";
import moment from 'moment';
import { motion } from "framer-motion";
import { TransactionInfo } from "../../Pages/Home";
import TransactionInfoModal from "../TransactionInfoModal";
import { decode } from "@gandlaf21/bolt11-decode";

const stateIcons = (icon?: string) => {
  switch (icon) {
    case 'lightning':
      return lightningIcon();

    case 'linked':
      return linkIcon();
    case "hour":
      return Icons.hourGlass()
  }
}
interface Props {
  operation: TransactionInfo;
  underline: boolean;

}

export const SwItem = ({
  operation,
  underline,
}: Props): JSX.Element => {
  const addressbook = useSelector(({ addressbook }) => addressbook);
  const price = useSelector((state) => state.usdToBTC);
  const fiatUnit = useSelector((state) => state.prefs.FiatUnit);

  underline = underline ?? true;

  const [shown, setShown] = useState(false);
  const [fiatSymbol, setFiatSymbol] = useState('$')

  const getOperationLabel = useCallback(() => {
    if (operation.operationId.startsWith("opt-op")) {
      return operation.optLabel || operation.sourceLabel || "Deleted Source"
    }
    const note = (addressbook.identifierToMemo || {})[operation.identifier]
    if (note) {
      return note
    }
    const link = getIdentifierLink(addressbook, operation.identifier);
    if (link !== operation.identifier) {
      return link
    }
    if ((operation.type === Types.UserOperationType.INCOMING_INVOICE || operation.type === Types.UserOperationType.OUTGOING_INVOICE)) {
      const decodedInvoice = decode(operation.identifier);
      const description = decodedInvoice.sections.find(section => section.name === "description");
      if (description && description.value) {
        try {
          const parsedDescription = JSON.parse(description.value);
          if (Array.isArray(parsedDescription) && Array.isArray(parsedDescription[0])) {
            const memo = parsedDescription[0][1];
            return memo;
          }
        } catch {
          console.log("")
        }
        return description.value;
      }
    }
    return operation.sourceLabel
  }, [addressbook, operation])

  useEffect(() => {
    if (fiatUnit.symbol) {
      setFiatSymbol(fiatUnit.symbol);
    }
  }, [fiatUnit])

  const transactionObject = useMemo(() => {

    const isChain = operation.type === Types.UserOperationType.OUTGOING_TX || operation.type === Types.UserOperationType.INCOMING_TX
    let date = "Pending"
    if (operation.confirmed) {
      date = moment(operation.paidAtUnix * 1000).fromNow()
    }
    const label = getOperationLabel()
    const totalPaidSats = operation.amount + operation.network_fee + operation.service_fee
    return {
      priceImg: operation.inbound ? Icons.PriceUp : Icons.PriceDown,
      station: label.length < 30 ? label : `${label.substring(0, 7)}...${label.substring(label.length - 7, label.length)}`,
      changes: `${operation.inbound ? "" : "-"}${totalPaidSats}`,
      date,
      price: Math.round(100 * totalPaidSats * price.sellPrice / (100 * 1000 * 1000)) / 100,
      stateIcon: !operation.confirmed ? "hour" : isChain ? "linked" : "lightning",
    }
  }, [operation, price, getOperationLabel]);

  return (
    <>
      <motion.div
        className="SwItem"
        onClick={() => setShown(true)}
        layoutId={operation.operationId}
      >
        <div className="SwItem_left">
          {stateIcons(transactionObject.stateIcon)}
          <div className="SwItem_text">
            <div className="SwItem_date">{transactionObject.date}</div>
            <div className="SwItem_station">{transactionObject.station}</div>
          </div>
        </div>
        <div className="SwItem_right">
          <div className="SwItem_price">
            <div className="SwItem_price_img">{transactionObject.priceImg()}</div>
            <div className="SwItem_price_text">{transactionObject.changes}</div>
          </div>
          <div className="SwItem_changes">~ {fiatSymbol}{transactionObject.price}</div>
        </div>
      </motion.div>
      <div className={underline ? "SwItem_divider" : ""}></div>
      {
        shown
        &&
        <TransactionInfoModal key={operation.operationId} operation={operation} hide={() => setShown(!shown)} price={price} />
      }
    </>
  )
}