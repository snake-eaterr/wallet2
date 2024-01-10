// This file was autogenerated from a .proto file, DO NOT EDIT!

import * as Types from './types.js'
export type Logger = { log: (v: any) => void, error: (v: any) => void }
type NostrResponse = (message: object) => void
export type NostrRequest = {
    rpcName?: string
    params?: Record<string, string>
    query?: Record<string, string>
    body?: any
    authIdentifier?: string
    requestId?: string
    appId?: string
}
export type NostrOptions = {
    logger?: Logger
    throwErrors?: true
    metricsCallback: (metrics: Types.RequestMetric[]) => void
    NostrUserAuthGuard: (appId?:string, identifier?: string) => Promise<Types.UserContext>
}
const logErrorAndReturnResponse = (error: Error, response: string, res: NostrResponse, logger: Logger, metric: Types.RequestMetric, metricsCallback: (metrics: Types.RequestMetric[]) => void) => { 
    logger.error(error.message || error); metricsCallback([{ ...metric, error: response }]); res({ status: 'ERROR', reason: response })
}
export default (methods: Types.ServerMethods, opts: NostrOptions) => {
    const logger = opts.logger || { log: console.log, error: console.error }
    return async (req: NostrRequest, res: NostrResponse, startString: string, startMs: number) => {
        const startTime = BigInt(startString)
        const info: Types.RequestInfo = { rpcName: req.rpcName || 'unkown', batch: false, nostr: true, batchSize: 0 }
        const stats: Types.RequestStats = { startMs, start: startTime, parse: process.hrtime.bigint(), guard: 0n, validate: 0n, handle: 0n }
        let authCtx: Types.AuthContext = {}
        switch (req.rpcName) {
            case 'GetUserInfo':
                try {
                    if (!methods.GetUserInfo) throw new Error('method: GetUserInfo is not implemented')
                    const authContext = await opts.NostrUserAuthGuard(req.appId, req.authIdentifier)
                    stats.guard = process.hrtime.bigint()
                    authCtx = authContext
                    stats.validate = stats.guard
                    const response = await methods.GetUserInfo({rpcName:'GetUserInfo', ctx:authContext })
                    stats.handle = process.hrtime.bigint()
                    res({status: 'OK', ...response})
                    opts.metricsCallback([{ ...info, ...stats, ...authContext }])
                }catch(ex){ const e = ex as any; logErrorAndReturnResponse(e, e.message || e, res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback); if (opts.throwErrors) throw e }
                break
            case 'AddProduct':
                try {
                    if (!methods.AddProduct) throw new Error('method: AddProduct is not implemented')
                    const authContext = await opts.NostrUserAuthGuard(req.appId, req.authIdentifier)
                    stats.guard = process.hrtime.bigint()
                    authCtx = authContext
                    const request = req.body
                    const error = Types.AddProductRequestValidate(request)
                    stats.validate = process.hrtime.bigint()
                    if (error !== null) return logErrorAndReturnResponse(error, 'invalid request body', res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback)
                    const response = await methods.AddProduct({rpcName:'AddProduct', ctx:authContext , req: request})
                    stats.handle = process.hrtime.bigint()
                    res({status: 'OK', ...response})
                    opts.metricsCallback([{ ...info, ...stats, ...authContext }])
                }catch(ex){ const e = ex as any; logErrorAndReturnResponse(e, e.message || e, res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback); if (opts.throwErrors) throw e }
                break
            case 'NewProductInvoice':
                try {
                    if (!methods.NewProductInvoice) throw new Error('method: NewProductInvoice is not implemented')
                    const authContext = await opts.NostrUserAuthGuard(req.appId, req.authIdentifier)
                    stats.guard = process.hrtime.bigint()
                    authCtx = authContext
                    stats.validate = stats.guard
                    const response = await methods.NewProductInvoice({rpcName:'NewProductInvoice', ctx:authContext ,query: req.query||{}})
                    stats.handle = process.hrtime.bigint()
                    res({status: 'OK', ...response})
                    opts.metricsCallback([{ ...info, ...stats, ...authContext }])
                }catch(ex){ const e = ex as any; logErrorAndReturnResponse(e, e.message || e, res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback); if (opts.throwErrors) throw e }
                break
            case 'GetUserOperations':
                try {
                    if (!methods.GetUserOperations) throw new Error('method: GetUserOperations is not implemented')
                    const authContext = await opts.NostrUserAuthGuard(req.appId, req.authIdentifier)
                    stats.guard = process.hrtime.bigint()
                    authCtx = authContext
                    const request = req.body
                    const error = Types.GetUserOperationsRequestValidate(request)
                    stats.validate = process.hrtime.bigint()
                    if (error !== null) return logErrorAndReturnResponse(error, 'invalid request body', res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback)
                    const response = await methods.GetUserOperations({rpcName:'GetUserOperations', ctx:authContext , req: request})
                    stats.handle = process.hrtime.bigint()
                    res({status: 'OK', ...response})
                    opts.metricsCallback([{ ...info, ...stats, ...authContext }])
                }catch(ex){ const e = ex as any; logErrorAndReturnResponse(e, e.message || e, res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback); if (opts.throwErrors) throw e }
                break
            case 'NewAddress':
                try {
                    if (!methods.NewAddress) throw new Error('method: NewAddress is not implemented')
                    const authContext = await opts.NostrUserAuthGuard(req.appId, req.authIdentifier)
                    stats.guard = process.hrtime.bigint()
                    authCtx = authContext
                    const request = req.body
                    const error = Types.NewAddressRequestValidate(request)
                    stats.validate = process.hrtime.bigint()
                    if (error !== null) return logErrorAndReturnResponse(error, 'invalid request body', res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback)
                    const response = await methods.NewAddress({rpcName:'NewAddress', ctx:authContext , req: request})
                    stats.handle = process.hrtime.bigint()
                    res({status: 'OK', ...response})
                    opts.metricsCallback([{ ...info, ...stats, ...authContext }])
                }catch(ex){ const e = ex as any; logErrorAndReturnResponse(e, e.message || e, res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback); if (opts.throwErrors) throw e }
                break
            case 'PayAddress':
                try {
                    if (!methods.PayAddress) throw new Error('method: PayAddress is not implemented')
                    const authContext = await opts.NostrUserAuthGuard(req.appId, req.authIdentifier)
                    stats.guard = process.hrtime.bigint()
                    authCtx = authContext
                    const request = req.body
                    const error = Types.PayAddressRequestValidate(request)
                    stats.validate = process.hrtime.bigint()
                    if (error !== null) return logErrorAndReturnResponse(error, 'invalid request body', res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback)
                    const response = await methods.PayAddress({rpcName:'PayAddress', ctx:authContext , req: request})
                    stats.handle = process.hrtime.bigint()
                    res({status: 'OK', ...response})
                    opts.metricsCallback([{ ...info, ...stats, ...authContext }])
                }catch(ex){ const e = ex as any; logErrorAndReturnResponse(e, e.message || e, res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback); if (opts.throwErrors) throw e }
                break
            case 'NewInvoice':
                try {
                    if (!methods.NewInvoice) throw new Error('method: NewInvoice is not implemented')
                    const authContext = await opts.NostrUserAuthGuard(req.appId, req.authIdentifier)
                    stats.guard = process.hrtime.bigint()
                    authCtx = authContext
                    const request = req.body
                    const error = Types.NewInvoiceRequestValidate(request)
                    stats.validate = process.hrtime.bigint()
                    if (error !== null) return logErrorAndReturnResponse(error, 'invalid request body', res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback)
                    const response = await methods.NewInvoice({rpcName:'NewInvoice', ctx:authContext , req: request})
                    stats.handle = process.hrtime.bigint()
                    res({status: 'OK', ...response})
                    opts.metricsCallback([{ ...info, ...stats, ...authContext }])
                }catch(ex){ const e = ex as any; logErrorAndReturnResponse(e, e.message || e, res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback); if (opts.throwErrors) throw e }
                break
            case 'DecodeInvoice':
                try {
                    if (!methods.DecodeInvoice) throw new Error('method: DecodeInvoice is not implemented')
                    const authContext = await opts.NostrUserAuthGuard(req.appId, req.authIdentifier)
                    stats.guard = process.hrtime.bigint()
                    authCtx = authContext
                    const request = req.body
                    const error = Types.DecodeInvoiceRequestValidate(request)
                    stats.validate = process.hrtime.bigint()
                    if (error !== null) return logErrorAndReturnResponse(error, 'invalid request body', res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback)
                    const response = await methods.DecodeInvoice({rpcName:'DecodeInvoice', ctx:authContext , req: request})
                    stats.handle = process.hrtime.bigint()
                    res({status: 'OK', ...response})
                    opts.metricsCallback([{ ...info, ...stats, ...authContext }])
                }catch(ex){ const e = ex as any; logErrorAndReturnResponse(e, e.message || e, res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback); if (opts.throwErrors) throw e }
                break
            case 'PayInvoice':
                try {
                    if (!methods.PayInvoice) throw new Error('method: PayInvoice is not implemented')
                    const authContext = await opts.NostrUserAuthGuard(req.appId, req.authIdentifier)
                    stats.guard = process.hrtime.bigint()
                    authCtx = authContext
                    const request = req.body
                    const error = Types.PayInvoiceRequestValidate(request)
                    stats.validate = process.hrtime.bigint()
                    if (error !== null) return logErrorAndReturnResponse(error, 'invalid request body', res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback)
                    const response = await methods.PayInvoice({rpcName:'PayInvoice', ctx:authContext , req: request})
                    stats.handle = process.hrtime.bigint()
                    res({status: 'OK', ...response})
                    opts.metricsCallback([{ ...info, ...stats, ...authContext }])
                }catch(ex){ const e = ex as any; logErrorAndReturnResponse(e, e.message || e, res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback); if (opts.throwErrors) throw e }
                break
            case 'OpenChannel':
                try {
                    if (!methods.OpenChannel) throw new Error('method: OpenChannel is not implemented')
                    const authContext = await opts.NostrUserAuthGuard(req.appId, req.authIdentifier)
                    stats.guard = process.hrtime.bigint()
                    authCtx = authContext
                    const request = req.body
                    const error = Types.OpenChannelRequestValidate(request)
                    stats.validate = process.hrtime.bigint()
                    if (error !== null) return logErrorAndReturnResponse(error, 'invalid request body', res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback)
                    const response = await methods.OpenChannel({rpcName:'OpenChannel', ctx:authContext , req: request})
                    stats.handle = process.hrtime.bigint()
                    res({status: 'OK', ...response})
                    opts.metricsCallback([{ ...info, ...stats, ...authContext }])
                }catch(ex){ const e = ex as any; logErrorAndReturnResponse(e, e.message || e, res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback); if (opts.throwErrors) throw e }
                break
            case 'GetLnurlWithdrawLink':
                try {
                    if (!methods.GetLnurlWithdrawLink) throw new Error('method: GetLnurlWithdrawLink is not implemented')
                    const authContext = await opts.NostrUserAuthGuard(req.appId, req.authIdentifier)
                    stats.guard = process.hrtime.bigint()
                    authCtx = authContext
                    stats.validate = stats.guard
                    const response = await methods.GetLnurlWithdrawLink({rpcName:'GetLnurlWithdrawLink', ctx:authContext })
                    stats.handle = process.hrtime.bigint()
                    res({status: 'OK', ...response})
                    opts.metricsCallback([{ ...info, ...stats, ...authContext }])
                }catch(ex){ const e = ex as any; logErrorAndReturnResponse(e, e.message || e, res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback); if (opts.throwErrors) throw e }
                break
            case 'GetLnurlPayLink':
                try {
                    if (!methods.GetLnurlPayLink) throw new Error('method: GetLnurlPayLink is not implemented')
                    const authContext = await opts.NostrUserAuthGuard(req.appId, req.authIdentifier)
                    stats.guard = process.hrtime.bigint()
                    authCtx = authContext
                    stats.validate = stats.guard
                    const response = await methods.GetLnurlPayLink({rpcName:'GetLnurlPayLink', ctx:authContext })
                    stats.handle = process.hrtime.bigint()
                    res({status: 'OK', ...response})
                    opts.metricsCallback([{ ...info, ...stats, ...authContext }])
                }catch(ex){ const e = ex as any; logErrorAndReturnResponse(e, e.message || e, res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback); if (opts.throwErrors) throw e }
                break
            case 'GetLNURLChannelLink':
                try {
                    if (!methods.GetLNURLChannelLink) throw new Error('method: GetLNURLChannelLink is not implemented')
                    const authContext = await opts.NostrUserAuthGuard(req.appId, req.authIdentifier)
                    stats.guard = process.hrtime.bigint()
                    authCtx = authContext
                    stats.validate = stats.guard
                    const response = await methods.GetLNURLChannelLink({rpcName:'GetLNURLChannelLink', ctx:authContext })
                    stats.handle = process.hrtime.bigint()
                    res({status: 'OK', ...response})
                    opts.metricsCallback([{ ...info, ...stats, ...authContext }])
                }catch(ex){ const e = ex as any; logErrorAndReturnResponse(e, e.message || e, res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback); if (opts.throwErrors) throw e }
                break
            case 'GetLiveUserOperations':
                try {
                    if (!methods.GetLiveUserOperations) throw new Error('method: GetLiveUserOperations is not implemented')
                    const authContext = await opts.NostrUserAuthGuard(req.appId, req.authIdentifier)
                    stats.guard = process.hrtime.bigint()
                    authCtx = authContext
                    stats.validate = stats.guard
                    methods.GetLiveUserOperations({rpcName:'GetLiveUserOperations', ctx:authContext  ,cb: (response, err) => {
                    stats.handle = process.hrtime.bigint()
                    if (err) { logErrorAndReturnResponse(err, err.message, res, logger, { ...info, ...stats, ...authContext }, opts.metricsCallback)} else { res({status: 'OK', ...response});opts.metricsCallback([{ ...info, ...stats, ...authContext }])}
                    }})
                }catch(ex){ const e = ex as any; logErrorAndReturnResponse(e, e.message || e, res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback); if (opts.throwErrors) throw e }
                break
            case 'GetMigrationUpdate':
                try {
                    if (!methods.GetMigrationUpdate) throw new Error('method: GetMigrationUpdate is not implemented')
                    const authContext = await opts.NostrUserAuthGuard(req.appId, req.authIdentifier)
                    stats.guard = process.hrtime.bigint()
                    authCtx = authContext
                    stats.validate = stats.guard
                    methods.GetMigrationUpdate({rpcName:'GetMigrationUpdate', ctx:authContext  ,cb: (response, err) => {
                    stats.handle = process.hrtime.bigint()
                    if (err) { logErrorAndReturnResponse(err, err.message, res, logger, { ...info, ...stats, ...authContext }, opts.metricsCallback)} else { res({status: 'OK', ...response});opts.metricsCallback([{ ...info, ...stats, ...authContext }])}
                    }})
                }catch(ex){ const e = ex as any; logErrorAndReturnResponse(e, e.message || e, res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback); if (opts.throwErrors) throw e }
                break
            case 'BatchUser':
                try {
                    info.batch = true
                    const requests = req.body.requests as Types.UserMethodInputs[]
                    if (!Array.isArray(requests))throw new Error('invalid body, is not an array')
                    info.batchSize = requests.length
                    if (requests.length > 10) throw new Error('too many requests in the batch')
                    const ctx = await opts.NostrUserAuthGuard(req.appId, req.authIdentifier)
                    stats.guard = process.hrtime.bigint()
                    authCtx = ctx
                    stats.validate = stats.guard
                    const responses = []
                    const callsMetrics: Types.RequestMetric[] = []
                    for (let i = 0; i < requests.length; i++) {
                        const operation = requests[i]
                        const opInfo: Types.RequestInfo = { rpcName: operation.rpcName, batch: true, nostr: true, batchSize: 0 }
                        const opStats: Types.RequestStats = { startMs, start: startTime, parse: stats.parse, guard: stats.guard, validate: 0n, handle: 0n }
                        try {
                            switch(operation.rpcName) {
                                case 'GetUserInfo':
                                    if (!methods.GetUserInfo) {
                                        throw new Error('method not defined: GetUserInfo')
                                    } else {
                                        opStats.validate = opStats.guard
                                        const res = await methods.GetUserInfo({...operation, ctx}); responses.push({ status: 'OK', ...res  })
                                        opStats.handle = process.hrtime.bigint()
                                        callsMetrics.push({ ...opInfo, ...opStats, ...ctx })
                                    }
                                    break
                                case 'AddProduct':
                                    if (!methods.AddProduct) {
                                        throw new Error('method not defined: AddProduct')
                                    } else {
                                        const error = Types.AddProductRequestValidate(operation.req)
                                        opStats.validate = process.hrtime.bigint()
                                        if (error !== null) throw error
                                        const res = await methods.AddProduct({...operation, ctx}); responses.push({ status: 'OK', ...res  })
                                        opStats.handle = process.hrtime.bigint()
                                        callsMetrics.push({ ...opInfo, ...opStats, ...ctx })
                                    }
                                    break
                                case 'NewProductInvoice':
                                    if (!methods.NewProductInvoice) {
                                        throw new Error('method not defined: NewProductInvoice')
                                    } else {
                                        opStats.validate = opStats.guard
                                        const res = await methods.NewProductInvoice({...operation, ctx}); responses.push({ status: 'OK', ...res  })
                                        opStats.handle = process.hrtime.bigint()
                                        callsMetrics.push({ ...opInfo, ...opStats, ...ctx })
                                    }
                                    break
                                case 'GetUserOperations':
                                    if (!methods.GetUserOperations) {
                                        throw new Error('method not defined: GetUserOperations')
                                    } else {
                                        const error = Types.GetUserOperationsRequestValidate(operation.req)
                                        opStats.validate = process.hrtime.bigint()
                                        if (error !== null) throw error
                                        const res = await methods.GetUserOperations({...operation, ctx}); responses.push({ status: 'OK', ...res  })
                                        opStats.handle = process.hrtime.bigint()
                                        callsMetrics.push({ ...opInfo, ...opStats, ...ctx })
                                    }
                                    break
                                case 'NewAddress':
                                    if (!methods.NewAddress) {
                                        throw new Error('method not defined: NewAddress')
                                    } else {
                                        const error = Types.NewAddressRequestValidate(operation.req)
                                        opStats.validate = process.hrtime.bigint()
                                        if (error !== null) throw error
                                        const res = await methods.NewAddress({...operation, ctx}); responses.push({ status: 'OK', ...res  })
                                        opStats.handle = process.hrtime.bigint()
                                        callsMetrics.push({ ...opInfo, ...opStats, ...ctx })
                                    }
                                    break
                                case 'PayAddress':
                                    if (!methods.PayAddress) {
                                        throw new Error('method not defined: PayAddress')
                                    } else {
                                        const error = Types.PayAddressRequestValidate(operation.req)
                                        opStats.validate = process.hrtime.bigint()
                                        if (error !== null) throw error
                                        const res = await methods.PayAddress({...operation, ctx}); responses.push({ status: 'OK', ...res  })
                                        opStats.handle = process.hrtime.bigint()
                                        callsMetrics.push({ ...opInfo, ...opStats, ...ctx })
                                    }
                                    break
                                case 'NewInvoice':
                                    if (!methods.NewInvoice) {
                                        throw new Error('method not defined: NewInvoice')
                                    } else {
                                        const error = Types.NewInvoiceRequestValidate(operation.req)
                                        opStats.validate = process.hrtime.bigint()
                                        if (error !== null) throw error
                                        const res = await methods.NewInvoice({...operation, ctx}); responses.push({ status: 'OK', ...res  })
                                        opStats.handle = process.hrtime.bigint()
                                        callsMetrics.push({ ...opInfo, ...opStats, ...ctx })
                                    }
                                    break
                                case 'DecodeInvoice':
                                    if (!methods.DecodeInvoice) {
                                        throw new Error('method not defined: DecodeInvoice')
                                    } else {
                                        const error = Types.DecodeInvoiceRequestValidate(operation.req)
                                        opStats.validate = process.hrtime.bigint()
                                        if (error !== null) throw error
                                        const res = await methods.DecodeInvoice({...operation, ctx}); responses.push({ status: 'OK', ...res  })
                                        opStats.handle = process.hrtime.bigint()
                                        callsMetrics.push({ ...opInfo, ...opStats, ...ctx })
                                    }
                                    break
                                case 'PayInvoice':
                                    if (!methods.PayInvoice) {
                                        throw new Error('method not defined: PayInvoice')
                                    } else {
                                        const error = Types.PayInvoiceRequestValidate(operation.req)
                                        opStats.validate = process.hrtime.bigint()
                                        if (error !== null) throw error
                                        const res = await methods.PayInvoice({...operation, ctx}); responses.push({ status: 'OK', ...res  })
                                        opStats.handle = process.hrtime.bigint()
                                        callsMetrics.push({ ...opInfo, ...opStats, ...ctx })
                                    }
                                    break
                                case 'OpenChannel':
                                    if (!methods.OpenChannel) {
                                        throw new Error('method not defined: OpenChannel')
                                    } else {
                                        const error = Types.OpenChannelRequestValidate(operation.req)
                                        opStats.validate = process.hrtime.bigint()
                                        if (error !== null) throw error
                                        const res = await methods.OpenChannel({...operation, ctx}); responses.push({ status: 'OK', ...res  })
                                        opStats.handle = process.hrtime.bigint()
                                        callsMetrics.push({ ...opInfo, ...opStats, ...ctx })
                                    }
                                    break
                                case 'GetLnurlWithdrawLink':
                                    if (!methods.GetLnurlWithdrawLink) {
                                        throw new Error('method not defined: GetLnurlWithdrawLink')
                                    } else {
                                        opStats.validate = opStats.guard
                                        const res = await methods.GetLnurlWithdrawLink({...operation, ctx}); responses.push({ status: 'OK', ...res  })
                                        opStats.handle = process.hrtime.bigint()
                                        callsMetrics.push({ ...opInfo, ...opStats, ...ctx })
                                    }
                                    break
                                case 'GetLnurlPayLink':
                                    if (!methods.GetLnurlPayLink) {
                                        throw new Error('method not defined: GetLnurlPayLink')
                                    } else {
                                        opStats.validate = opStats.guard
                                        const res = await methods.GetLnurlPayLink({...operation, ctx}); responses.push({ status: 'OK', ...res  })
                                        opStats.handle = process.hrtime.bigint()
                                        callsMetrics.push({ ...opInfo, ...opStats, ...ctx })
                                    }
                                    break
                                case 'GetLNURLChannelLink':
                                    if (!methods.GetLNURLChannelLink) {
                                        throw new Error('method not defined: GetLNURLChannelLink')
                                    } else {
                                        opStats.validate = opStats.guard
                                        const res = await methods.GetLNURLChannelLink({...operation, ctx}); responses.push({ status: 'OK', ...res  })
                                        opStats.handle = process.hrtime.bigint()
                                        callsMetrics.push({ ...opInfo, ...opStats, ...ctx })
                                    }
                                    break
                                default:
                                throw new Error('unkown rpcName')
                            }
                        } catch(ex) {const e = ex as any; logger.error(e.message || e); callsMetrics.push({ ...opInfo, ...opStats, ...ctx, error: e.message }); responses.push({ status: 'ERROR', reason: e.message || e })}
                    }
                    stats.handle = process.hrtime.bigint()
                    res({ status: 'OK', responses })
                    opts.metricsCallback([{ ...info, ...stats, ...ctx }, ...callsMetrics])
                }catch(ex){ const e = ex as any; logErrorAndReturnResponse(e, e.message || e, res, logger, { ...info, ...stats, ...authCtx }, opts.metricsCallback); if (opts.throwErrors) throw e }
                break
            default: logger.error('unknown rpc call name from nostr event:'+req.rpcName) 
        }
    }
}
