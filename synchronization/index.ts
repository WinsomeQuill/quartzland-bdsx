import { events } from "bdsx/event";
import { syncAccountInfo, syncAccountWarnTime, syncAccountVipTime,
    stopsyncAccountInfo, stopSyncAccountWarnTime, stopSyncAccountVipTime,
    runAuthTeleport, stopAuthTeleport, updateMOTD, autoRestart, stopUpdateMOTD,
    stopAutoRestart } from "../management/index";
import { regCmd } from "../simplecommands/commands";

console.log('[/] Synchronization allocated!');

events.serverOpen.on(()=>{
    syncAccountInfo();
    syncAccountWarnTime();
    syncAccountVipTime();
    runAuthTeleport();
    updateMOTD();
    autoRestart();
    regCmd();
    console.log('[+] Synchronization enabled!');
});

events.serverClose.on(()=>{
    stopsyncAccountInfo();
    stopSyncAccountWarnTime();
    stopSyncAccountVipTime();
    stopAuthTeleport();
    stopUpdateMOTD();
    stopAutoRestart();
    console.log('[-] Synchronization disabled!');
});

