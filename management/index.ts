import { Player, ServerPlayer } from "bdsx/bds/player";
import { events } from "bdsx/event";
import { BossEventPacket, DisconnectPacket, ScorePacketInfo, SetDisplayObjectivePacket,
    SetScorePacket, SetTitlePacket, TextPacket } from "bdsx/bds/packets";
import { getHomeSql, removeWarnSql, setAccountInfoSql, setHomeSql, setInfoBarStatusSql,
    setRpgModSql, setVipLevelSql, updateHomeSql } from "../sqlmanager/index";
import * as moment from 'moment-timezone';
import { BlockPos, Vec3 } from "bdsx/bds/blockpos";
import { getRegionPos1, getRegionPos2 } from "../regions/manager";
import { DisplaySlot } from "bdsx/bds/scoreboard";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { takeEconomyStats, addEconomyStats, addEconomyStatsToday, takeEconomyStatsToday } from "../economy/index";
import { serverInstance } from "bdsx/bds/server";
import { bedrockServer } from "bdsx/launcher";
import { Actor } from "bdsx/bds/actor";
import * as bcrypt from "bcryptjs";
import { mods, mods2 } from "../rpg/index";
import { Mod, RpgModCorrosion, RpgModGiftOfLife, RpgModLeakage, RpgModLunge,
    RpgModResuscitation, RpgModShield, RpgModShock, RpgModThorns, RpgModWar } from "../rpg/mods";

let plugins_running = 0;

events.serverOpen.on(()=>{
    console.log(`Moscow Time: ${getTimeFormat()}`);
    console.log('[+] Management enabled!');
    const timer = setInterval(async () => {
        if(plugins_running === 2) {
            clearInterval(timer);
            console.log('Server open!');
        }
    }, 2000);
});

events.serverClose.on(()=>{
    console.log('[-] Management disabled!');
});

export const maxplayers = 100;
export const white = '§f';
export const red = '§c';
export const green = '§a';
export const yellow = '§e';
export const pink = '§d';
export const blue = '§b';
export const light_blue = '§3';
export const gray = '§7';
export const dark_gray = '§8';
export const dark_blue = '§9';
export const gold = '§6';
export const bold = '§l';
export const reset = '§r';
export const coursive = '§o';

export const success = `${white}[${green}Успешно${white}]`;
export const error = `${white}[${red}Ошибка${white}]`;
export const info = `${white}[${yellow}Информация${white}]`;

interface Person {
    id: number;
    name: string | null;
    object: Player | undefined;
    admin_lvl: number;
    vip_lvl: number;
    vip_end: moment.Moment | null,
    money: number;
    money_bank: number;
    donate: number,
    level: number;
    exp: number;
    report_kd: moment.Moment | null;
    percent_economy: number;
    job_name: string | null;
    job_level: number;
    job_exp: number;
    authorized: boolean;
    region_pos1x: number;
    region_pos1y: number;
    region_pos1z: number;
    region_pos2x: number;
    region_pos2y: number;
    region_pos2z: number;
    clan_name: string | null;
    mute_end: moment.Moment | null;
    warn_end: moment.Moment | null;
    warn_count: number;
    auth_x: number,
    auth_y: number,
    auth_z: number,
    home_x: number,
    home_y: number,
    home_z: number,
    info_bar: string,
    rpg_power: number,
    rpg_evolution: number,
    rpg_augmentation: number,
    rpg_mod: Mod | null,
    rpg_mod_level: number,
    rpg_mod_2: Mod | null,
    rpg_mod_2_level: number,
}

export const players: { [id: number]: Person; } = { };
let authTeleport: NodeJS.Timeout;
let syncAccountInfoTimeOut: NodeJS.Timeout;
let syncAccountWarnTimeOut: NodeJS.Timeout;
let syncAccountVipTimeOut: NodeJS.Timeout;
let updateMOTDTimeOut: NodeJS.Timeout;
let serverRestartTimeOut: NodeJS.Timeout;

for (let index = 0; index < maxplayers; index++) {
    players[index] = {
        id: index,
        name: null,
        object: undefined,
        admin_lvl: 0,
        vip_lvl: 0,
        vip_end: null,
        money: 0,
        money_bank: 0,
        donate: 0,
        level: 0,
        exp: 0,
        report_kd: null,
        percent_economy: 0,
        job_name: null,
        job_level: 0,
        job_exp: 0,
        authorized: false,
        region_pos1x: 0,
        region_pos1y: 0,
        region_pos1z: 0,
        region_pos2x: 0,
        region_pos2y: 0,
        region_pos2z: 0,
        clan_name: null,
        mute_end: null,
        warn_end: null,
        warn_count: 0,
        auth_x: 0,
        auth_y: 0,
        auth_z: 0,
        home_x: 0,
        home_y: 0,
        home_z: 0,
        info_bar: "OFF",
        rpg_power: 0,
        rpg_evolution: 0,
        rpg_augmentation: 0,
        rpg_mod: null,
        rpg_mod_level: 0,
        rpg_mod_2: null,
        rpg_mod_2_level: 0,
    };
}

export function getPlayerByName(name: string): Player | undefined {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === name) {
            return players[index].object;
        }
    }
    return undefined;
}

export function getPlayerById(id: number): Player | undefined{
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].id === id) {
            return players[index].object;
        }
    }
    return undefined;
}

export function getPlayerIdByName(name: string): number | undefined {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === name) {
            return players[index].id;
        }
    }
}

