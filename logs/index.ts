import { events } from "bdsx/event";
import { getTime } from "../management/index";
import { addLogSql } from "../sqlmanager";

events.serverOpen.on(() => {
    console.log('[+] Logs enabled!');
});

events.serverClose.on(() => {
    console.log('[-] Logs disabled!');
});

export async function playerLog(client_name: string, log_message: string): Promise<void> {
    addLogSql(client_name, getTime().toDate(), log_message);
}

export function techicalLog(plugin_name: string, log_message: string): void {
    // pass
}
