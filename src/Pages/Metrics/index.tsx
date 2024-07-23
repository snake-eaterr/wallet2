import { useCallback, useEffect, useMemo, useState } from 'react';
import { useIonRouter } from "@ionic/react";
import { Chart as ChartJS, registerables, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2'
ChartJS.register(...registerables, Legend);
import * as Icons from "../../Assets/SvgIconLibrary";
import { useDispatch, useSelector } from '../../State/store';
import { getHttpClient, getNostrClient } from '../../Api';
import * as Types from '../../Api/pub/autogenerated/ts/types';
import { LndGraphs, processLnd } from './dataProcessor';
import styles from "./styles/index.module.scss";
import classNames from 'classnames';
import moment from 'moment';
import { toggleLoading } from '../../State/Slices/loadingOverlay';
import { stringToColor } from '../../constants';
import Dropdown from '../../Components/Dropdowns/LVDropdown';
import { toast } from "react-toastify";
import Toast from "../../Components/Toast";
import { SpendFrom } from '../../globalTypes';

const trimText = (text: string) => {
  return text.length < 10 ? text : `${text.substring(0, 5)}...${text.substring(text.length - 5, text.length)}`
}

const getTimeAgo = (secondsAgo: number) => {
  return moment().subtract(secondsAgo, 'seconds').fromNow();
}

type ResultError = { status: 'ERROR', reason: string }

type Creds = { url: string, metricsToken: string }
type ChannelsInfo = {
  offlineChannels: number
  onlineChannels: number
  pendingChannels: number
  closingChannels: number
  openChannels: number[]
  closeChannels: number[]
  ChainCreditRoot: number[]
  bestLocalChan: string
  bestRemoteChan: string
}
type AppsInfo = {
  totalBalance: number
  totalGainAmt: number
  totalGainPct: number
  appsUsers: { appName: string, users: number, invoices: number }[]
}
const saveCreds = (creds: Creds) => {
  localStorage.setItem("metrics-creds", JSON.stringify(creds))
}
const getCreds = () => {
  const v = localStorage.getItem("metrics-creds")
  if (!v) {
    return null
  }
  return JSON.parse(v) as Creds
}

export enum Period {
  THIS_WEEK = "This Week",
  THIS_MONTH = "This Month",
  THIS_YEAR = "This Year",
  ALL_TIME = "All Time",
}

const periodOptionsArray = Object.values(Period);

const getUnixTimeRange = (period: Period) => {
  const now = new Date();
  let from_unix: number, to_unix: number;

  switch (period) {
    case Period.THIS_WEEK: {
      const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).setHours(0, 0, 0, 0);
      const lastDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 6)).setHours(23, 59, 59, 999);
      from_unix = Math.floor(firstDayOfWeek / 1000);
      to_unix = Math.floor(lastDayOfWeek / 1000);
      break;
    }

    case Period.THIS_MONTH: {
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).setHours(23, 59, 59, 999);
      from_unix = Math.floor(firstDayOfMonth / 1000);
      to_unix = Math.floor(lastDayOfMonth / 1000);
      break;
    }

    case Period.THIS_YEAR: {
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1).getTime();
      const lastDayOfYear = new Date(now.getFullYear(), 11, 31).setHours(23, 59, 59, 999);
      from_unix = Math.floor(firstDayOfYear / 1000);
      to_unix = Math.floor(lastDayOfYear / 1000);
      break;
    }
    case Period.ALL_TIME:
      return undefined
  }

  return { from_unix, to_unix };
}