export function getPlayerByIdOrName(client_name_or_id: string): Player | undefined {
    const id = parseInt(client_name_or_id);
    if(isNaN(id)) {
        for (let index = 0; index < maxplayers; index++) {
            if(players[index].name === client_name_or_id) {
                return players[index].object;
            }
        }
    } else {
        if(id < maxplayers && id >= 0) {
            for (let index = 0; index < maxplayers; index++) {
                if(players[index].id === id) {
                    return players[index].object;
                }
            }
        }
    }
    return undefined;
}

export function getServerPlayerByName(client_name: string): ServerPlayer | null {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client_name) {
            const player = players[index].object;
            if(player !== undefined) {
                return player.getNetworkIdentifier().getActor();
            }
        }
    }
    return null;
}

export function getServerPlayerByObject(client: Player): ServerPlayer | null {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            const player = players[index].object;
            if(player !== undefined) {
                return player.getNetworkIdentifier().getActor();
            }
        }
    }
    return null;
}

export function getPlayerIdByObject(client: Player): number | undefined {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            return players[index].id;
        }
    }
    return undefined;
}

export function getPlayerReportCDByObject(client: Player): moment.Moment | null {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            return players[index].report_kd;
        }
    }
    return null;
}

export function setPlayerReportCDByObject(client: Player, time: moment.Moment | null): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            players[index].report_kd = time;
        }
    }
}

export function setPlayerAdminLevelByObject(client: Player, lvl: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            players[index].admin_lvl = lvl;
        }
    }
}

export function setPlayerVipLevelByObject(client: Player, lvl: number, time: moment.Moment): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            players[index].vip_lvl = lvl;
            players[index].vip_end = time;
        }
    }
}

export function setBossBar(client: Player, title: string, percent: number): void {
    removeBossBar(client);
    const pk = BossEventPacket.create();
    pk.entityUniqueId = client.getUniqueIdBin();
    pk.playerUniqueId = client.getUniqueIdBin();
    pk.type = BossEventPacket.Types.Show;
    pk.title = title;
    pk.healthPercent = percent;
    client.sendPacket(pk);
    pk.dispose();
}

export function resetTitleDuration(client: Player): void {
    const pk = SetTitlePacket.create();
    pk.type = SetTitlePacket.Types.Reset;
    client.sendPacket(pk);
    pk.dispose();
}

export function setTitleDuration(client: Player, fadeInTime: number, stayTime: number, fadeOutTime: number): void {
    const pk = SetTitlePacket.create();
    pk.type = SetTitlePacket.Types.AnimationTimes;
    pk.fadeInTime = fadeInTime;
    pk.stayTime = stayTime;
    pk.fadeOutTime = fadeOutTime;
    client.sendPacket(pk);
    pk.dispose();
}

export function sendTitle(client: Player, title: string, subtitle?: string): void {
    const pk = SetTitlePacket.create();
    pk.type = SetTitlePacket.Types.Title;
    pk.text = title;
    client.sendPacket(pk);
    pk.dispose();
    if (subtitle) {
        sendSubtitle(client, subtitle);
    }
}

export function sendSubtitle(client: Player, subtitle: string): void {
    const pk = SetTitlePacket.create();
    pk.type = SetTitlePacket.Types.Subtitle;
    pk.text = subtitle;
    client.sendPacket(pk);
    pk.dispose();
}

export function clearTitle(client: Player): void {
    const pk = SetTitlePacket.create();
    pk.type = SetTitlePacket.Types.Clear;
    client.sendPacket(pk);
    pk.dispose();
}

export function sendActionbar(client: Player, actionbar: string): void {
    const pk = SetTitlePacket.create();
    pk.type = SetTitlePacket.Types.Actionbar;
    pk.text = actionbar;
    client.sendPacket(pk);
    pk.dispose();
}

export function removeBossBar(client: Player): void {
    const pk = BossEventPacket.create();
    pk.entityUniqueId = client.getUniqueIdBin();
    pk.playerUniqueId = client.getUniqueIdBin();
    pk.type = BossEventPacket.Types.Hide;
    client.sendPacket(pk);
    pk.dispose();
}

export function setFakeScoreboard(client: Player, title: string, lines: Array<string|[string, number]>, name = `tmp-${new Date().getTime()}`): void {
    removeFakeScoreboard(client);
    {
        const pk = SetDisplayObjectivePacket.create();
        pk.displaySlot = DisplaySlot.Sidebar;
        pk.objectiveName = name;
        pk.displayName = title;
        pk.criteriaName = "dummy";
        client.sendPacket(pk);
        pk.dispose();
    }
    {
        const pk = SetScorePacket.create();
        pk.type = SetScorePacket.Type.CHANGE;
        const entries = [];
        for (const [i, line] of lines.entries()) {
            const entry = ScorePacketInfo.construct();
            entry.objectiveName = name;
            entry.scoreboardId.idAsNumber = i + 1;
            entry.type = ScorePacketInfo.Type.FAKE_PLAYER;
            if (typeof line === "string") {
                entry.score = i + 1;
                entry.customName = line;
            } else {
                entry.score = line[1];
                entry.customName = line[0];
            }
            pk.entries.push(entry);
            entries.push(entry);
        }
        client.sendPacket(pk);
        pk.dispose();
        for (const entry of entries) {
            entry.destruct();
        }
    }
}

