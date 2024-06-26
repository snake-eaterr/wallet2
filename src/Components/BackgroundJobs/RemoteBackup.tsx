import { useEffect } from "react"
import { findReducerMerger, useSelector } from "../../State/store"
import { fetchRemoteBackup, saveRemoteBackup } from "../../helpers/remoteBackups"
import { ignoredStorageKeys } from "../../constants"
export const RemoteBackup = () => {
    const backupStates = useSelector(state => state.backupStateSlice);

    useEffect(() => {
        if (!backupStates.subbedToBackUp) {
            console.log("instance not initialized yet to sync backups")
            return
        }
        syncBackups().then(() => console.log("backups synced succesfully")).catch((e) => console.log("failed to sync backups", e))
    }, [backupStates])
    const syncBackups = async () => {
        const backup = await fetchRemoteBackup()
        if (backup.result !== 'success') {
            throw new Error('access token missing')
        }
        let data: Record<string, string | null> = {}
        if (backup.decrypted) {
            data = JSON.parse(backup.decrypted);
            for (const key in data) {
                const merger = findReducerMerger(key)
                if (!merger) {
                    continue
                }
                const dataItem = data[key]
                const storageItem = localStorage.getItem(key)
                if (!storageItem || !dataItem) {
                    continue
                }
                data[key] = merger(dataItem, storageItem)
            }

        } else {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i) ?? "null";
                const value = localStorage.getItem(key);
                if (value && !ignoredStorageKeys.includes(key)) {
                    data[key] = value;
                }
            }
        }
        await saveRemoteBackup(JSON.stringify(data))

    }
    return null
}