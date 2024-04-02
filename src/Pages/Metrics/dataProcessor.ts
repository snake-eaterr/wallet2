import * as Types from '../../Api/autogenerated/ts/types'
import { ChartData } from 'chart.js';
type TimeFrame = { type: '1min', ms: 60_000 } | { type: '5min', ms: 300_000 } | { type: '1h', ms: 3_600_000 }
type SourceData = {
    usage: Types.UsageMetrics
    apps: Types.AppsMetrics
    lnd: Types.LndMetrics
}
type DataPoint<T extends number | string> = { x: T, y: number }
export type BarGraph = ChartData<"bar", DataPoint<number | string>[], string>
export type LineGraph = ChartData<"line", DataPoint<number | string>[], string>
export type PieGraph = ChartData<"pie", number[], string>
export type UsageGraphs = {
    requestsPerTime: BarGraph
    requestsPerMethod: BarGraph
    handleTimePerMethod: BarGraph
}
export type LndGraphs = {
    balanceEvents: LineGraph
    forwardedEvents: number
    forwardRevenue: number
}
export type AppGraphs = {
    appsBalances: PieGraph
    feesPaid: BarGraph
    movingSats: BarGraph
}
export type Graphs = UsageGraphs & LndGraphs & AppGraphs
type DataRecord<T extends number | string> = Record<T, DataPoint<T>>
export const processData = (data: SourceData, timeFrame: TimeFrame): Graphs => {
    const { usage, apps, lnd } = data

    const usageGraphs = processUsage(usage, timeFrame)
    const lndGraphs = processLnd(lnd)
    const appsGraphs = processApps(apps)
    return {
        ...usageGraphs,
        ...lndGraphs,
        ...appsGraphs
    }
}

export const ProcessLndData = () => {

}

const processApps = (apps: Types.AppsMetrics): { appsBalances: PieGraph, feesPaid: BarGraph, movingSats: BarGraph } => {
    const appsLabels: string[] = []
    const balances: number[] = []
    const feesPaid: Record<string, { x: string, y: number }[]> = {}
    const satsComing: Record<string, { x: string, y: number }[]> = {}
    const satsLeaving: Record<string, { x: string, y: number }[]> = {}
    const satsMoving: Record<string, { x: string, y: number }[]> = {}
    let minUnix = Number.MAX_SAFE_INTEGER
    let maxUnix = 0
    apps.apps.forEach(app => {
        appsLabels.push(app.app.name)
        balances.push(app.app.balance)
        app.operations.forEach(op => {
            if (op.paidAtUnix > maxUnix) maxUnix = op.paidAtUnix
            if (op.paidAtUnix < minUnix) minUnix = op.paidAtUnix
            if (feesPaid[app.app.name]) {
                feesPaid[app.app.name].push({ x: (op.paidAtUnix * 1000).toString(), y: op.service_fee })
            } else {
                feesPaid[app.app.name] = [{ x: (op.paidAtUnix * 1000).toString(), y: op.service_fee }]
            }
            if (op.type === Types.UserOperationType.INCOMING_INVOICE || op.type === Types.UserOperationType.INCOMING_TX) {
                if (satsComing[app.app.name]) {
                    satsComing[app.app.name].push({ x: (op.paidAtUnix * 1000).toString(), y: op.amount })
                } else {
                    satsComing[app.app.name] = [{ x: (op.paidAtUnix * 1000).toString(), y: op.amount }]
                }
            } else if (op.type === Types.UserOperationType.OUTGOING_INVOICE || op.type === Types.UserOperationType.OUTGOING_TX) {
                if (satsLeaving[app.app.name]) {
                    satsLeaving[app.app.name].push({ x: (op.paidAtUnix * 1000).toString(), y: op.amount })
                } else {
                    satsLeaving[app.app.name] = [{ x: (op.paidAtUnix * 1000).toString(), y: op.amount }]
                }
            } else if (op.type === Types.UserOperationType.INCOMING_USER_TO_USER || op.type === Types.UserOperationType.OUTGOING_USER_TO_USER) {
                if (satsMoving[app.app.name]) {
                    satsMoving[app.app.name].push({ x: (op.paidAtUnix * 1000).toString(), y: op.amount })
                } else {
                    satsMoving[app.app.name] = [{ x: (op.paidAtUnix * 1000).toString(), y: op.amount }]
                }
            }
        })
    })
    const feesPaidDataset = Object.entries(feesPaid).map(([k, events]) => ({ data: events, label: `collected sats ${k}` }))
    const incomingSats = Object.entries(satsComing).map(([k, events]) => ({ data: events, label: `incoming sats ${k}` }))
    const outgoingSats = Object.entries(satsLeaving).map(([k, events]) => ({ data: events, label: `outgoing sats ${k}` }))
    const movingSats = Object.entries(satsMoving).map(([k, events]) => ({ data: events, label: `moving sats ${k}` }))
    return {
        appsBalances: {
            datasets: [
                { data: balances, label: `apps balance`, clip: false },
            ],
            labels: appsLabels,
        },
        feesPaid: {
            datasets: feesPaidDataset,
        },
        movingSats: {
            datasets: [...incomingSats, ...outgoingSats, ...movingSats]
        }
    }
}

