// This file was autogenerated from a .proto file, DO NOT EDIT!
import { NostrRequest } from './nostr_transport.js'
import * as Types from './types.js'
export type ResultError = { status: 'ERROR', reason: string }

export type NostrClientParams = {
    pubDestination: string
    retrieveNostrAdminAuth: () => Promise<string | null>
    retrieveNostrGuestWithPubAuth: () => Promise<string | null>
    retrieveNostrMetricsAuth: () => Promise<string | null>
    retrieveNostrUserAuth: () => Promise<string | null>
    checkResult?: true
}
export default (params: NostrClientParams, send: (to: string, message: NostrRequest) => Promise<any>, subscribe: (to: string, message: NostrRequest, cb: (res: any) => void) => void) => ({
    AddApp: async (request: Types.AddAppRequest): Promise<ResultError | ({ status: 'OK' } & Types.AuthApp)> => {
        const auth = await params.retrieveNostrAdminAuth()
        if (auth === null) throw new Error('retrieveNostrAdminAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'AddApp', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.AuthAppValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    AddProduct: async (request: Types.AddProductRequest): Promise<ResultError | ({ status: 'OK' } & Types.Product)> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'AddProduct', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.ProductValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    AuthApp: async (request: Types.AuthAppRequest): Promise<ResultError | ({ status: 'OK' } & Types.AuthApp)> => {
        const auth = await params.retrieveNostrAdminAuth()
        if (auth === null) throw new Error('retrieveNostrAdminAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'AuthApp', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.AuthAppValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    AuthorizeDebit: async (request: Types.DebitAuthorizationRequest): Promise<ResultError | ({ status: 'OK' } & Types.DebitAuthorization)> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'AuthorizeDebit', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.DebitAuthorizationValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    BanUser: async (request: Types.BanUserRequest): Promise<ResultError | ({ status: 'OK' } & Types.BanUserResponse)> => {
        const auth = await params.retrieveNostrAdminAuth()
        if (auth === null) throw new Error('retrieveNostrAdminAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'BanUser', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.BanUserResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    BatchUser: async (requests: Types.UserMethodInputs[]): Promise<ResultError | ({ status: 'OK', responses: (Types.UserMethodOutputs)[] })> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = { body: { requests } }
        const data = await send(params.pubDestination, { rpcName: 'BatchUser', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            return data
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    CreateOneTimeInviteLink: async (request: Types.CreateOneTimeInviteLinkRequest): Promise<ResultError | ({ status: 'OK' } & Types.CreateOneTimeInviteLinkResponse)> => {
        const auth = await params.retrieveNostrAdminAuth()
        if (auth === null) throw new Error('retrieveNostrAdminAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'CreateOneTimeInviteLink', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.CreateOneTimeInviteLinkResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    DecodeInvoice: async (request: Types.DecodeInvoiceRequest): Promise<ResultError | ({ status: 'OK' } & Types.DecodeInvoiceResponse)> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'DecodeInvoice', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.DecodeInvoiceResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    EnrollAdminToken: async (request: Types.EnrollAdminTokenRequest): Promise<ResultError | ({ status: 'OK' })> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'EnrollAdminToken', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            return data
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    GetAppsMetrics: async (request: Types.AppsMetricsRequest): Promise<ResultError | ({ status: 'OK' } & Types.AppsMetrics)> => {
        const auth = await params.retrieveNostrMetricsAuth()
        if (auth === null) throw new Error('retrieveNostrMetricsAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'GetAppsMetrics', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.AppsMetricsValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    GetDebitAuthorizations: async (): Promise<ResultError | ({ status: 'OK' } & Types.DebitAuthorizations)> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        const data = await send(params.pubDestination, { rpcName: 'GetDebitAuthorizations', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.DebitAuthorizationsValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    GetHttpCreds: async (cb: (res: ResultError | ({ status: 'OK' } & Types.HttpCreds)) => void): Promise<void> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        subscribe(params.pubDestination, { rpcName: 'GetHttpCreds', authIdentifier: auth, ...nostrRequest }, (data) => {
            if (data.status === 'ERROR' && typeof data.reason === 'string') return cb(data)
            if (data.status === 'OK') {
                const result = data
                if (!params.checkResult) return cb({ status: 'OK', ...result })
                const error = Types.HttpCredsValidate(result)
                if (error === null) { return cb({ status: 'OK', ...result }) } else return cb({ status: 'ERROR', reason: error.message })
            }
            return cb({ status: 'ERROR', reason: 'invalid response' })
        })
    },
    GetInviteLinkState: async (request: Types.GetInviteTokenStateRequest): Promise<ResultError | ({ status: 'OK' } & Types.GetInviteTokenStateResponse)> => {
        const auth = await params.retrieveNostrAdminAuth()
        if (auth === null) throw new Error('retrieveNostrAdminAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'GetInviteLinkState', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.GetInviteTokenStateResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    GetLNURLChannelLink: async (): Promise<ResultError | ({ status: 'OK' } & Types.LnurlLinkResponse)> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        const data = await send(params.pubDestination, { rpcName: 'GetLNURLChannelLink', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.LnurlLinkResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    GetLiveDebitRequests: async (cb: (res: ResultError | ({ status: 'OK' } & Types.LiveDebitRequest)) => void): Promise<void> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        subscribe(params.pubDestination, { rpcName: 'GetLiveDebitRequests', authIdentifier: auth, ...nostrRequest }, (data) => {
            if (data.status === 'ERROR' && typeof data.reason === 'string') return cb(data)
            if (data.status === 'OK') {
                const result = data
                if (!params.checkResult) return cb({ status: 'OK', ...result })
                const error = Types.LiveDebitRequestValidate(result)
                if (error === null) { return cb({ status: 'OK', ...result }) } else return cb({ status: 'ERROR', reason: error.message })
            }
            return cb({ status: 'ERROR', reason: 'invalid response' })
        })
    },
    GetLiveUserOperations: async (cb: (res: ResultError | ({ status: 'OK' } & Types.LiveUserOperation)) => void): Promise<void> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        subscribe(params.pubDestination, { rpcName: 'GetLiveUserOperations', authIdentifier: auth, ...nostrRequest }, (data) => {
            if (data.status === 'ERROR' && typeof data.reason === 'string') return cb(data)
            if (data.status === 'OK') {
                const result = data
                if (!params.checkResult) return cb({ status: 'OK', ...result })
                const error = Types.LiveUserOperationValidate(result)
                if (error === null) { return cb({ status: 'OK', ...result }) } else return cb({ status: 'ERROR', reason: error.message })
            }
            return cb({ status: 'ERROR', reason: 'invalid response' })
        })
    },
    GetLndMetrics: async (request: Types.LndMetricsRequest): Promise<ResultError | ({ status: 'OK' } & Types.LndMetrics)> => {
        const auth = await params.retrieveNostrMetricsAuth()
        if (auth === null) throw new Error('retrieveNostrMetricsAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'GetLndMetrics', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.LndMetricsValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    GetLnurlPayLink: async (): Promise<ResultError | ({ status: 'OK' } & Types.LnurlLinkResponse)> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        const data = await send(params.pubDestination, { rpcName: 'GetLnurlPayLink', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.LnurlLinkResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    GetLnurlWithdrawLink: async (): Promise<ResultError | ({ status: 'OK' } & Types.LnurlLinkResponse)> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        const data = await send(params.pubDestination, { rpcName: 'GetLnurlWithdrawLink', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.LnurlLinkResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    GetMigrationUpdate: async (cb: (res: ResultError | ({ status: 'OK' } & Types.MigrationUpdate)) => void): Promise<void> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        subscribe(params.pubDestination, { rpcName: 'GetMigrationUpdate', authIdentifier: auth, ...nostrRequest }, (data) => {
            if (data.status === 'ERROR' && typeof data.reason === 'string') return cb(data)
            if (data.status === 'OK') {
                const result = data
                if (!params.checkResult) return cb({ status: 'OK', ...result })
                const error = Types.MigrationUpdateValidate(result)
                if (error === null) { return cb({ status: 'OK', ...result }) } else return cb({ status: 'ERROR', reason: error.message })
            }
            return cb({ status: 'ERROR', reason: 'invalid response' })
        })
    },
    GetPaymentState: async (request: Types.GetPaymentStateRequest): Promise<ResultError | ({ status: 'OK' } & Types.PaymentState)> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'GetPaymentState', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.PaymentStateValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    GetSeed: async (): Promise<ResultError | ({ status: 'OK' } & Types.LndSeed)> => {
        const auth = await params.retrieveNostrAdminAuth()
        if (auth === null) throw new Error('retrieveNostrAdminAuth() returned null')
        const nostrRequest: NostrRequest = {}
        const data = await send(params.pubDestination, { rpcName: 'GetSeed', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.LndSeedValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    GetUsageMetrics: async (): Promise<ResultError | ({ status: 'OK' } & Types.UsageMetrics)> => {
        const auth = await params.retrieveNostrMetricsAuth()
        if (auth === null) throw new Error('retrieveNostrMetricsAuth() returned null')
        const nostrRequest: NostrRequest = {}
        const data = await send(params.pubDestination, { rpcName: 'GetUsageMetrics', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.UsageMetricsValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    GetUserInfo: async (): Promise<ResultError | ({ status: 'OK' } & Types.UserInfo)> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        const data = await send(params.pubDestination, { rpcName: 'GetUserInfo', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.UserInfoValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    GetUserOperations: async (request: Types.GetUserOperationsRequest): Promise<ResultError | ({ status: 'OK' } & Types.GetUserOperationsResponse)> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'GetUserOperations', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.GetUserOperationsResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    LinkNPubThroughToken: async (request: Types.LinkNPubThroughTokenRequest): Promise<ResultError | ({ status: 'OK' })> => {
        const auth = await params.retrieveNostrGuestWithPubAuth()
        if (auth === null) throw new Error('retrieveNostrGuestWithPubAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'LinkNPubThroughToken', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            return data
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    ListChannels: async (): Promise<ResultError | ({ status: 'OK' } & Types.LndChannels)> => {
        const auth = await params.retrieveNostrAdminAuth()
        if (auth === null) throw new Error('retrieveNostrAdminAuth() returned null')
        const nostrRequest: NostrRequest = {}
        const data = await send(params.pubDestination, { rpcName: 'ListChannels', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.LndChannelsValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    LndGetInfo: async (request: Types.LndGetInfoRequest): Promise<ResultError | ({ status: 'OK' } & Types.LndGetInfoResponse)> => {
        const auth = await params.retrieveNostrAdminAuth()
        if (auth === null) throw new Error('retrieveNostrAdminAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'LndGetInfo', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.LndGetInfoResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    NewAddress: async (request: Types.NewAddressRequest): Promise<ResultError | ({ status: 'OK' } & Types.NewAddressResponse)> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'NewAddress', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.NewAddressResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    NewInvoice: async (request: Types.NewInvoiceRequest): Promise<ResultError | ({ status: 'OK' } & Types.NewInvoiceResponse)> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'NewInvoice', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.NewInvoiceResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    NewProductInvoice: async (query: Types.NewProductInvoice_Query): Promise<ResultError | ({ status: 'OK' } & Types.NewInvoiceResponse)> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.query = query
        const data = await send(params.pubDestination, { rpcName: 'NewProductInvoice', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.NewInvoiceResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    OpenChannel: async (request: Types.OpenChannelRequest): Promise<ResultError | ({ status: 'OK' } & Types.OpenChannelResponse)> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'OpenChannel', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.OpenChannelResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    PayAddress: async (request: Types.PayAddressRequest): Promise<ResultError | ({ status: 'OK' } & Types.PayAddressResponse)> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'PayAddress', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.PayAddressResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    PayInvoice: async (request: Types.PayInvoiceRequest): Promise<ResultError | ({ status: 'OK' } & Types.PayInvoiceResponse)> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'PayInvoice', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            const result = data
            if (!params.checkResult) return { status: 'OK', ...result }
            const error = Types.PayInvoiceResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    RemoveAuthorizedDebit: async (request: Types.RemoveAuthorizedDebitRequest): Promise<ResultError | ({ status: 'OK' })> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'RemoveAuthorizedDebit', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            return data
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    UseInviteLink: async (request: Types.UseInviteLinkRequest): Promise<ResultError | ({ status: 'OK' })> => {
        const auth = await params.retrieveNostrGuestWithPubAuth()
        if (auth === null) throw new Error('retrieveNostrGuestWithPubAuth() returned null')
        const nostrRequest: NostrRequest = {}
        nostrRequest.body = request
        const data = await send(params.pubDestination, { rpcName: 'UseInviteLink', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            return data
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    UserHealth: async (): Promise<ResultError | ({ status: 'OK' })> => {
        const auth = await params.retrieveNostrUserAuth()
        if (auth === null) throw new Error('retrieveNostrUserAuth() returned null')
        const nostrRequest: NostrRequest = {}
        const data = await send(params.pubDestination, { rpcName: 'UserHealth', authIdentifier: auth, ...nostrRequest })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') {
            return data
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
})
