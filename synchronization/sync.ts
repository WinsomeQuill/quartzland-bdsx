import { syncAccountInfo, syncAccountWarnTime, syncAccountVipTime,
    stopsyncAccountInfo, stopSyncAccountWarnTime, stopSyncAccountVipTime,
    runAuthTeleport, stopAuthTeleport, updateMOTD, autoRestart, stopUpdateMOTD,
    stopAutoRestart } from "../management/index";

let status = true;
if(status) {
    syncAccountInfo();
    syncAccountWarnTime();
    syncAccountVipTime();
    runAuthTeleport();
    updateMOTD();
    autoRestart();
    console.log('[Thread] [+] Synchronization enabled!');
} else {
    stopsyncAccountInfo();
    stopSyncAccountWarnTime();
    stopSyncAccountVipTime();
    stopAuthTeleport();
    stopUpdateMOTD();
    stopAutoRestart();
    console.log('[Thread] [-] Synchronization disabled!');
}