export function removeFakeScoreboard(client: Player): void {
    const pk = SetDisplayObjectivePacket.create();
    pk.displaySlot = DisplaySlot.Sidebar;
    pk.objectiveName = "";
    pk.displayName = "";
    pk.criteriaName = "dummy";
    client.sendPacket(pk);
    pk.dispose();
}

export async function sendMessage(client: Player, message: string, type: TextPacket.Types = 1): Promise<void> {
    const pk = TextPacket.create();
    pk.type = type;
    pk.message = message;
    if (client instanceof ServerPlayer) {
        client.sendPacket(pk);
        pk.dispose();
    }
}

export async function sendVipMessage(message: string): Promise<void> {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name !== null && players[index].object !== undefined) {
            const client = players[index].object;
            if(client instanceof Player && getVipLevel(client) > 0 || client instanceof Player && getAdminLevel(client) > 0) {
                sendMessage(client, message);
            }
        }
    }
}

export async function broadcastMessage(message: string): Promise<void> {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name !== null && players[index].object !== undefined) {
            const client = players[index].object;
            if(client instanceof ServerPlayer) {
                sendMessage(client, message);
            }
        }
    }
}

export async function broadcastMessageOnlyAdmins(message: string): Promise<void> {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name !== null && players[index].object !== undefined && players[index].admin_lvl >= 1) {
            const client = players[index].object;
            if(client instanceof Player) {
                sendMessage(client, message);
            }
        }
    }
}

export function playerInZone(client: Player | Actor, Pos1X: number, Pos1Y: number, Pos1Z: number, Pos2X: number, Pos2Y: number, Pos2Z: number): boolean {
    const [x, y, z] = getPlayerPosition(client);

    const PosMinX: number = Math.min(Pos1X, Pos2X);
    const PosMaxX: number = Math.max(Pos1X, Pos2X);

    const PosMinY: number = Math.min(Pos1Y, Pos2Y);
    const PosMaxY: number = Math.max(Pos1Y, Pos2Y);

    const PosMinZ: number = Math.min(Pos1Z, Pos2Z);
    const PosMaxZ: number = Math.max(Pos1Z, Pos2Z);

    if(PosMinX <= x && x <= PosMaxX && PosMinY <= y && y <= PosMaxY && PosMinZ <= z && z <= PosMaxZ) {
        return true;
    } else {
        return false;
    }
}

export function blockInZone(block: BlockPos, Pos1X: number, Pos1Y: number, Pos1Z: number, Pos2X: number, Pos2Y: number, Pos2Z: number): boolean {
    const x: number = Math.round(block.x);
    const y: number = Math.round(block.y);
    const z: number = Math.round(block.z);


    const PosMinX: number = Math.min(Pos1X, Pos2X);
    const PosMaxX: number = Math.max(Pos1X, Pos2X);

    const PosMinY: number = Math.min(Pos1Y, Pos2Y);
    const PosMaxY: number = Math.max(Pos1Y, Pos2Y);

    const PosMinZ: number = Math.min(Pos1Z, Pos2Z);
    const PosMaxZ: number = Math.max(Pos1Z, Pos2Z);

    if(PosMinX <= x && x <= PosMaxX && PosMinY <= y && y <= PosMaxY && PosMinZ <= z && z <= PosMaxZ) {
        return true;
    } else {
        return false;
    }
}

export function getAdmins(): Player[] {
    const data: Player[] = [];
    for (let index = 0; index < maxplayers; index++) {
        const client = players[index].object;
        if(players[index].name !== null && client !== undefined && players[index].admin_lvl >= 1) {
            data.push(client);
        }
    }
    return data;
}

export function getAdminLevel(client: Player): number {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            return players[index].admin_lvl;
        }
    }
    return -1;
}

export function getVipLevel(client: Player): number {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            return players[index].vip_lvl;
        }
    }
    return -1;
}

export function getMoney(client: Player): number {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            return players[index].money;
        }
    }
    return -1;
}

export function setMoney(client: Player, sum: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].money = sum;
            addEconomyStats(sum);
            addEconomyStatsToday(sum);
        }
    }
}

export function addMoney(client: Player, sum: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].money += sum;
            addEconomyStats(sum);
            addEconomyStatsToday(sum);
        }
    }
}

export function takeMoney(client: Player, sum: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].money -= sum;
            takeEconomyStats(sum);
            takeEconomyStatsToday(sum);
        }
    }
}

export function getMoneyBank(client: Player): number {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            return players[index].money_bank;
        }
    }
    return -1;
}

export function setMoneyBank(client: Player, sum: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].money_bank = sum;
            addEconomyStats(sum);
            addEconomyStatsToday(sum);
        }
    }
}

export function addMoneyBank(client: Player, sum: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].money_bank += sum;
            addEconomyStats(sum);
            addEconomyStatsToday(sum);
        }
    }
}

export function takeMoneyBank(client: Player, sum: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].money_bank -= sum;
            takeEconomyStats(sum);
            takeEconomyStatsToday(sum);
        }
    }
}

export function getLevel(client: Player): number {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            return players[index].level;
        }
    }
    return -1;
}

export function setLevel(client: Player, sum: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].level = sum;
        }
    }
}

export function addLevel(client: Player, sum: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].level += sum;
        }
    }
}

export function setExp(client: Player, sum: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].exp = sum;
        }
    }
}

export function addExp(client: Player, sum: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].exp += sum;
        }
    }
}

export function getLimitExp(client: Player): number {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            return (getLevel(client) + 1) * 35;
        }
    }
    return -1;
}