export const Metrics = () => {
  //const [url, setUrl] = useState("")
  //const [metricsToken, setMetricsToken] = useState("")
  const router = useIonRouter();

  const [loading, setLoading] = useState(true)
  const [lndGraphsData, setLndGraphsData] = useState<LndGraphs>()
  const [channelsInfo, setChannelsInfo] = useState<ChannelsInfo>()
  const [appsInfo, setAppsInfo] = useState<AppsInfo>()
  const [period, setPeriod] = useState<Period>(Period.ALL_TIME);
  const [firstRender, setFirstRender] = useState(true);
  const [error, setError] = useState("")

  const spendSources = useSelector(state => state.spendSource)
  const dispatch = useDispatch();

  const otherOptions = periodOptionsArray.filter((o) => o !== period);
  const selectedSource = useMemo(() => {
    return spendSources.order.find(p => !!spendSources.sources[p].adminToken)
  }, [spendSources])

  useEffect(() => {
    fetchMetrics();
  }, [period])

  const fetchMetrics = useCallback(async () => {
    console.log("fetching metrics")
    if (!selectedSource) {
      setError("no available admin source found")
      setLoading(false)
      return
    }
    const source = spendSources.sources[selectedSource]
    if (!source || !source.adminToken) {
      setError("no available admin source found")
      setLoading(false)
      return
    }
    dispatch(toggleLoading({ loadingMessage: "Fetching metrics..." }));
    const client = await getNostrClient(source.pasteField, source.keys!) // TODO: write migration to remove type override
    const periodRange = getUnixTimeRange(period);
    let usage: ResultError | ({ status: 'OK' } & Types.UsageMetrics), apps: ResultError | ({ status: 'OK' } & Types.AppsMetrics), lnd: ResultError | ({ status: 'OK' } & Types.LndMetrics);
    try {
      usage = await client.GetUsageMetrics()
      apps = await client.GetAppsMetrics({ include_operations: true, ...periodRange });
      lnd = await client.GetLndMetrics({ ...periodRange });
    } catch (error) {
      console.error(error);
      setLoading(false);
      dispatch(toggleLoading({ loadingMessage: "" }));
      toast.error(<Toast title="Metrics Error" message={`Failed to fetch metrics. ${error instanceof Error ? error.message : ""}`} />);
      return;
    }
    if (usage.status !== 'OK') {
      setLoading(false);
      dispatch(toggleLoading({ loadingMessage: "" }));
      toast.error(<Toast title="Metrics Error" message={usage.reason} />);
      return;
    }
    if (apps.status !== 'OK') {
      setLoading(false);
      dispatch(toggleLoading({ loadingMessage: "" }));
      toast.error(<Toast title="Metrics Error" message={apps.reason} />);
      return;
    }
    if (lnd.status !== 'OK') {
      setLoading(false);
      dispatch(toggleLoading({ loadingMessage: "" }));
      toast.error(<Toast title="Metrics Error" message={lnd.reason} />);
      return;
    }
    const lndGraphs = processLnd(lnd)
    setLndGraphsData(lndGraphs)
    const bestLocal = { n: "", v: 0 }
    const bestRemote = { n: "", v: 0 }
    const openChannels = lnd.nodes[0].open_channels.map(c => {
      if (c.remote_balance > bestRemote.v) {
        bestRemote.v = c.remote_balance; bestRemote.n = c.channel_id
      }
      if (c.local_balance > bestLocal.v) {
        bestLocal.v = c.remote_balance; bestLocal.n = c.channel_id
      }
      return c.lifetime
    })
    setChannelsInfo({
      closingChannels: lnd.nodes[0].closing_channels,
      offlineChannels: lnd.nodes[0].offline_channels,
      onlineChannels: lnd.nodes[0].online_channels,
      pendingChannels: lnd.nodes[0].pending_channels,
      closeChannels: lnd.nodes[0].closed_channels.map(c => c.closed_height),
      openChannels,
      ChainCreditRoot: [],
      bestLocalChan: bestLocal.n,
      bestRemoteChan: bestRemote.n
    })
    let totalAppsFees = 0
    let appsFeesInFrame = 0
    const appsUsers = apps.apps.map(app => {
      totalAppsFees += app.total_fees
      appsFeesInFrame += app.fees
      return { appName: app.app.name, users: app.users.total, invoices: app.invoices }
    })
    setAppsInfo({
      totalBalance: totalAppsFees,
      totalGainAmt: appsFeesInFrame,
      totalGainPct: (appsFeesInFrame / totalAppsFees) * 100,
      appsUsers
    })
    setLoading(false)
    dispatch(toggleLoading({ loadingMessage: "" }));
  }, [dispatch, period]);

  if (loading) {
    return <div>loading...</div>
  }

  if (!lndGraphsData || !channelsInfo || !appsInfo || error) {
    return <div style={{ color: 'red' }}>
      something went wrong {error}

    </div>
  }
  return <div>
    <div className={styles["metrics-container"]}>

      <div className={classNames(styles["section"], styles["chart"])}>
        <Line
          data={lndGraphsData.balanceEvents}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 5 / 2,
            elements: {
              line: {
                borderWidth: 3,
              },
              point: {
                radius: 0,
              },
            },
            plugins: {
              legend: {
                display: true,
                position: "chartArea",
                align: "start",
                maxWidth: 12,
                labels: {
                  boxWidth: 10,
                  boxHeight: 10
                },

              },
            },
            scales: {
              x: {
                grid: {
                  color: "#383838"
                },
              },
              y: {
                grid: {
                  color: "#383838"
                },
                ticks: {
                  display: false
                }
              }
            },
          }}
        />
      </div>
      <div className={styles["section"]}>
        <div className={styles["between"]}>
          <div className={styles["center"]}>
            <Dropdown<Period>
              setState={(value) => setPeriod(value)}
              otherOptions={otherOptions}
              jsx={<div className={classNames(styles["center"], styles["box"])}>
                <span className={styles["icon_pub"]}>{Icons.Automation()}</span>
                <span>{period}</span>
              </div>}
            />
            <div className={classNames(styles["arrows"], styles["box"])}>
              {Icons.pathLeft()}{Icons.verticalLine()}{Icons.pathLeft()}
            </div>
          </div>
          <div onClick={() => router.push('/manage')} style={{cursor: "pointer"}} className={classNames(styles["box"], styles["border"])}>
            Manage
          </div>

        </div>
      </div>
      <div className={styles["section"]}><span className={styles["separator"]}></span></div>
      <div className={styles["section"]}>
        <h3 className={styles["sub-title"]}>Events</h3>
        <div className={styles["column-flex"]}>
          {
            <div className={styles["event-item"]}><span> ⚡️&nbsp; Channel Opened</span> <span className={styles["date"]}>{getTimeAgo(Math.min(...channelsInfo.openChannels))}</span></div>
          }
          {
            <div className={styles["event-item"]}><span> 🚨&nbsp; Channel Closed</span> <span className={styles["date"]}>{getTimeAgo(Math.min(...channelsInfo.closeChannels))}</span></div>
          }
          {
            <div className={styles["event-item"]}><span> 🔗&nbsp; Chain credit to root</span> <span className={styles["date"]}>{getTimeAgo(Math.min(...channelsInfo.ChainCreditRoot))}</span></div>
          }
        </div>
      </div>
      <div className={styles["section"]}>
        <h3 className={styles["sub-title"]}>Highlights</h3>
        <div className={styles["cards-container"]}>
          <div className={classNames(styles["card"], styles["net"])}>
            <div className={styles["top"]}>
              <div className={styles["flx-column"]}>
                <h4 className={styles["card-label"]}>Net</h4>
                <span className={styles["number"]}> +{
                  new Intl.NumberFormat('fr-FR').format(appsInfo.totalGainPct)
                }%</span>
              </div>
              <div className={styles["flx-column"]}>
                <span className={classNames(styles["number"], styles["text-right"])}> {
                  new Intl.NumberFormat('fr-FR').format(appsInfo.totalBalance)
                }</span>
                <div className={classNames(styles["price"], styles["flex-row"])}>
                  {
                    appsInfo.totalGainAmt < 0 ? Icons.PriceDown() : Icons.PriceUp()
                  }
                  <span>{appsInfo.totalGainAmt > 0 ? '+' + new Intl.NumberFormat('fr-FR').format(appsInfo.totalGainAmt) : new Intl.NumberFormat('fr-FR').format(appsInfo.totalGainAmt)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className={classNames(styles["card"], styles["channels"])}>
            <div className={styles["top"]}>
              <h4 className={styles["card-label"]}>Channels</h4>
            </div>
            <div className={classNames(styles["bot"], styles["channels-grid"])}>
              <div className={styles["channel"]}><span className={styles["dot"]}></span><span>{channelsInfo.onlineChannels} online</span></div>
              <div className={styles["channel"]}><span className={styles["dot"]}></span><span>{channelsInfo.pendingChannels} pending</span></div>
              <div className={styles["channel"]}><span className={styles["dot"]}></span><span>{channelsInfo.offlineChannels} offline</span></div>
              <div className={styles["channel"]}><span className={styles["dot"]}></span><span>{channelsInfo.closingChannels} closing</span></div>
            </div>
          </div>
          <div className={classNames(styles["card"], styles["top-channels"])}>
            <div className={styles["top"]}>
              <h4 className={styles["card-label"]}>Top Channels</h4>
            </div>
            <div className={classNames(styles["bot"], styles["top-channels"])}>
              <div className={styles["row"]}>
                <span className={styles["label"]}>In:&nbsp;</span>
                <span>{trimText(channelsInfo.bestLocalChan)}</span>
              </div>
              <div className={styles["row"]}>
                <span className={styles["label"]}>Out:&nbsp;</span>
                <span> {trimText(channelsInfo.bestRemoteChan)}</span>
              </div>
            </div>
          </div>
          <div className={classNames(styles["card"], styles["top-channels"], styles["routing"])}>
            <div className={styles["top"]}>
              <h4 className={styles["card-label"]}>Routing</h4>
            </div>
            <div className={classNames(styles["bot"], styles["top-channels"])}>
              <div className={styles["row"]}>
                {lndGraphsData.forwardedEvents} forwards
              </div>
              <div className={styles["row"]}>
                {lndGraphsData.forwardRevenue} sats
              </div>
            </div>
          </div>
          {
            appsInfo.appsUsers.map(app => (
              <div key={app.appName}
                className={classNames(styles["card"], styles["top-channels"])}
                style={{ borderColor: stringToColor(app.appName) }}
              >
                <div className={styles["top"]}>
                  <h4 className={styles["card-label"]}>{app.appName}</h4>
                </div>
                <div className={classNames(styles["bot"], styles["top-channels"])}>
                  <div className={styles["row"]}>
                    {app.users} users
                  </div>
                  <div className={styles["row"]}>
                    {app.invoices} invoices
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>
      <br />
      <div className='metric-footer'>
        <i>Connected to <br />npub123456</i>
      </div>
    </div>
  </div>
}