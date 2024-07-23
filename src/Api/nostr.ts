import { generatePrivateKey, nip19 } from 'nostr-tools'
import { NOSTR_PRIVATE_KEY_STORAGE_KEY, makeId } from '../constants'
import { NostrRequest } from './pub/autogenerated/ts/nostr_transport'
import NewNostrClient from './pub/autogenerated/ts/nostr_client'
import NostrRelayCluster, { NostrEvent, NostrKeyPair, RelaysSettings } from './nostrHandler'
import { CustomProfilePointer } from '../custom-nip19'
import { fetchBeacon } from '../helpers/remoteBackups'
import logger from './helpers/logger'

//import { Nip46Request, Nip46Response, serializeNip46Event } from './nip46'
export const setNostrPrivateKey = (nsec?: string) => {
    const key = nsec ? nsec : generatePrivateKey()
    localStorage.setItem(NOSTR_PRIVATE_KEY_STORAGE_KEY, key)
    return key;
}
export const getNostrPrivateKey = () => {
    return localStorage.getItem(NOSTR_PRIVATE_KEY_STORAGE_KEY)
}

export type nostrCallback<T> = { startedAtMillis: number, type: 'single' | 'stream', f: (res: T) => void }
export type Client = ReturnType<typeof NewNostrClient>


type NostrReadyClient = { client: NostrClient }
type NostrClientHolder = NostrReadyClient


export class ClientsCluster {
    clients: Record<string, NostrClientHolder> = {}
    tempClients: Record<string, NostrClientHolder> = {}
    relayCluster: NostrRelayCluster
    queueManager: QueueManager;

    constructor() {
        this.relayCluster = new NostrRelayCluster()
        this.queueManager = new QueueManager();
    }

    onRelayEvent = (event: NostrEvent) => {
        const res = JSON.parse(event.content) as { requestId: string }
        for (const key in this.clients) {
            const c = this.clients[key]
            if (c.client.onEvent(event)) {
                return
            }
        }
        for (const key in this.tempClients) {
            const c = this.tempClients[key]
            if (c.client.onEvent(event)) {
                return
            }
        }
        logger.warn("no client found for", res.requestId)
    }

    SyncClusterRelays = (relays: RelaysSettings) => {
        return new Promise<void>(res => {
            this.relayCluster.addRelays(relays, () => res(), (e) => this.onRelayEvent(e), (r) => logger.warn("disconnected from relay", r))
        })
    }

    GetNostrClient = async (nProfile: { pubkey: string, relays?: string[] } | string, keys: NostrKeyPair, temp?: boolean): Promise<Client> => {
        const { pubkey, relays }: { pubkey: string, relays?: string[] } = typeof nProfile === 'string' ? parseNprofile(nProfile) : nProfile

        const key = `${pubkey}-${keys.publicKey}`


        if (!relays) {
            throw new Error("cannot create client if no relays are provided")
        }

        const relaysSettings: RelaysSettings = {
            relays: relays.filter((item, index, self) => self.indexOf(item) === index),
            keys
        };
        return new Promise((res) => {
            this.queueManager.pushToQueue(async () => {
                const c = this.clients[key]
                if (c && !temp) {
                    const nostrClient = c.client
                    logger.info("got client for", nostrClient.getPubDst(), ":", nostrClient.getId())
                    res(nostrClient.Get())
                    return;
                }
                await this.SyncClusterRelays(relaysSettings)
                const nostrClient = new NostrClient(pubkey, keys, relays ? relays : [], (relays, to, message, keys) => this.relayCluster.Send(relays, to, message, keys))
                if (temp) {
                    this.tempClients[key] = { client: nostrClient }
                } else {
                    this.clients[key] = { client: nostrClient };
                }
                logger.info("got client for", nostrClient.getPubDst(), ":", nostrClient.getId())
                res(nostrClient.Get())
            })
        })
    }

    GetAllNostrClients = () => {
        return Object.values(this.clients).map(c => (c as NostrReadyClient).client)
    }
}

export class NostrClient {
    clientId = makeId(16)
    client: Client
    clientCbs: Record<string, nostrCallback<any>> = {}
    pubDestination: string
    relays: string[]
    latestResponseAtMillis = 0
    latestHelthReqAtMillis = 0
    settings: NostrKeyPair;
    send: (relays: string[], to: string, message: string, keys: NostrKeyPair) => void
    constructor(pubDestination: string, settings: NostrKeyPair, relays: string[], send: (relays: string[], to: string, message: string, keys: NostrKeyPair) => void) {
        this.pubDestination = pubDestination
        this.relays = relays
        this.send = send
        this.settings = settings
        this.client = NewNostrClient({
            retrieveNostrUserAuth: async () => { return this.settings.publicKey },
            retrieveNostrAdminAuth: async () => { return this.settings.publicKey },
            retrieveNostrMetricsAuth: async () => { return this.settings.publicKey },
            retrieveNostrGuestWithPubAuth: async () => { return this.settings.publicKey },
            pubDestination: this.pubDestination,
        }, this.clientSend, this.clientSub)
    }

