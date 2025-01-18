/* import * as Types from '../../Api/pub/autogenerated/ts/types'
const z = (n: number) => n < 10 ? `0${n}` : `${n}`
export type MetricsData = { entries: Types.UsageMetric[], currentPage: number, allPages: number[] }
export const StatsGraph = (methodMetrics: MetricsData) => {
    const labels = [] as string[]
    const handleInNanoData = [] as number[]
    const authInNanoData = [] as number[]
    const parsedInNanoData = [] as number[]
    const validateInNanoData = [] as number[]

    const graphData = [] as number[]
    methodMetrics.entries.forEach(metric => {
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
        //fill: true,
        //color: randomHexColors[randomHexColors.length % i],
        //tension: 0.1,
    }))
    return <div key={rpcMethod} style={{ width: 600, border: '1px solid black' }}>
        <h2>{rpcMethod}</h2>
        <Line data={{
            labels,
            datasets,
        }} />
        <div style={{ textAlign: 'center' }}>{methodMetrics.allPages.map(p =>
            <span style={{ margin: '2px', textDecoration: p === methodMetrics.currentPage ? 'underline' : ' none' }}
                onClick={() => loadMore(selectedApp, rpcMethod, p)} key={p}
            >{p}</span>
        )}<span>(last 100)</span></div>
    </div>
} */