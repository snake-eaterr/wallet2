import { toast } from "react-toastify";
import { Buffer } from 'buffer';
import { Chart, Line } from 'react-chartjs-2'
import * as Types from '../../Api/pub/autogenerated/ts/types'
import { useMemo, useState } from 'react'
import { SpendFrom } from "../../globalTypes";
import { getNostrClient } from "../../Api";
import { parseTLV, tlvToUsageMetrics } from "./tlv";
export type MetricsData = { entries: Types.UsageMetric[], currentPage: number, allPages: number[] }
export type SelectedMetrics = {
    auth_in_nano?: boolean
    handle_in_nano?: boolean
    parsed_in_nano?: boolean
    validate_in_nano?: boolean
}
type Props = { selectedSource: SpendFrom | undefined, appId: string, rpcMethod: string, methodMetrics: MetricsData, successFilter: 'yes' | 'no' | '', nostrFilter: 'yes' | 'no' | '', selectedMetrics: SelectedMetrics }
export const z = (n: number) => n < 10 ? `0${n}` : `${n}`
export const StatsGraph = ({ selectedSource, appId, rpcMethod, methodMetrics, nostrFilter, successFilter, selectedMetrics }: Props) => {
    const [shownPage, setShownPage] = useState<number>(-1)
    const [pagesData, setPagesData] = useState<Record<number, Types.UsageMetric[]>>({})
    const { datasets, labels } = useMemo(() => {
        const labels = [] as string[]
        const handleInNanoData = [] as number[]
        const authInNanoData = [] as number[]
        const parsedInNanoData = [] as number[]
        const validateInNanoData = [] as number[]
        const pageData = shownPage === -1 ? methodMetrics.entries : pagesData[shownPage] || []
        pageData.forEach(metric => {
            if (successFilter === 'yes' && !metric.success) return
            if (successFilter === 'no' && metric.success) return
            if (nostrFilter === 'yes' && !metric.nostr) return
            if (nostrFilter === 'no' && metric.nostr) return
            const d = new Date(metric.processed_at_ms)
            const date = `${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`
            labels.push(date)
            if (selectedMetrics.auth_in_nano) authInNanoData.push(metric.auth_in_nano / 1000000)
            if (selectedMetrics.handle_in_nano) handleInNanoData.push(metric.handle_in_nano / 1000000)
            if (selectedMetrics.parsed_in_nano) parsedInNanoData.push(metric.parsed_in_nano / 1000000)
            if (selectedMetrics.validate_in_nano) validateInNanoData.push(metric.validate_in_nano / 1000000)
        })
        const datas = [
            { label: "Auth time (ms)", data: authInNanoData, color: '#66c2a5' },
            { label: "Handle time (ms)", data: handleInNanoData, color: '#fee08b' },
            { label: "Parsed time (ms)", data: parsedInNanoData, color: '#5e4fa2' },
            { label: "Validate time (ms)", data: validateInNanoData, color: '#9e0142' },]
        const datasets = datas.filter(({ data }) => data.length > 0).map((d, i) => ({
            label: d.label,
            data: d.data,
            backgroundColor: d.color,
            borderColor: d.color,
            color: d.color,
        }))
        console.log({ nostrFilter, successFilter, datasets, labels })
        return { datasets, labels }
    }, [shownPage, pagesData, methodMetrics, selectedMetrics, nostrFilter, successFilter])

    const loadMore = async (app: string, rpcMethod: string, page: number) => {
        if (!selectedSource) {
            toast.error('Something went wrong')
            return
        }
        if (shownPage === page) return
        setShownPage(page)
        const c = await getNostrClient(selectedSource.pasteField, selectedSource.keys)
        const res = await c.GetSingleUsageMetrics({ app_id: app, metrics_name: rpcMethod, page })
        if (res.status !== 'OK') {
            toast.error('Error fetching metrics ' + res.reason)
            return
        }
        const moreData = {
            ...pagesData, [page]: res.base_64_tlvs.map(tlvString => {
                const decoded = Uint8Array.from(Buffer.from(tlvString, 'base64'))
                const tlv = parseTLV(decoded)
                return tlvToUsageMetrics("", tlv)
            })
        }
        setPagesData(moreData)
    }

    return <div key={rpcMethod} style={{ width: 600, border: '1px solid black' }}>
        <h2>{rpcMethod}</h2>
        <Line data={{
            labels,
            datasets,
        }} />
        <div style={{ textAlign: 'center' }}>
            {methodMetrics.allPages.map(p =>
                <span style={{ margin: '2px', textDecoration: p === shownPage ? 'underline' : ' none' }}
                    onClick={() => loadMore(appId, rpcMethod, p)} key={p}
                >{p}</span>
            )}
            <span style={{ margin: '2px', textDecoration: -1 === shownPage ? 'underline' : ' none' }}
                onClick={() => loadMore(appId, rpcMethod, -1)} key={-1}>(last 100)</span>
        </div>
    </div>
} 