export function getNextLimitExp(client: Player): number {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            return (getLevel(client) + 2) * 35;
        }
    }
    return -1;
}

export function getExp(client: Player): number {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            return players[index].exp;
        }
    }
    return -1;
}

export function sendPopup(client: Player, message: string, type: TextPacket.Types = 3): void {
    const pk = TextPacket.create();
    pk.type = type;
    pk.message = message;
    client.sendPacket(pk);
    pk.dispose();
}

export function sendTip(client: Player, message: string, type: TextPacket.Types = 5): void {
    const pk = TextPacket.create();
    pk.type = type;
    pk.message = message;
    client.sendPacket(pk);
    pk.dispose();
}

export function getIP(client: Player): string {
    const ip: string[] = client.getNetworkIdentifier().getAddress().split('|');
    return ip[0];
}

export function getPercentBank(client: Player): number {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            return players[index].percent_economy;
        }
    }
    return -1;
}

export function Percent_Minus(sum: number, percent: number) : number {
    const number_percent: number = sum / 100 * percent;
    const itog: number = sum - number_percent;
    return Math.round(itog);
}

export function Percent_Plus(sum: number, percent: number) : number {
    const number_percent: number = sum / 100 * percent;
    const itog: number = sum + number_percent;
    return Math.round(itog);
}

export async function syncAccountInfo(): Promise<void> {
    syncAccountInfoTimeOut = setTimeout(async () => {
        for (let index = 0; index < maxplayers; index++) {
            if(players[index].authorized === true) {
                const client = players[index].object;
                const client_name = players[index].name;
                if(client !== undefined && client_name !== null) {
                    setAccountInfoSql(client_name, players[index].admin_lvl, players[index].vip_lvl, players[index].money, players[index].money_bank,
                        players[index].level, players[index].exp, players[index].percent_economy, players[index].job_name, players[index].job_level,
                        players[index].job_exp, players[index].donate);
                }
            }
        }
        syncAccountInfo();
    }, 10000);
}

export function stopsyncAccountInfo(): void {
    clearInterval(syncAccountInfoTimeOut);
    console.log('[INFO] syncAccountInfoTimeOut stopped!');
}

export function getJobName(client: Player): string | null {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            return players[index].job_name;
        }
    }
    return null;
}

export function getJobLevel(client: Player): number {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            return players[index].job_level;
        }
    }
    return -1;
}

export function getJobExp(client: Player): number {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            return players[index].job_exp;
        }
    }
    return -1;
}

export function getJobLimitExp(client: Player | undefined): number {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client?.getName() && players[index].object === client) {
            return (players[index].job_level + 1) * 50;
        }
    }
    return -1;
}

export function addJobExp(client: Player, sum: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].job_exp += sum;
        }
    }
}

export function addJobLevel(client: Player, sum: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].job_level += sum;
        }
    }
}

export function setJobExp(client: Player, sum: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].job_exp = sum;
        }
    }
}

export function setJobLevel(client: Player, sum: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].job_level = sum;
        }
    }
}

export function setJob(client: Player, job_name: string): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].job_name = job_name;
        }
    }
}

export function addJobLevelAndExp(client: Player, killer = false): void {
    const level = getJobLevel(client);
    if(level < 5) {

        if(getVipLevel(client) !== 0) {
            addJobExp(client, 2);
        } else {
            addJobExp(client, 1);
        }

        const exp = getJobExp(client);
        if(exp >= getJobLimitExp(client)) {
            setJobExp(client, 0);
            addJobLevel(client, 1);
        }
    }

    if(!killer) {
        const money: number = randomBetweenTwoNumbers(3 * level, 0);
        if(money !== 0) {
            addMoney(client, money);
            sendPopup(client, `+${money}`);
        }
    }
}

export function clearActiveJob(client: Player): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client && players[index].job_name !== null) {
            players[index].job_name = null;
            players[index].job_exp = 0;
            players[index].job_level = 0;
        }
    }
}

export function setAuthorized(client: Player, status: boolean): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            players[index].authorized = status;
        }
    }
}

export function getAuthorized(client: Player): boolean {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            return players[index].authorized;
        }
    }
    return false;
}

export function setMoneyCache(client: Player, sum: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].money = sum;
        }
    }
}

export function setPercentCache(client: Player, sum: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].percent_economy = sum;
        }
    }
}

export function getPlayerPosition(client: Player | Actor): number[] {
    const pos: number[] = [Math.round(client.getPosition().x), Math.round(client.getPosition().y - 2), Math.round(client.getPosition().z)];
    return pos;
}

export function setRegionPlayerPos1(client: Player): void {
    const [pos1x, pos1y, pos1z] = getPlayerPosition(client);
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].region_pos1x = pos1x;
            players[index].region_pos1y = pos1y;
            players[index].region_pos1z = pos1z;
        }
    }
}

export function setRegionPlayerPos2(client: Player): void {
    const [pos2x, pos2y, pos2z] = getPlayerPosition(client);
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].region_pos2x = pos2x;
            players[index].region_pos2y = pos2y;
            players[index].region_pos2z = pos2z;
        }
    }
}

export function getRegionPlayerPos1(client: Player): number[] {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            const data: number[] = [
                players[index].region_pos1x,
                players[index].region_pos1y,
                players[index].region_pos1z
            ];
            return data;
        }
    }
    return [-1, -1, -1];
}

export function getRegionPlayerPos2(client: Player): number[] {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            const data: number[] = [
                players[index].region_pos2x,
                players[index].region_pos2y,
                players[index].region_pos2z
            ];
            return data;
        }
    }
    return [-1, -1, -1];
}

