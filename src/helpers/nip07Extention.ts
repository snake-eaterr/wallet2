import { keyLinkClient } from "../Api/keylink/http"
import { getSanctumAccessToken } from "../Api/sanctum"
import { UnsignedEvent, Event } from "../Api/tools/event"
import { Browser } from '@capacitor/browser';
import { SANCTUM_URL } from "../constants";
import { toast } from "react-toastify";
import { tsFilesWrapper } from "../Components/Toast";

type EncryptionCalls = {
    encrypt(pubkey: string, plaintext: string): Promise<string>
    decrypt(pubkey: string, ciphertext: string): Promise<string>
}
export type NostrExtention = {
    getPublicKey: () => Promise<string>
    signEvent: (e: UnsignedEvent) => Promise<Event>
    getRelays: () => Promise<Record<string, { read: boolean, write: boolean }>>
    nip04?: EncryptionCalls
    nip44?: EncryptionCalls
}

export type SanctumNostrExtention = EncryptionCalls & {
    getPublicKey: () => Promise<string>
    signEvent: (e: UnsignedEvent) => Promise<Event>
    getRelays: () => Promise<Record<string, { read: boolean, write: boolean }>>
    valid: true
}
type InvalidExtention = { valid: false }
export const getNostrExtention = (): NostrExtention | null => {
    const w = window as any
    if (!w || !w.nostr) {
        return null
    }
    return w.nostr as NostrExtention
}

export const getSanctumNostrExtention = (): SanctumNostrExtention | InvalidExtention => {
    const ext = getNostrExtention()
    if (ext && (ext.nip44 || ext.nip04)) {
        const nipx4 = (ext.nip44 || ext.nip04)!
        return {
            valid: true,
            decrypt: (pubkey, ciphertext) => nipx4.decrypt(pubkey, ciphertext),
            encrypt: (pubkey, plaintext) => nipx4.encrypt(pubkey, plaintext),
            getPublicKey: () => ext.getPublicKey(),
            signEvent: (event) => ext.signEvent(event),
            getRelays: () => ext.getRelays()
        }
    }
    return getSanctumExtension()
}


const handleSanctumGeneralErrors = (reason: string) => {
    switch (reason) {
        case "Session expired or invalid":
            toast.error(tsFilesWrapper({ title: "Sanctum session expired or invalid", message: "You will shortly be redirected to Sanctum to log in again."}));
            setTimeout(() => {
                Browser.open({ url: `${SANCTUM_URL}/authenticate?authType=Log In` }).then(() => console.log("Opened sanctum to re login"));
            }, 2000);
            break;
        case "Access token does not exist or is invalid":
            toast.error(tsFilesWrapper({ title: "Invalid Access Token", message: "Did you revoke this app's token on Sanctum?"}));
            break;
        case "Access Denied":
            toast.error(tsFilesWrapper({ title: "Access Denied", message: "Access token was sent from a wrong device or domain"}));
    }
}


const getSanctumExtension = (): SanctumNostrExtention | InvalidExtention => {
    const accessToken = getSanctumAccessToken()
    if (!accessToken) {
        return { valid: false }
    }
    return {
        valid: true,
        decrypt: (pubkey, ciphertext) => keyLinkClient.Nip44Decrypt({ pubkey, ciphertext }).then(r => { if (r.status !== 'OK') { handleSanctumGeneralErrors(r.reason); throw new Error(r.reason); } else { return r.plaintext } }),
        encrypt: (pubkey, plaintext) => keyLinkClient.Nip44Encrypt({ pubkey, plaintext }).then(r => { if (r.status !== 'OK') { handleSanctumGeneralErrors(r.reason); throw new Error(r.reason); } else { return r.ciphertext } }),
        getPublicKey: () => keyLinkClient.GetNostrPubKey().then(r => { if (r.status !== 'OK') { handleSanctumGeneralErrors(r.reason); throw new Error(r.reason); } else { return r.pubkey } }),
        signEvent: (event) => keyLinkClient.SignNostrEvent({ usignedEvent: JSON.stringify(event) }).then(r => { if (r.status !== 'OK') { handleSanctumGeneralErrors(r.reason); throw new Error(r.reason); } else { return JSON.parse(r.signedEvent) } }),
        getRelays: () => keyLinkClient.GetNostrRelays().then(r => { if (r.status !== 'OK') { handleSanctumGeneralErrors(r.reason); throw new Error(r.reason); } else { return r.relays } })
    }


}