    onEvent = (event: NostrEvent) => {
        const res = JSON.parse(event.content) as { requestId: string }
        if (event.pub !== this.pubDestination) {
            return false
        }
        if (this.clientCbs[res.requestId]) {
            const cb = this.clientCbs[res.requestId]
            cb.f(res)
            if (cb.type === 'single') {
                const deleteOk = (delete this.clientCbs[res.requestId])
                logger.info(this.getSingleSubs(), "single subs left", deleteOk)
            }
            return true
        }
        return false
    }
    // changes
    getId = () => {
        return this.clientId
    }
    getPubDst = () => {
        return this.pubDestination
    }

    getRelays = () => {
        return this.relays
    }

    Get = () => {
        return this.client
    }

    getClientState = () => {
        return {
            latestResponseAtMillis: this.latestResponseAtMillis,
            latestHelthReqAtMillis: this.latestHelthReqAtMillis,
        }
    }

    sendHelthRequest = () => {
        this.latestHelthReqAtMillis = Date.now()
        this.client.UserHealth()
    }

    checkBeaconHealth = async (maxAgeSeconds = 2 * 60, onFailure: () => void) => {
        const beacon = await fetchBeacon(this.pubDestination, this.relays, maxAgeSeconds)
        if (beacon) {
            this.latestResponseAtMillis = Math.max(beacon.createdAt, this.latestResponseAtMillis)
            return
        }
        onFailure()
    }

    getSingleSubs = () => {
        return Object.entries(this.clientCbs).filter(([_, cb]) => cb.type === 'single')
    }

    clientSend = (to: string, message: NostrRequest): Promise<any> => {
        if (!message.requestId) {
            message.requestId = makeId(16)
        }
        const reqId = message.requestId
        if (this.clientCbs[reqId]) {
            throw new Error("request was already sent")
        }
        this.send(this.relays, to, JSON.stringify(message), this.settings)

        logger.info("subbing  to single send", reqId, message.rpcName)
        return new Promise(res => {
            this.clientCbs[reqId] = {
                startedAtMillis: Date.now(),
                type: 'single',
                f: (response: any) => { this.latestResponseAtMillis = Date.now(); res(response) },
            }
        })
    }
    clientSub = (to: string, message: NostrRequest, cb: (res: any) => void): void => {
        if (!message.requestId) {
            message.requestId = message.rpcName
        }
        const reqId = message.requestId
        if (!reqId) {
            throw new Error("invalid sub")
        }
        if (this.clientCbs[reqId]) {
            this.clientCbs[reqId] = {
                startedAtMillis: Date.now(),
                type: 'stream',
                f: (response: any) => { this.latestResponseAtMillis = Date.now(); cb(response) },
            }
            logger.warn("sub for", reqId, "was already registered, overriding")
            return
        }
        this.send(this.relays, to, JSON.stringify(message), this.settings)
        logger.info("subbing  to stream", reqId)
        this.clientCbs[reqId] = {
            startedAtMillis: Date.now(),
            type: 'stream',
            f: (response: any) => { this.latestResponseAtMillis = Date.now(); cb(response) }
        }
    }

    disconnectCalls = (reason?: string) => {
        for (const key in this.clientCbs) {
            const element = this.clientCbs[key]
            element.f({ status: "ERROR", reason: reason ? reason : "nostr connection timeout" })
            delete this.clientCbs[key]
        }
        this.latestResponseAtMillis = 0
        this.latestHelthReqAtMillis = 0
    }
}



let cluster: ClientsCluster | null = null

export const getNostrClient = async (nProfile: { pubkey: string, relays?: string[] } | string, keys: NostrKeyPair, temp?: boolean): Promise<Client> => {
    if (!cluster) {
        cluster = new ClientsCluster()
    }
    return cluster.GetNostrClient(nProfile, keys, temp)
}

export const getAllNostrClients = () => {
    if (!cluster) {
        cluster = new ClientsCluster()
    }
    return cluster.GetAllNostrClients()
}

export const parseNprofile = (nprofile: string) => {
    const { type, data } = nip19.decode(nprofile)
    if (type !== "nprofile") {
        throw new Error("invalid bech32 this is not a nprofile")
    }
    const dataString = JSON.stringify(data);
    const dataBox = JSON.parse(dataString);

    return dataBox as CustomProfilePointer;
}

type Task = () => Promise<any>;

class QueueManager {
    private queue: Task[] = [];
    private busy = false;

    pushToQueue(task: Task) {

        this.queue.push(task);

        if (!this.busy) {
            this.executeAndRemove();
        }
    }

    private async executeAndRemove() {
        while (this.queue.length > 0) {
            const task = this.queue.shift();
            if (task) {
                this.busy = true;
                try {
                    await task();
                } catch (error) {
                    console.error("Error executing task:", error);
                }
                this.busy = false;
            }
        }
        logger.info("Clients queue empty")
    }
}