export function clearRegionPlayerPos(client: Player): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === client.getName() && players[index].object === client) {
            players[index].region_pos1x = 0;
            players[index].region_pos1y = 0;
            players[index].region_pos1z = 0;
            players[index].region_pos2x = 0;
            players[index].region_pos2y = 0;
            players[index].region_pos2z = 0;
        }
    }
}

export function getAllPlayers(client: Player | undefined): string[] {
    const data: string[] = [];
    if(client !== undefined) {
        for (let index = 0; index < maxplayers; index++) {
            const client_name = players[index].name;
            if(players[index].object !== undefined && players[index].authorized === true && client_name !== client.getName() && client_name !== null) {
                data.push(client_name);
            }
        }
    } else {
        for (let index = 0; index < maxplayers; index++) {
            const client_name = players[index].name;
            if(players[index].object !== undefined && players[index].authorized === true && client_name !== null) {
                data.push(client_name);
            }
        }
    }
    return data;
}

export function networkkick(networkid: NetworkIdentifier, message: string): void {
    const packet = DisconnectPacket.create();
    packet.message = message;
    packet.sendTo(networkid, 0);
    packet.dispose();
}

export function kick(client: Player, message: string): void {
    const networkid = client.getNetworkIdentifier();
    const packet = DisconnectPacket.create();
    packet.message = message;
    packet.sendTo(networkid, 0);
    packet.dispose();
}

export function isOnline(client: Player | string): boolean {
    if(client instanceof Player) {
        for (let index = 0; index < maxplayers; index++) {
            if(players[index].object === client) {
                return true;
            }
        }
    } else {
        for (let index = 0; index < maxplayers; index++) {
            if(players[index].name === client) {
                return true;
            }
        }
    }
    return false;
}

export function addCommas(number: string): string {
    number += '';
    const x = number.split('.');
    let x1 = x[0];
    const x2 = x.length > 1 ? '.' + x[1] : '';
    const rgx = /(\d+)(\d{3})/;

    while (rgx.test(x1)) {
        x1 = x1.replace(rgx, '$1' + '.' + '$2');
    }

    return x1 + x2;
}

export function randomBetweenTwoNumbers(max: number, min: number): number {
    const rndValue: number = Math.floor(Math.random() * max) + min;
    return rndValue;
}

export function getDistancePlayers(client: Player, target: Player): number {
    const [x1, y1, z1] = getPlayerPosition(client);
    const [x2, y2, z2] = getPlayerPosition(target);
    const value: number = Math.round(Math.sqrt((x2 - x1)**2 + (y2 - y1)**2 + (z2 - z1)**2));
    return value;
}

export function getDistanceRegionPositions(region_name: string): number {
    const [x1, y1, z1] = getRegionPos1(region_name);
    const [x2, y2, z2] = getRegionPos2(region_name);
    const value: number = Math.round(Math.sqrt((x2 - x1)**2 + (y2 - y1)**2 + (z2 - z1)**2));
    return value;
}

export function getDistancePositions(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number {
    const value: number = Math.round(Math.sqrt((x2 - x1)**2 + (y2 - y1)**2 + (z2 - z1)**2));
    return value;
}

export function getClanByPlayer(client: Player | string): string | null {
    if(client instanceof Player) {
        for (let index = 0; index < maxplayers; index++) {
            if(players[index].object === client) {
                return players[index].clan_name;
            }
        }
    } else {
        for (let index = 0; index < maxplayers; index++) {
            if(players[index].name === client) {
                return players[index].clan_name;
            }
        }
    }
    return null;
}

export function setClanPlayerByObject(client: Player, clan_name: string): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            players[index].clan_name = clan_name;
        }
    }
}

export function removeClanPlayerByObject(client: Player): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            players[index].clan_name = null;
        }
    }
}

export function getPlayersForClans(): Player[] {
    const data: Player[] = [];
    for (let index = 0; index < maxplayers; index++) {
        const client = players[index].object;
        if(players[index].clan_name === null && client instanceof Player && players[index].level >= 3) {
            data.push(client);
        }
    }
    return data;
}

export function getPlayersNamesForClans(): string[] {
    const data: string[] = [];
    for (let index = 0; index < maxplayers; index++) {
        const client_name = players[index].name;
        if(players[index].clan_name === null && client_name != null && players[index].level >= 3) {
            data.push(client_name);
        }
    }
    return data;
}

export function getMuteByObject(client: Player): moment.Moment | null {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            return players[index].mute_end;
        }
    }
    return null;
}

export function getWarnByObject(client: Player): moment.Moment | null {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            return players[index].warn_end;
        }
    }
    return null;
}

export function getWarnCountByObject(client: Player): number | null {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            return players[index].warn_count;
        }
    }
    return null;
}

export function setMuteByObject(client: Player, time: moment.Moment): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            players[index].mute_end = time;
        }
    }
}

export function setWarnByObject(client: Player, time: moment.Moment): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            players[index].warn_end = time;
        }
    }
}

export function setWarnCountByObject(client: Player, count: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            players[index].warn_count = count;
        }
    }
}

export function pluginRun(): void {
    plugins_running++;
}

export function getpluginRun(): number {
    return plugins_running;
}

export function getTimeFormat(time?: string | Date | moment.Moment, format?: string): string {
    if(format === undefined) {
        return moment(time).tz('Europe/Moscow').format('YYYY-MM-DD HH:mm:ss');
    } else {
        return moment(time).tz('Europe/Moscow').format(format);
    }
}

