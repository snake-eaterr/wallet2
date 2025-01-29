import { bytesToHex, concatBytes } from '@noble/hashes/utils'
import * as Types from '../../Api/pub/autogenerated/ts/types'
export const utf8Decoder: TextDecoder = new TextDecoder('utf-8')
export const utf8Encoder: TextEncoder = new TextEncoder()
export type DataPacket = { dataId: number, packetNum: number, totalPackets: number, data: Uint8Array }
export const encodeTLVDataPacket = (packInfo: DataPacket): TLV => {
    const { data, dataId, packetNum, totalPackets } = packInfo
    const tlv: TLV = {}
    tlv[2] = [integerToUint8Array(dataId)]
    tlv[3] = [integerToUint8Array(packetNum)]
    tlv[4] = [integerToUint8Array(totalPackets)]
    tlv[5] = [data]
    return tlv
}

export const decodeTLVDataPacket = (tlv: TLV): DataPacket => {
    return {
        dataId: parseInt(bytesToHex(tlv[2][0]), 16),
        packetNum: parseInt(bytesToHex(tlv[3][0]), 16),
        totalPackets: parseInt(bytesToHex(tlv[4][0]), 16),
        data: tlv[5][0]
    }
}

export const encodeListTLV = (list: Uint8Array[]): TLV => {
    const tlv: TLV = {}
    tlv[64] = list
    return tlv
}

export const decodeListTLV = (tlv: TLV): Uint8Array[] => {
    return tlv[64]
}

export const usageMetricsToTlv = (metric: Types.UsageMetric): TLV => {
    const tlv: TLV = {}
    tlv[2] = [integerToUint8Array(Math.ceil(metric.processed_at_ms / 1000))] // 6 -> 6
    tlv[3] = [integerToUint8Array(Math.ceil(metric.parsed_in_nano / 1000))] // 6 -> 12
    tlv[4] = [integerToUint8Array(Math.ceil(metric.auth_in_nano / 1000))] // 6 -> 18
    tlv[5] = [integerToUint8Array(Math.ceil(metric.validate_in_nano / 1000))] // 6 -> 24
    tlv[6] = [integerToUint8Array(Math.ceil(metric.handle_in_nano / 1000))] // 6 -> 30
    tlv[7] = [integerToUint8Array(metric.batch_size)] // 6 -> 36
    tlv[8] = [new Uint8Array([metric.batch ? 1 : 0])] // 3 -> 39
    tlv[9] = [new Uint8Array([metric.nostr ? 1 : 0])] // 3 -> 42
    tlv[10] = [new Uint8Array([metric.success ? 1 : 0])] // 3 -> 45
    return tlv
}

export const tlvToUsageMetrics = (rpcName: string, tlv: TLV): Types.UsageMetric => {
    const metric: Types.UsageMetric = {
        rpc_name: rpcName,
        processed_at_ms: parseInt(bytesToHex(tlv[2][0]), 16) * 1000,
        parsed_in_nano: parseInt(bytesToHex(tlv[3][0]), 16) * 1000,
        auth_in_nano: parseInt(bytesToHex(tlv[4][0]), 16) * 1000,
        validate_in_nano: parseInt(bytesToHex(tlv[5][0]), 16) * 1000,
        handle_in_nano: parseInt(bytesToHex(tlv[6][0]), 16) * 1000,
        batch_size: parseInt(bytesToHex(tlv[7][0]), 16),
        batch: tlv[8][0][0] === 1,
        nostr: tlv[9][0][0] === 1,
        success: tlv[10][0][0] === 1,
    }
    return metric
}

export const integerToUint8Array = (number: number): Uint8Array => {
    // Create a Uint8Array with enough space to hold a 32-bit integer (4 bytes).
    const uint8Array = new Uint8Array(4)

    // Use bitwise operations to extract the bytes.
    uint8Array[0] = (number >> 24) & 0xff // Most significant byte (MSB)
    uint8Array[1] = (number >> 16) & 0xff
    uint8Array[2] = (number >> 8) & 0xff
    uint8Array[3] = number & 0xff // Least significant byte (LSB)

    return uint8Array
}

export type TLV = { [t: number]: Uint8Array[] }
export type TLbV = { [t: number]: Uint8Array[] }
export const parseTLV = (data: Uint8Array): TLV => {
    const result: TLV = {}
    let rest = data
    while (rest.length > 0) {
        const t = rest[0]
        const l = rest[1]
        const v = rest.slice(2, 2 + l)
        rest = rest.slice(2 + l)
        if (v.length < l) throw new Error(`not enough data to read on TLV ${t}`)
        result[t] = result[t] || []
        result[t].push(v)
    }
    return result
}

export const encodeTLV = (tlv: TLV): Uint8Array => {
    const entries: Uint8Array[] = []
    Object.entries(tlv)
        .reverse()
        .forEach(([t, vs]) => {
            vs.forEach(v => {
                if (v.length > 255) throw new Error(`value too long to encode in TLV ${t}`)
                const entry = new Uint8Array(v.length + 2)
                entry.set([parseInt(t)], 0)
                entry.set([v.length], 1)
                entry.set(v, 2)
                entries.push(entry)
            })
        })

    return concatBytes(...entries)
}
export const parseTLbV = (data: Uint8Array): TLV => {
    const result: TLV = {}
    let rest = data
    while (rest.length > 0) {
        const t = rest[0]
        const l = parseInt(bytesToHex(rest.slice(1, 5)), 16)
        const v = rest.slice(5, 5 + l)
        rest = rest.slice(5 + l)
        if (v.length < l) throw new Error(`not enough data to read on TLV ${t}`)
        result[t] = result[t] || []
        result[t].push(v)
    }
    return result
}

export const encodeTLbV = (tlv: TLV): Uint8Array => {
    const entries: Uint8Array[] = []
    Object.entries(tlv)
        .reverse()
        .forEach(([t, vs]) => {
            vs.forEach(v => {
                const entry = new Uint8Array(v.length + 5)
                entry.set([parseInt(t)], 0)
                entry.set(integerToUint8Array(v.length), 1)
                entry.set(v, 5)
                entries.push(entry)
            })
        })
    return concatBytes(...entries)
}