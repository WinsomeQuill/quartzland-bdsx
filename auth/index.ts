import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { Player, ServerPlayer } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { blue, error, getAuthorized, getIP, getPlayerByName,
    getPlayerPosition, getpluginRun, getTime, isOnline, kick, networkkick, sendMessage,
    white, yellow } from "../management";
import { getAdminBanSql, getBanSql, getPassWord, getRegIp, isInDb } from "../sqlmanager";
import { authForm, banForm, regForm } from "./forms";
import { playerLog } from "../logs/index";
import { Vec3 } from "bdsx/bds/blockpos";
import { ItemStack } from "bdsx/bds/inventory";

events.serverOpen.on(()=>{
    console.log('[+] Auth enabled!');
});

events.serverClose.on(()=>{
    console.log('[-] Auth disabled!');
});

events.packetAfter(MinecraftPacketIds.Login).on((ptr, network)=>{
    if (ptr.connreq === null) return;
    if(getpluginRun() !== 2) {
        networkkick(network, `${white}Quartz${blue}Land ${white}| ${yellow}Сервер еще не запущен, пожалуйста, подождите!`);
        return;
    }
});

events.playerJoin.on((e) => {
    const client = e.player;
    const network = client.getNetworkIdentifier();

    if (client instanceof Player) {
        const client_name = client.getName();
        const [x1, y1, z1] = getPlayerPosition(client);

        getRegIp(client_name)
            .then((result) => {
                if(result[0] !== undefined && result[0] !== null) {
                    playerLog(client_name, `Вошел на сервер! (IP: ${getIP(client)}) (Reg IP: ${result[0]['RegIP']})`);
                } else {
                    playerLog(client_name, `Вошел на сервер! (IP: ${getIP(client)})`);
                }
            })
            .catch((err) => {
                console.error(err);
            });

        getBanSql(client_name)
            .then((ban) => {
                if(ban[0] !== undefined && ban[0] !== null) {
                    if(ban[0]['ban_end'] !== undefined && ban[0]['ban_end'] !== null) {
                        const ban_end = getTime(new Date(ban[0]['ban_end']));
                        const ban_gived = getTime(new Date(ban[0]['ban_gived'])).format('YYYY-MM-DD hh:mm:ss');
                        const ban_reason = ban[0]['ban_reason'];
                        if(getTime().isBefore(ban_end)) {
                            getAdminBanSql(client_name)
                                .then((admin_name) => {
                                    playerLog(client_name, `Вышел с сервера! Причина: Аккаунт заблокирован! (Выдал: ${admin_name[0]['user_name']}) (Выдан: ${ban_gived}) (Заканчивается: ${ban_end.format('YYYY-MM-DD hh:mm:ss')}) (Причина: ${ban_reason})`);
                                    banForm(network, admin_name[0]['user_name'], ban_gived, ban_end.format('YYYY-MM-DD hh:mm:ss'), ban_end.diff(getTime(), 'days') + 1, ban_reason);
                                    return;
                                })
                                .catch((err) => {
                                    console.error(err);
                                });
                        }
                    }
                }
            })
            .catch((err) => {
                console.error(err);
            });

        isInDb(client_name)
            .then((result) => {
                const timer = setTimeout(() => {
                    if(isOnline(client) && getAuthorized(client) === false) {
                        playerLog(client_name, `Вышел с сервера! Причина: Время авторизации вышло!`);
                        kick(client, `${yellow}Время авторизации вышло!`);
                        client.teleport(Vec3.create(x1, y1, z1));
                    }
                }, 30000);
                if(result[0] !== undefined) {
                    getPassWord(client_name)
                        .then((data) => {
                            authForm(client, undefined, data[0]['password'], 0, x1, y1, z1, timer);
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                } else {
                    regForm(client, undefined, x1, y1, z1, timer);
                }
            })
            .catch((err) => {
                console.error(err);
            });
    }
});

events.blockDestroy.on((e) => {
    const client = e.player;
    if(getAuthorized(client) === false) {
        return CANCEL;
    }
});

events.blockPlace.on((e) => {
    const client = e.player;
    if(getAuthorized(client) === false) {
        return CANCEL;
    }
});

events.playerDropItem.on((e) => {
    const client = e.player;
    const server_client = client.getNetworkIdentifier().getActor();
    if(getAuthorized(client) === false && server_client instanceof ServerPlayer) {
        const result = stopDrop(server_client, e.itemStack);
        return result;
    }
});

function stopDrop(client: ServerPlayer, object: ItemStack): CANCEL {
    const inv = client.getInventory();
    console.log(inv.getSelectedSlot(), object.getName(), object.getAmount());
    inv.setItem(inv.getSelectedSlot(), ItemStack.create(object.getName(), object.getAmount()), 0, true);
    client.sendInventory(false);
    kick(client, `${yellow}Вы не смогли авторизоваться и были кикнуты!`);
    return CANCEL;
}

events.packetBefore(MinecraftPacketIds.NpcRequest).on((e) => {
    const client_name = e.getName();
    const client = getPlayerByName(client_name);
    if(client instanceof Player) {
        if(getAuthorized(client) === false) {
            return CANCEL;
        }
    }
});

events.playerAttack.on((e) => {
    const client = e.player;
    const target = e.victim;
    if(client instanceof Player && target instanceof Player) {
        if(getAuthorized(target) === false) {
            sendMessage(client, `${error} Данный игрок еще не авторизован!`);
            return CANCEL;
        }
    }
});

events.entityHurt.on((e) => {
    const client = e.entity;
    if(client instanceof Player) {
        if(getAuthorized(client) === false) {
            return CANCEL;
        }
    }
});