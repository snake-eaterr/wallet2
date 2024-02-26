import { generatePrivateKey, getPublicKey, nip19 } from 'nostr-tools'
import { NOSTR_PRIVATE_KEY_STORAGE_KEY, makeId } from '../constants'
import { NostrRequest } from './autogenerated/ts/nostr_transport'
import NewNostrClient from './autogenerated/ts/nostr_client'
import NostrRelayCluster, { NostrEvent, NostrSettings } from './nostrHandler'
import { ProfilePointer } from 'nostr-tools/lib/nip19'
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

type NostrClientQueue = { type: "queue", queue: ((client: NostrClient) => void)[] }
type NostrReadyClient = { type: "client", client: NostrClient }
type NostrClientHolder = NostrReadyClient | NostrClientQueue

export class ClientsCluster {
    clients: Record<string, NostrClientHolder> = {}
    relayCluster: NostrRelayCluster
    settings: NostrSettings
    constructor() {
        const privateKey = getNostrPrivateKey()
        if (!privateKey) {
            throw new Error("client not initialized correctly")
        }
        const publicKey = getPublicKey(privateKey)
        this.settings = { privateKey, publicKey }
        this.relayCluster = new NostrRelayCluster(this.settings)
    }

    onRelayEvent = (event: NostrEvent) => {
        const res = JSON.parse(event.content) as { requestId: string }
        for (const key in this.clients) {
            const c = this.clients[key]
            if (c.type === 'client' && c.client.onEvent(event)) {
                return
            }
        }
        console.log("no client found for", res.requestId)
    }

    SyncClusterRelays = (relays: string[]) => {
        return new Promise<void>(res => {
            this.relayCluster.addRelays(relays, () => res(), (e) => this.onRelayEvent(e), (r) => console.log("disconnected from relay", r))
        })
    }

    GetNostrClient = async (nProfile: { pubkey: string, relays?: string[] } | string): Promise<Client> => {
        const { pubkey, relays } = typeof nProfile === 'string' ? parseNprofile(nProfile) : nProfile
        console.log("getting client for", pubkey)
        const c = this.clients[pubkey]
        if (c && c.type === "client") {
            const nostrClient = c.client
            console.log("got client for", nostrClient.getPubDst(), ":", nostrClient.getId())
            return nostrClient.Get()
        }
        if (c && c.type === "queue") {
            return new Promise(res => {
                (this.clients[pubkey] as NostrClientQueue).queue.push((client) => {
                    console.log("got client for", client.getPubDst(), ":", client.getId())
                    res(client.Get())
                })
            })
        }
        if (!relays) {
            throw new Error("cannot create client if no relays are provided")
        }
        this.clients[pubkey] = { type: "queue", queue: [] }
        await this.SyncClusterRelays(relays ? relays : [])
        const nostrClient = new NostrClient(pubkey, this.settings.publicKey, relays ? relays : [], (relays, to, message) => this.relayCluster.Send(relays, to, message))
        const queue = (this.clients[pubkey] as NostrClientQueue).queue
        this.clients[pubkey] = { type: "client", client: nostrClient }
        queue.forEach(q => q(nostrClient))
        console.log("got client for", nostrClient.getPubDst(), ":", nostrClient.getId())
        return nostrClient.Get()
    }

    GetAllNostrClients = () => {
        return Object.values(this.clients).filter(c => c.type === "client").map(c => (c as NostrReadyClient).client)
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
    send: (relays: string[], to: string, message: string) => void
    constructor(pubDestination: string, clientPub: string, relays: string[], send: (relays: string[], to: string, message: string) => void) {
        this.pubDestination = pubDestination
        this.relays = relays
        this.send = send
        this.client = NewNostrClient({
            retrieveNostrUserAuth: async () => { return clientPub },
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
                console.log(this.getSingleSubs(), "single subs left", deleteOk)
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
        this.send(this.relays, to, JSON.stringify(message))

        console.log("subbing  to single send", reqId, message.rpcName)
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
            console.log("sub for", reqId, "was already registered, overriding")
            return
        }
        this.send(this.relays, to, JSON.stringify(message))
        console.log("subbing  to stream", reqId)
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

export const getNostrClient = async (nProfile: { pubkey: string, relays?: string[] } | string): Promise<Client> => {
    if (!cluster) {
        cluster = new ClientsCluster()
    }
    return cluster.GetNostrClient(nProfile)
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

    return dataBox as ProfilePointer;
}