export function getTime(time?: string | Date): moment.Moment {
    if(time === undefined) {
        return moment().tz('Europe/Moscow');
    } else {
        return moment(time).tz('Europe/Moscow');
    }
}

export async function syncAccountWarnTime(): Promise<void> {
    syncAccountWarnTimeOut = setTimeout(async () => {
        for (let index = 0; index < maxplayers; index++) {
            const client_name = players[index].name;
            if(players[index].warn_end !== null && client_name !== null) {
                if(!getTime().isBefore(players[index].warn_end)) {
                    removeWarnSql(client_name, 3);
                    players[index].warn_end = null;
                    players[index].warn_count = 0;
                }
            }
        }
        syncAccountWarnTime();
    }, 20000);
}

export function stopSyncAccountWarnTime(): void {
    clearTimeout(syncAccountWarnTimeOut);
    console.log('[INFO] syncAccountWarnTimeOut stopped!');
}

export async function syncAccountVipTime(): Promise<void> {
    syncAccountVipTimeOut = setTimeout(async () => {
        for (let index = 0; index < maxplayers; index++) {
            const client_name = players[index].name;
            if(players[index].vip_end !== null && client_name !== null) {
                if(!getTime().isBefore(players[index].vip_end)) {
                    const client = players[index].object;
                    setVipLevelSql(client_name, 0);
                    players[index].vip_end = null;
                    players[index].vip_lvl = 0;
                    if(client !== undefined) {
                        sendMessage(client, `${info} Ваш VIP статус закончился! Приобрести VIP статус можно в ${yellow}/donate${white}!`);
                    }
                }
            }
        }
        syncAccountWarnTime();
    }, 20000);
}

export function stopSyncAccountVipTime(): void {
    clearTimeout(syncAccountVipTimeOut);
    console.log('[INFO] syncAccountVipTimeOut stopped!');
}

export function getDonate(client: Player): number {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            return players[index].donate;
        }
    }
    return 0;
}

export function setDonate(client: Player, sum: number): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            players[index].donate = sum;
        }
    }
}

export function getVipEnd(client: Player): null | moment.Moment {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            return players[index].vip_end;
        }
    }
    return null;
}

export function setAccountInfo(client_id: number, client: Player, admin_lvl: number, vip_lvl: number, vip_end: moment.Moment | null,
    money: number, money_bank: number, donate: number, level: number, exp: number, percent_economy: number, job_name: null | string,
    job_level = 0, job_exp = 0, clan_name: null | string, mute_end: moment.Moment | null, warn_end: moment.Moment | null,
    warn_count: number, home_x: number, home_y: number, home_z: number, info_bar: string, rpg_evolution: number,
    rpg_augmentation: number, rpg_mod: Mod | null, rpg_mod_level: number, rpg_mod_2: Mod | null, rpg_mod_2_level: number): void {
    players[client_id] = {
        id: client_id,
        name: client.getName(),
        object: client,
        admin_lvl: admin_lvl,
        vip_lvl: vip_lvl,
        vip_end: vip_end,
        money: money,
        money_bank: money_bank,
        donate: donate,
        level: level,
        exp: exp,
        report_kd: null,
        percent_economy: percent_economy,
        job_name: job_name,
        job_level: job_level,
        job_exp: job_exp,
        authorized: true,
        region_pos1x: 0,
        region_pos1y: 0,
        region_pos1z: 0,
        region_pos2x: 0,
        region_pos2y: 0,
        region_pos2z: 0,
        clan_name: clan_name,
        mute_end: mute_end,
        warn_end: warn_end,
        warn_count: warn_count,
        auth_x: 0,
        auth_y: 0,
        auth_z: 0,
        home_x: home_x,
        home_y: home_y,
        home_z: home_z,
        info_bar: info_bar,
        rpg_power: 0,
        rpg_evolution: rpg_evolution,
        rpg_augmentation: rpg_augmentation,
        rpg_mod: rpg_mod,
        rpg_mod_level: rpg_mod_level,
        rpg_mod_2: rpg_mod_2,
        rpg_mod_2_level: rpg_mod_2_level,
    };
}

export function updateExp(client: Player, exp: number): void {
    addExp(client, exp);

    if(getLimitExp(client) <= getExp(client)) {
        addLevel(client, 1);
        setExp(client, 0);
        const level = getLevel(client);
        const client_id = getPlayerIdByObject(client);

        if(level > 10) {
            client.setScoreTag(`ID: ${client_id} | Level: ${level}`);
        } else {
            client.setScoreTag(`ID: ${client_id} | Level: ${addCommas(level.toString())}`);
        }

        sendPopup(client, `LEVEL UP | ${level} | ${gold}+${green}500 ${white}Поликов`);
        addMoney(client, 500);
    }
}

export function lacksExp(client: Player): number {
    return getLimitExp(client) - getExp(client);
}

export function buyDonateExp(client: Player, buy_exp: number): void {
    const exp = getExp(client);
    const exp_limit = buy_exp + exp;
    const level = (Math.ceil(exp_limit / 35) - 1) + getLevel(client);
    const exp_max = level * 35;
    const exp_left = exp_limit - exp_max;
    setExp(client, exp_left);
    setLevel(client, level);
    console.log(exp, exp_limit, level, exp_max, exp_left, buy_exp);
}

