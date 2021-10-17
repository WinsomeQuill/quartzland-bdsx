import { Player } from "bdsx/bds/player";
import { events } from "bdsx/event";
import { updateExp } from "../management/index";
import { AllowPlayerBuildInRegion } from "../regions/manager";

events.serverOpen.on(() => {
    console.log('[+] Levels enabled!');
});

events.serverClose.on(() => {
    console.log('[-] Levels disabled!');
});

events.blockDestroy.on((e) => {
    const client = e.player;
    const block = e.blockPos;

    if(client instanceof Player) {
        if(!AllowPlayerBuildInRegion(client, block)) {
            return;
        } else {
            updateExp(client, 1);
        }

    }
});

events.blockPlace.on((e) => {
    const client = e.player;
    const block = e.blockPos;

    if(client instanceof Player) {
        if(!AllowPlayerBuildInRegion(client, block)) {
            return;
        } else {
            updateExp(client, 1);
        }
    }
});