export const processLnd = (lnd: Types.LndMetrics): LndGraphs => {
    let minBlock = Number.MAX_SAFE_INTEGER
    let maxBlock = 0
    let forwardedEvents = 0
    let forwardedSats = 0
    const totalChainEvents: { x: number; y: number; }[][] = []
    const channelEvents: { x: number; y: number; }[][] = []

    
    const channelsBalanceRemote: Record<string, { x: number; y: number; }> = {}
    const channelsBalanceLocal: Record<string, { x: number; y: number; }> = {}
    lnd.nodes.forEach((node, i) => {
        const chainEvents = node.chain_balance_events.map(e => {
            if (e.block_height > maxBlock) maxBlock = e.block_height
            if (e.block_height < minBlock) minBlock = e.block_height
            return { x: e.block_height, y: e.confirmed_balance }
        })
        totalChainEvents.push(chainEvents)
        node.channels_balance_events.map(e => {
            if (e.block_height > maxBlock) maxBlock = e.block_height
            if (e.block_height < minBlock) minBlock = e.block_height
            const datasetId = `${i + 1}:${e.block_height}`
            if (channelsBalanceRemote[datasetId]) {
                channelsBalanceRemote[datasetId].y += e.remote_balance_sats
                channelsBalanceLocal[datasetId].y += e.local_balance_sats
            } else {
                channelsBalanceRemote[datasetId] = { x: e.block_height, y: e.remote_balance_sats }
                channelsBalanceLocal[datasetId] = { x: e.block_height, y: e.local_balance_sats }
            }
        })

        node.channel_routing.forEach(e => {
            forwardedEvents += e.events_number
            forwardedSats += e.missed_forward_fee_as_output
        })
    })
    const labels = generateTimeSeriesLabels(minBlock, maxBlock)
    const chainDatasets = totalChainEvents.map((events, i) => ({ data: events, label: 'Chain' }))
    const tmp = Object.entries(channelsBalanceLocal).map(([k, data]) => data)
    channelEvents.push(tmp);

    const localChannelBalance = channelEvents.map((events, i) => ({ data: events, label: 'Channels' }))
    return {
        balanceEvents: {
            datasets: [...chainDatasets, ...localChannelBalance],
            labels
        },
        forwardedEvents: Math.floor(forwardedEvents / 2),
        forwardRevenue: forwardedSats
    }
}

const processUsage = (usage: Types.UsageMetrics, timeFrame: TimeFrame): { requestsPerTime: BarGraph, requestsPerMethod: BarGraph, handleTimePerMethod: BarGraph } => {
    const requestsInTimeFrame: DataRecord<string> = {}
    const requestsPerMethod: DataRecord<string> = {}
    const handleTimePerMethod: DataRecord<string> = {}
    let minFrame = Number.MAX_SAFE_INTEGER
    let maxFrame = 0
    usage.metrics.forEach(m => {
        const timeSection = Math.floor(m.processed_at_ms / timeFrame.ms)
        const formattedTime = new Date(timeSection * timeFrame.ms).toISOString()
        if (timeSection < minFrame) {
            minFrame = timeSection
        }
        if (timeSection > maxFrame) {
            maxFrame = timeSection
        }
        incrementRecordValue(requestsInTimeFrame, `${formattedTime}`, 1)
        incrementRecordValue(requestsPerMethod, m.rpc_name, 1)
        incrementRecordValue(handleTimePerMethod, m.rpc_name, Math.ceil(m.handle_in_nano / 1_000_000))
    })
    const requestsInTimeFrameArr = getNumberRecordArray(requestsInTimeFrame)
    const { arr: requestsPerMethodArr, labels: requestsPerMethodLabels } = getNumberRecordArrayAndLabels(requestsPerMethod)
    const handleTimePerMethodArr = Object.values(handleTimePerMethod).map(({ x, y }) => ({ x, y: (y / requestsPerMethod[x].y) }))
    return {
        requestsPerTime: {
            datasets: [
                { data: requestsInTimeFrameArr, label: `reqs every ${timeFrame.type}`, clip: false },
            ],
            labels: generateTimeSeriesLabels(minFrame, maxFrame, timeFrame),
        },
        requestsPerMethod: {
            datasets: [
                { data: requestsPerMethodArr, label: `reqs per method`, clip: false },
            ],
            labels: requestsPerMethodLabels,
        },
        handleTimePerMethod: {
            datasets: [
                { data: handleTimePerMethodArr, label: `avg time spent handling (ms)`, clip: false },
            ],
            labels: requestsPerMethodLabels,
        },
    }
}

const incrementRecordValue = <T extends number | string>(record: DataRecord<T>, key: T, inc: number) => {
    if (record[key]) {
        record[key].y += inc
    } else {
        record[key] = { x: key, y: inc }
    }
}
const getNumberRecordArrayAndLabels = (record: DataRecord<number | string>) => {
    const arr = Object.values(record)
    arr.sort((a, b) => a.x < b.x ? -1 : 1)
    const labels = arr.map(e => e.x.toString())
    return { arr, labels }
}
const getNumberRecordArray = (record: DataRecord<number | string>) => {
    const a = Object.values(record)
    a.sort((a, b) => a.x < b.x ? -1 : 1)
    return a
}
const generateTimeSeriesLabels = (min: number, max: number, timeFrame?: TimeFrame, step = 1) => {
    const labels = []
    const diff = max - min
    let index = 0
    while (index < diff) {
        const v = min + index
        const formattedLabel = timeFrame ? new Date(v * timeFrame.ms).toISOString() : v.toString()
        labels.push(formattedLabel)
        index += step
    }
    return labels
}