export function isVip(client: Player, time?: moment.Moment): boolean {
    if(getVipLevel(client) < 1) {
        return false;
    }

    if(time === undefined) {
        if(getTime().isBefore(getVipEnd(client))) {
            return true;
        } else {
            return false;
        }
    } else {
        if(getTime().isBefore(time)) {
            return true;
        } else {
            return false;
        }
    }
}

export function removeVip(client: Player): void {
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].object === client) {
            players[index].vip_lvl = 0;
        }
    }
}

export async function updateMOTD(): Promise<void> {
    //ＱＵＡＲＴＺＬＡＮＤ
    let count = 0;
    updateMOTDTimeOut = setInterval(async () => {
        switch (count) {
            case 0:
                serverInstance.setMotd(`${white}ＱＵＡＲＴＺ${blue}ＬＡＮＤ ${white}| ${yellow}Autumn!`);
                break;

            case 1:
                serverInstance.setMotd(`${white}ＱＵＡＲＴＺ${blue}ＬＡＮＤ ${white}| ${red}Survival!`);
                break;

            case 2:
                serverInstance.setMotd(`${white}ＱＵＡＲＴＺ${blue}ＬＡＮＤ ${white}| ${pink}NEW Regions!`);
                break;

            case 3:
                serverInstance.setMotd(`${white}ＱＵＡＲＴＺ${blue}ＬＡＮＤ ${white}| ${coursive}Updated!`);
                count = 0;
                break;
        }
    }, 5000);
}

export function stopUpdateMOTD(): void {
    clearTimeout(updateMOTDTimeOut);
    console.log('[INFO] updateMOTD stopped!');
}

export async function autoRestart(): Promise<void> {
    const time_restart = getTime().add(1, 'day').set({hour: 3, minute: 57, seconds: 0});
    console.log(`Next restart: ${getTimeFormat(time_restart)}`);
    serverRestartTimeOut = setInterval(async () => {
        if(getTime().isAfter(time_restart)) {
            clearInterval(serverRestartTimeOut);
            broadcastMessage(`${info} ${red}Внимание! Через 2 минуты будет рестарт сервера!`);
            serverRestartTimeOut = setTimeout(() => {
                for(let index = 0; index < maxplayers; index++) {
                    const client = players[index].object;
                    if(client !== undefined && players[index].name !== null) {
                        kick(client, `${info} Сервер перезапускается! Пожалуйста, зайдите позже!`)
                    }
                }
            }, 120000);
        }
    }, 60000);
}

export function stopAutoRestart(): void {
    clearTimeout(serverRestartTimeOut);
    console.log('[INFO] AutoRestart stopped!');
}

export function stopServer(): void {
    plugins_running = 0;
    for(let index = 0; index < maxplayers; index++) {
        const client = players[index].object;
        if(client instanceof Player) {
            kick(client, `${info} Сервер перезапускается! Пожалуйста, зайдите позже!`)
        }
    }

    setTimeout(() => {
        bedrockServer.executeCommand('stop');
    }, 3000);
}

export function runAuthTeleport(): void {
    authTeleport = setInterval(() => {
        for(let index = 0; index < maxplayers; index++) {
            const client = players[index].object;
            if(client instanceof Player && players[index].authorized === false) {
                const [x2, y2, z2] = getPlayerPosition(client);
                if(players[index].auth_x !== x2 || players[index].auth_y !== y2 || players[index].auth_z !== z2) {
                    client.teleport(Vec3.create(players[index].auth_x, players[index].auth_y, players[index].auth_z));
                }
            }
        }
    }, 1000)
}

export function stopAuthTeleport(): void {
    clearInterval(authTeleport);
    console.log('[INFO] authTeleport stopped!');
}

export function bcryptHashed(s: string, rounds = 2): string {
    const salt = bcrypt.genSaltSync(rounds);
    const hash = bcrypt.hashSync(s, salt);
    return hash
}

export function bcryptHashCompare(s: string, hash: string): boolean {
    const result = bcrypt.compareSync(s, hash);
    return result;
}

export async function setHome(client: Player): Promise<void> {
    for (let index = 0; index < maxplayers; index++) {
        if(client === players[index].object && players[index].authorized === true) {
            const [x, y, z] = getPlayerPosition(client);
            players[index].home_x = x;
            players[index].home_y = y;
            players[index].home_z = z;
            const client_name = client.getName();
            getHomeSql(client_name)
                .then((home) => {
                    if(home[0] === null || home[0] === undefined) {
                        setHomeSql(client_name, x, y, z);
                    } else {
                        updateHomeSql(client_name, x, y, z);
                    }
                })
                .catch((err) => {
                    console.error(err);
                })
        }
    }
}

export function getHome(client: Player): Vec3 | null {
    for (let index = 0; index < maxplayers; index++) {
        if(client === players[index].object && players[index].authorized === true) {
            if(players[index].home_x === 0 || players[index].home_y === 0 || players[index].home_z === 0) {
                return null;
            }

            return Vec3.create(players[index].home_x, players[index].home_y, players[index].home_z);
        }
    }
    return null;
}

export function getInfoBarStatus(client: Player): string {
    for (let index = 0; index < maxplayers; index++) {
        if(client === players[index].object && players[index].authorized === true) {
            return players[index].info_bar;
        }
    }
    return "OFF";
}

