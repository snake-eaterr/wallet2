// This file was autogenerated from a .proto file, DO NOT EDIT!
import axios from 'axios'
import * as Types from './types.js'
export type ResultError = { status: 'ERROR', reason: string }

export type ClientParams = {
    baseUrl: string
    retrieveGuestAuth: () => Promise<string | null>
    retrieveNostrAuth: () => Promise<string | null>
    encryptCallback: (plain: any) => Promise<any>
    decryptCallback: (encrypted: any) => Promise<any>
    deviceId: string
    checkResult?: true
}
export default (params: ClientParams) => ({
    GetOrCreateVanityName: async (request: Types.GetOrCreateVanityNameRequest): Promise<ResultError | ({ status: 'OK' }& Types.GetOrCreateVanityNameResponse)> => {
        const auth = await params.retrieveGuestAuth()
        if (auth === null) throw new Error('retrieveGuestAuth() returned null')
        let finalRoute = '/api/v1/vanity'
        const { data } = await axios.post(params.baseUrl + finalRoute, request, { headers: { 'authorization': auth } })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') { 
            const result = data
            if(!params.checkResult) return { status: 'OK', ...result }
            const error = Types.GetOrCreateVanityNameResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    GetOrCreateNofferName: async (request: Types.GetOrCreateNofferNameRequest): Promise<ResultError | ({ status: 'OK' }& Types.GetOrCreateNofferNameResponse)> => {
        const auth = await params.retrieveNostrAuth()
        if (auth === null) throw new Error('retrieveNostrAuth() returned null')
        let finalRoute = '/api/v1/noffer/vanity'
        const { data } = await axios.post(params.baseUrl + finalRoute, request, { headers: { 'authorization': auth } })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') { 
            const result = data
            if(!params.checkResult) return { status: 'OK', ...result }
            const error = Types.GetOrCreateNofferNameResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    HandleLnurlPay: async (query: Types.HandleLnurlPay_Query): Promise<ResultError | ({ status: 'OK' }& Types.HandleLnurlPayResponse)> => {
        const auth = await params.retrieveGuestAuth()
        if (auth === null) throw new Error('retrieveGuestAuth() returned null')
        let finalRoute = '/api/lnurl_pay/handle'
        const q = (new URLSearchParams(query)).toString()
        finalRoute = finalRoute + (q === '' ? '' : '?' + q)
        const { data } = await axios.get(params.baseUrl + finalRoute, { headers: { 'authorization': auth } })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') { 
            const result = data
            if(!params.checkResult) return { status: 'OK', ...result }
            const error = Types.HandleLnurlPayResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    HandleLnurlPayUsername: async (query: Types.HandleLnurlPayUsername_Query, routeParams: Types.HandleLnurlPayUsername_RouteParams): Promise<ResultError | ({ status: 'OK' }& Types.HandleLnurlPayResponse)> => {
        const auth = await params.retrieveGuestAuth()
        if (auth === null) throw new Error('retrieveGuestAuth() returned null')
        let finalRoute = '/api/lnurl_pay/:address_name'
        finalRoute = finalRoute.replace(':address_name', routeParams['address_name'])
        const q = (new URLSearchParams(query)).toString()
        finalRoute = finalRoute + (q === '' ? '' : '?' + q)
        const { data } = await axios.get(params.baseUrl + finalRoute, { headers: { 'authorization': auth } })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') { 
            const result = data
            if(!params.checkResult) return { status: 'OK', ...result }
            const error = Types.HandleLnurlPayResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
    HandleLnurlAddress: async (routeParams: Types.HandleLnurlAddress_RouteParams): Promise<ResultError | ({ status: 'OK' }& Types.LnurlPayInfoResponse)> => {
        const auth = await params.retrieveGuestAuth()
        if (auth === null) throw new Error('retrieveGuestAuth() returned null')
        let finalRoute = '/.well-known/lnurlp/:address_name'
        finalRoute = finalRoute.replace(':address_name', routeParams['address_name'])
        const { data } = await axios.get(params.baseUrl + finalRoute, { headers: { 'authorization': auth } })
        if (data.status === 'ERROR' && typeof data.reason === 'string') return data
        if (data.status === 'OK') { 
            const result = data
            if(!params.checkResult) return { status: 'OK', ...result }
            const error = Types.LnurlPayInfoResponseValidate(result)
            if (error === null) { return { status: 'OK', ...result } } else return { status: 'ERROR', reason: error.message }
        }
        return { status: 'ERROR', reason: 'invalid response' }
    },
})