export function setInfoBarStatus(client: Player, status: boolean): void {
    for (let index = 0; index < maxplayers; index++) {
        if(client === players[index].object && players[index].authorized === true) {
            const client_name = players[index].name as string;
            if(status) {
                players[index].info_bar = "ON";
                setInfoBarStatusSql(client_name, "ON");
            } else {
                players[index].info_bar = "OFF";
                setInfoBarStatusSql(client_name, "OFF");
            }
        }
    }
}

export function getStats(client: Player): string {
    const lvl: string = addCommas(getLevel(client).toString());
    const exp: string = addCommas(getExp(client).toString());
    const limit_exp: string = addCommas(getLimitExp(client).toString());
    const admin_lvl: number = getAdminLevel(client);
    const vip_lvl: number = getVipLevel(client);
    const money: string = addCommas(getMoney(client).toString());
    const money_bank: string = addCommas(getMoneyBank(client).toString());
    const percent: number = getPercentBank(client);
    const job_name: string | null = getJobName(client);
    const job_level: number = getJobLevel(client);
    const job_exp: number = getJobExp(client);
    const job_limit_exp: number = getJobLimitExp(client);
    const mute = getMuteByObject(client);
    const warn_count = getWarnCountByObject(client);
    const warn_time = getWarnByObject(client);
    const home = getHome(client);

    let msg = '';
    msg += `Уровень: ${lvl}\n`;
    msg += `Опыт: [${exp} / ${limit_exp}]\n`;
    msg += `Уровень админа: [ ${admin_lvl} ]\n`;
    msg += `Уровень VIP: [ ${vip_lvl} ]\n`;
    msg += `Баланс: [ ${money} ]\n`;
    msg += `Баланс в банке: [ ${money_bank} ]\n`;
    msg += `Процент в банке: [ ${percent} ]\n`;

    if(job_name !== null) {
        msg += `Работа: [ ${job_name} ]\n`;
        msg += `Опыт работы: [ ${job_exp} / ${job_limit_exp}]\n`;
        msg += `Уровень работы: [ ${job_level} / 5 ]\n`;
    } else {
        msg += `Работа: [ Нету ]\n`;
    }

    if(mute !== null) {
        if(getTime().isBefore(mute)) {
            msg += 'Блокировка чата: [ Есть ]\n';
        }
    }

    if(warn_count !== 0) {
        msg += `${red}Предупреждения: [${warn_count} / 3]${white}\n`;
    } else {
        msg += `Предупреждения: [${warn_count} / 3]\n`;
    }

    if(warn_time !== null) {
        if(getTime().isBefore(warn_time) && warn_count !== null && warn_count > 0) {
            msg += `Предупреждения аннулируются через ${yellow}${warn_time.diff(getTime(), 'days') + 1}${white} дней!`;
        }
    }

    if(home !== null) {
        msg += `Точка дома: X: ${yellow}${home.x}${white} | Y: ${yellow}${home.y}${white} | Z: ${yellow}${home.z}${white}`;
    } else {
        msg += `Точка дома: [ Нету ]`;
    }

    return msg;
}

export function getRpgPower(client: Player): number {
    for (let index = 0; index < maxplayers; index++) {
        if(client === players[index].object && players[index].authorized === true) {
            return players[index].rpg_power;
        }
    }
    return 0;
}

export function getRpgAugmentation(client: Player): number {
    for (let index = 0; index < maxplayers; index++) {
        if(client === players[index].object && players[index].authorized === true) {
            return players[index].rpg_augmentation;
        }
    }
    return 0;
}

export function getRpgEvolution(client: Player): number {
    for (let index = 0; index < maxplayers; index++) {
        if(client === players[index].object && players[index].authorized === true) {
            return players[index].rpg_evolution;
        }
    }
    return 0;
}

export function getRpgMod(client: Player): any[] {
    for (let index = 0; index < maxplayers; index++) {
        if(client === players[index].object && players[index].authorized === true) {
            return [players[index].rpg_mod, players[index].rpg_mod_level];
        }
    }
    return [null, 0];
}

export function getRpgMod2(client: Player): any[] {
    for (let index = 0; index < maxplayers; index++) {
        if(client === players[index].object && players[index].authorized === true) {
            return [players[index].rpg_mod_2, players[index].rpg_mod_2_level];
        }
    }
    return [null, 0];
}

export function setRpgRandomMod(client: Player): void {
    for (let index = 0; index < maxplayers; index++) {
        if(client === players[index].object && players[index].authorized === true) {
            const value = randomBetweenTwoNumbers(Object.keys(mods).length / 2, 0);
            players[index].rpg_mod = convertRpgModSqlToClass(mods[value], 1);
            players[index].rpg_mod_level = 1;
            setRpgModSql(client.getName(), mods[value], 1);
        }
    }
}

export function convertRpgModSqlToClass(mod: string, rpg_mod_level: number): Mod | null {
    switch (mod) {
        case mods[0]:
            return new RpgModShield(rpg_mod_level);
        case mods[1]:
            return new RpgModWar(rpg_mod_level);
        case mods[2]:
            return new RpgModThorns(rpg_mod_level);
        case mods[3]:
            return new RpgModLunge(rpg_mod_level);
        case mods[4]:
            return new RpgModCorrosion(rpg_mod_level);
        case mods[5]:
            return new RpgModShock(rpg_mod_level);
        case mods[6]:
            return new RpgModLeakage(rpg_mod_level);
        case mods[7]:
            return new RpgModGiftOfLife(rpg_mod_level);
    }

    switch (mod) {
        case mods2[0]:
            return new RpgModResuscitation(rpg_mod_level);
    }

    return null;
}