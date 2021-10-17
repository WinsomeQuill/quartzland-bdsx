import { AttributeId } from "bdsx/bds/attribute";
import { Player, ServerPlayer } from "bdsx/bds/player";
import { events } from "bdsx/event";
import { broadcastMessage, broadcastMessageOnlyAdmins, dark_blue, dark_gray, error, getAdminLevel,
    getMuteByObject, getPlayerByIdOrName, getPlayerByName, getPlayerIdByName,
    getPlayerIdByObject, getPlayerPosition, getPlayerReportCDByObject, getTime, getTimeFormat,
    getVipLevel, info, isVip, maxplayers, playerInZone, players,
    sendMessage, sendVipMessage, setDonate, setPlayerAdminLevelByObject, setPlayerReportCDByObject,
    setPlayerVipLevelByObject, success, getVipEnd,
    removeVip, setHome, getHome, getStats, getAuthorized } from "../management/index";
import { blue, gray, green, red, white, yellow } from "../management/index";
import { Vec3 } from "bdsx/bds/blockpos";
import { adminListForm, apanelMenuForm, clientStatsForm, donateMenuForm, mainMenu, personalMessageForm } from "./forms";
import { setAccountInfoSql } from "../sqlmanager";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { CANCEL } from "bdsx/common";
import { playerLog } from "../logs/index";

events.serverOpen.on(()=>{
    console.log('[+] QuartzLandCore enabled!');
});

events.serverClose.on(()=>{
    console.log('[-] QuartzLandCore disabled!');
});

events.entityCreated.on(async (e) => { //Anti Mob in Spawn
    const entity = e.entity;
    if(!entity.isPlayer() && !entity.isItem()) {
        if(playerInZone(entity, 387, 220, 385, 262, 153, 259)) {
            entity.teleport(Vec3.create(0, 0, 0));
        }
    }
});

events.packetBefore(MinecraftPacketIds.CommandRequest).on((e, n) => {
    const cmd = e.command.split(' ');
    if(cmd[0] === '/me' || cmd[0] === '/tell' || cmd[0] === '/w' || cmd[0] === '/msg') {
        n.getActor()?.sendMessage(`${error} Данная команда не работает и скоро будет удалена!`);
        return CANCEL;
    }
 });

events.packetBefore(MinecraftPacketIds.Text).on((e, n) => {
    const client = n.getActor();
    if(client instanceof ServerPlayer) {

        const mute = getMuteByObject(client);
        if(mute !== null) {
            if(getTime().isBefore(mute)) {
                sendMessage(client, `${error} Блокировка чата истекает через ${mute.diff(getTime(), 'seconds') + 1} секунд!`);
                return CANCEL;
            }
        }

        const [x1,, z1] = getPlayerPosition(client);
        const world1 = client.getDimensionId();
        const client_name = client.getName();
        const client_id = getPlayerIdByName(client_name);

        for(let index = 0; index < maxplayers; index++) {
            const target = players[index].object;
            if(target instanceof Player) {
                const [x2,, z2] = getPlayerPosition(target);
                const world2 = target.getDimensionId();
                const r_x = x1 - x2;
                const r_z = z1 - z2;
                if(world1 === world2 && r_x < 10 && r_z < 10 && r_x > -10 && r_z > -10) {
                    sendMessage(target, `[${client_id}] ${client_name} ${dark_gray}>${white} ${e.message}`);
                }
            }
        }
        return CANCEL;
    }
});

events.playerJoin.on((e) => {
    broadcastMessage(`${white}[${green}+${white}] Игрок ${yellow}${e.player.getName()}${white} подключился!`);
    for (let index = 0; index < maxplayers; index++) {
        if(players[index].name === null && players[index].object === undefined) {
            const [x1, y1, z1] = getPlayerPosition(e.player);
            players[index] = {
                id: index,
                name: e.player.getName(),
                object: e.player,
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
                auth_x: x1,
                auth_y: y1,
                auth_z: z1,
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
            console.log(`Player ID: ${index} | Name: ${e.player.getName()} added in array!`);
            break;
        }
    }
});

events.networkDisconnected.on(networkIdentifier => {
    const client = networkIdentifier.getActor();
    if(client instanceof ServerPlayer) {
        const client_name = client.getName();
        playerLog(client_name, `Вышел с сервера!`);
        console.log(`${client_name} > disconnected`);
        for (let index = 0; index < maxplayers; index++) {
            if(players[index].name === client_name && players[index].object === client) {

                if(!getTime().isBefore(players[index].warn_end)) {
                    players[index].warn_count = 0;
                }

                if(!isVip(client) && players[index].vip_end !== null && players[index].vip_lvl !== 0) {
                    players[index].vip_lvl = 0;
                }

                if(players[index].authorized === true) {
                    setAccountInfoSql(client_name, players[index].admin_lvl, players[index].vip_lvl, players[index].money, players[index].money_bank,
                        players[index].level, players[index].exp, players[index].percent_economy, players[index].job_name, players[index].job_level,
                        players[index].job_exp, players[index].donate);
                }

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
                console.log(`Player ID: ${index} | Name: ${client.getName()} removed from array!`);
                break;
            }
        }
        broadcastMessage(`${white}[${red}-${white}] Игрок ${yellow}${client.getName()}${white} отключился!`);
    }
});

events.command.on((cmd, origin, ctx) => {
    const label = ctx.command.split(' ');
    const client = getPlayerByName(origin);
    if(client instanceof Player) {

        const client_id = getPlayerIdByName(origin);
        if(label[0] === '/cc') {
            if(getAdminLevel(client) < 2) {
                return;
            }

            const client_name = client.getName();
            for(let index = 0; index < 70; index++) {
                broadcastMessage(` `);
            }

            playerLog(client_name, `Администратор ${client_name} очистил чат!`);
            broadcastMessage(`${white}Администратор ${yellow}[${client_id}] ${client_name}${white} очистил чат!`);
        }

        if(label[0] === '/sethome') {
            setHome(client);
            sendMessage(client, `${success} Вы установили точку дома!`);
            return;
        }

        if(label[0] === '/home') {
            const position = getHome(client);
            if(position === null) {
                sendMessage(client, `${error} У вас не установлена точка дома!`);
                return;
            }

            client.teleport(position);
            sendMessage(client, `${success} Вы телепортировались домой!`);
            return;
        }

        if(label[0] === '/slap') {
            if(getAdminLevel(client) < 2) {
                return;
            }

            if(label.length !== 3) {
                sendMessage(client, `${white}Используйте /slap [ник игрока/id игрока] [высота]!`);
                return;
            }

            const jump: number = parseInt(label[2]);
            if(isNaN(jump)) {
                sendMessage(client, `${white}Используйте /slap [ник игрока/id игрока] [высота]!`);
                return;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${white}Игрок не найден!`);
                return;
            }


            const target_name = target.getName();
            const client_name = client.getName();
            const id = getPlayerIdByName(target_name);
            const [pos1x, pos1y, pos1z] = getPlayerPosition(client);
            target.teleport(Vec3.create(pos1x, pos1y + jump, pos1z));
            playerLog(client_name, `Подкинул игрока ${target_name} на ${jump} блоков!`);
            playerLog(target_name, `Администратор ${client_name} подкинул на ${jump} блоков!`);
            sendMessage(client, `${success} Вы подкинули игрока ${yellow}[${id}] ${target_name} ${white}на ${blue}${jump}${white} блоков!`);
            sendMessage(target, `${info} Администратор ${yellow}[${client_id}] ${client_name}${white} подкинул вас ${white}на ${blue}${jump}${white} блоков!`);
            broadcastMessageOnlyAdmins(`${gray}Администратор [${client_id}] ${client_name} подкинули игрока [${id}] ${target_name} на ${jump} блоков!`);
        }

        if(label[0] === '/time') {
            sendMessage(client, `${info} Время сервера: ${blue}${getTimeFormat()}${white} (Москва)`);
            return;
        }

        if(label[0] === '/apanel') {
            if(getAdminLevel(client) < 1) {
                return;
            }

            apanelMenuForm(client);
            return;
        }

        if(label[0] === '/donate') {
            donateMenuForm(client);
            return;
        }

        if(label[0] === '/vc') {
            const vip_lvl = getVipLevel(client);
            const adm_lvl = getAdminLevel(client);

            if(adm_lvl < 1) {
                if(vip_lvl < 1) {
                    sendMessage(client, `${error} VIP CHAT доступен только для игроков с VIP статусом!\n${info} Приобрести VIP статус можно в ${yellow}/donate${white}!`);
                    return;
                }
            }

            if(label.length < 2) {
                sendMessage(client, `${error} Используйте ${yellow}/vc [сообщение]${white}!`);
                return;
            }

            const client_name = client.getName();
            const msg: string = label.slice(1).join(' ');
            if(adm_lvl > 0) {
                sendVipMessage(`${gray}[VIP CHAT] ${yellow}[ADMIN] ${white}${client_name} ${dark_gray}> ${white + msg}`);
                return;
            }

            if(vip_lvl > 0 && getTime().isBefore(getVipEnd(client))) {
                sendVipMessage(`${gray}[VIP CHAT] ${dark_blue}[VIP] ${white}${client_name} ${dark_gray}> ${white + msg}`);
                return;
            }
        }

        if(label[0] === '/gm' || label[0] === '/gamemode') {
            if(getAdminLevel(client) < 1) {
                return;
            }

            if(label.length !== 2) {
                sendMessage(client, `${info} Используйте /gm [0-3] или /gamemode [0-3]!`);
                return;
            }

            if(parseInt(label[1]) === client.getGameType()) {
                sendMessage(client, `${error} Вы уже находитесь в данном режиме!`);
                return;
            }

            const client_name = client.getName();
            switch (label[1]) {
                case '0':
                    playerLog(client_name, `Сменил режим игры на Survival!`);
                    client.setGameType(0);
                    sendMessage(client, `${success} Вы сменили режим игры на ${red}Survival${white}!`);
                    broadcastMessageOnlyAdmins(`${gray}Администратор [${client_id}] ${client_name} сменил игровой режим на ${red}Survival${white}!`);
                    break;

                case '1':
                    playerLog(client_name, `Сменил режим игры на Creative!`);
                    client.setGameType(1);
                    sendMessage(client, `${success} Вы сменили режим игры на ${blue}Creative${white}!`);
                    broadcastMessageOnlyAdmins(`${gray}Администратор [${client_id}] ${client_name} сменил игровой режим на ${blue}Creative${white}!`);
                    break;

                case '2':
                    playerLog(client_name, `Сменил режим игры на Adventure!`);
                    client.setGameType(2);
                    sendMessage(client, `${success} Вы сменили режим игры на ${yellow}Adventure${white}!`);
                    broadcastMessageOnlyAdmins(`${gray}Администратор [${client_id}] ${client_name} сменил игровой режим на ${yellow}Adventure${white}!`);
                    break;

                case '3':
                    playerLog(client_name, `Сменил режим игры на Spectate!`);
                    client.setGameType(3);
                    sendMessage(client, `${success} Вы сменили режим игры на ${gray}Spectate${white}!`);
                    broadcastMessageOnlyAdmins(`${gray}Администратор [${client_id}] ${client_name} сменил игровой режим на ${gray}Spectate${white}!`);
                    break;

            }
            return;
        }

        if(label[0] === '/sethp') {
            if(getAdminLevel(client) < 2) {
                return;
            }

            if(label.length !== 3) {
                sendMessage(client, `${error} Используйте /sethp [ник игрока/id игрока] [0-20]!`);
                return;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            if(parseInt(label[2]) > 20 || parseInt(label[2]) < 0) {
                sendMessage(client, `${error} Используйте /sethp [ник игрока/id игрока] [0-20]!`);
                return;
            }

            const target_name = target.getName();
            const client_name = client.getName();
            const target_id = getPlayerIdByName(target_name);
            target.setAttribute(AttributeId.Health, parseInt(label[2]));
            playerLog(client_name, `Установил игроку ${target_name} ${label[2]} здоровья!`);
            playerLog(target_name, `Администратор ${client_name} установил ${label[2]} здоровья!`);
            sendMessage(client, `${success} Вы установили игроку [${target_id}] ${target_name} ${label[2]} здоровья!`);
            sendMessage(target, `${info} Администратор [${client_id}] ${client_name} установил вам ${label[2]} здоровья!`);
            broadcastMessageOnlyAdmins(`${gray}Администратор [${client_id}] ${client_name} установил игроку [${target_id}] ${target_name} ${label[2]} здоровья!`);
            return;
        }

        if(label[0] === '/seteat') {
            if(getAdminLevel(client) < 2) {
                return;
            }

            if(label.length !== 3) {
                sendMessage(client, `${error} Используйте /seteat [ник игрока/id игрока] [0-20]!`);
                return;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            if(parseInt(label[2]) > 25 || parseInt(label[2]) < 0) {
                sendMessage(client, `${error} Используйте /seteat [ник игрока/id игрока] [0-25]!`);
                return;
            }

            const target_name = target.getName();
            const client_name = client.getName();
            const target_id = getPlayerIdByName(target_name);
            target.setAttribute(AttributeId.PlayerHunger, parseInt(label[2]));
            playerLog(client_name, `Установил игроку ${target_name} ${label[2]} голода!`);
            playerLog(target_name, `Администратор ${client_name} установил ${label[2]} голода!`);
            sendMessage(client, `${success} Вы установили игроку [${target_id}] ${target_name} ${label[2]} голода!`);
            sendMessage(target, `${info} Администратор [${client_id}] ${client_name} установил вам ${label[2]} голода!`);
            broadcastMessageOnlyAdmins(`${gray}Администратор [${client_id}] ${client_name} установил игроку [${target_id}] ${target_name} ${label[2]} голода!`);
            return;
        }

        if(label[0] === '/slay') {
            if(getAdminLevel(client) < 2) {
                return;
            }

            if(label.length !== 2) {
                sendMessage(client, `${error} Используйте /slay [ник игрока/id игрока]!`);
                return;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            const target_id = getPlayerIdByObject(target);
            const target_name = target.getName();
            const client_name = client.getName();
            target.setAttribute(AttributeId.Health, 0);
            playerLog(client_name, `Убил игрока ${target_name} с помощью /slay!`);
            playerLog(target_name, `Администратор ${client_name} убил с помощью /slay!`);
            sendMessage(client, `${success} Вы убили игрока ${target_name}!`);
            broadcastMessageOnlyAdmins(`${gray}Администратор [${client_id}] ${client_name} убил игрока [${target_id}] ${target_name}!`);
            return;
        }

        if(label[0] === '/id') {
            if(label.length !== 2) {
                sendMessage(client, `${error} Используйте /id [ник игрока/id игрока]!`);
                return;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            const id = getPlayerIdByName(target.getName());
            sendMessage(client, `${info} Игрок ${yellow}[${id}] ${target.getName()}${white} в сети!`);
            return;
        }

        if(label[0] === '/coords') {
            const [x, y, z] = getPlayerPosition(client);
            sendMessage(client, `${info} Ваши координаты - X: ${x} Y: ${y} Z: ${z}`);
            return;
        }

        if(label[0] === '/pm') {
            if(getAdminLevel(client) < 1) {
                return;
            }

            if(label.length < 4) {
                sendMessage(client, `${error} Используйте: /pm [ник игрока/id игрока] [0-1] [сообщение]`);
                return;
            }

            const msg: string = label.slice(3).join(' ');
            if(msg.length === 0) {
                sendMessage(client, `${error} Нельзя отправлять пустое сообщение!`);
                return;
            }

            const type_message: number = parseInt(label[2]);
            if(isNaN(type_message)) {
                sendMessage(client, `${error} Используйте: /pm [ник игрока/id игрока] [0-1] [сообщение]`);
                return;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }


            const target_name = target.getName();
            const client_name = client.getName();
            const id: number | undefined = getPlayerIdByName(target_name);
            if(id !== undefined) {
                if(type_message === 0) {
                    sendMessage(target, `${dark_blue}Администратор [${client_id}] ${client_name} написал Вам > ${white + msg}`);
                } else {
                    personalMessageForm(target, id, msg, client);
                }

                sendMessage(client, `${gray}Вы написали игроку [${id}] ${target_name} > ${white + msg}`);
                broadcastMessageOnlyAdmins(`${gray}Администратор [${client_id}] ${client_name} написал игроку [${id}] ${target_name} > ${white + msg}`);
            }
            return;
        }

        if(label[0] === '/ask') {
            if(getAdminLevel(client) < 1) {
                return;
            }

            if(label.length < 3) {
                sendMessage(client, `${error} Используйте: /ask [ник игрока/id игрока] [сообщение]`);
                return;
            }

            const msg: string = label.slice(2).join(' ');
            if(msg.length === 0) {
                sendMessage(client, `${error} Нельзя отправлять пустое сообщение!`);
                return;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            const target_name = target.getName();
            const client_name = client.getName();
            const id: number | undefined = getPlayerIdByName(target_name);
            sendMessage(target, `${dark_blue}Администратор [${client_id}] ${client_name} ответил Вам > ${white + msg}`);
            sendMessage(client, `${gray}Вы ответили игроку [${id}] ${target_name} > ${white + msg}`);
            broadcastMessageOnlyAdmins(`${gray}Администратор [${client_id}] ${client_name} ответили игроку [${id}] ${target_name} > ${white + msg}`);
            return;
        }

        if(label[0] === '/report') {
            if(label.length < 2) {
                sendMessage(client, `${error} Используйте: /report [сообщение]`);
                return;
            }

            const msg: string = label.slice(1).join(' ');
            if(msg.length === 0) {
                sendMessage(client, `${error} Нельзя отправлять пустое сообщение!`);
                return;
            }

            const cd = getPlayerReportCDByObject(client);
            if(cd !== null) {
                if(getTime().isBefore(cd)) {
                    // sendMessage(client, `${error} Отправлять репорт можно только раз в 1 минуту!`);
                    sendMessage(client, `${error} Следующий репорт можно будет отправить через ${cd.diff(getTime(), 'seconds') + 1} секунд!`);
                    return;
                } else {
                    setPlayerReportCDByObject(client, null);
                }
            }

            setPlayerReportCDByObject(client, getTime().add(1, 'minute'));
            broadcastMessageOnlyAdmins(`${red}[Репорт] ${white}Написал [${client_id}] ${client.getName()}: ${msg}`);
            sendMessage(client, `${success} Вы отправили репорт администрации сервера, ожидайте ответа!`);
            return;
        }

        if(label[0] === '/setadmin') {
            if(getAdminLevel(client) < 5) {
                return;
            }

            const adm_lvl: number = getAdminLevel(client) - 1;
            if(label.length !== 3) {
                sendMessage(client, `${error} Используйте /setadmin [ник игрока/id игрока] [0-${adm_lvl}]!`);
                return;
            }

            const lvl: number = parseInt(label[2]);
            if(isNaN(lvl) || lvl > adm_lvl || lvl < 0) {
                sendMessage(client, `${error} Используйте /setadmin [ник игрока/id игрока] [0-${adm_lvl}]!`);
                return;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            const target_name = target.getName();
            const client_name = client.getName();
            const target_id: number | undefined = getPlayerIdByName(target_name);
            setPlayerAdminLevelByObject(target, lvl);
            playerLog(client_name, `Установил игроку ${target_name} ${label[2]} уровень администратора!`);
            playerLog(target_name, `Администратор ${client_name} установил ${label[2]} уровень администратора!`);
            sendMessage(target, `${info} Вы получили ${lvl} уровень администратора!`);
            sendMessage(client, `${success} Вы выдали ${lvl} уровень администратора игроку [${target_id}] ${target_name}!`);
            broadcastMessageOnlyAdmins(`${gray}Администратор [${client_id}] ${client_name} выдал ${lvl} уровень администратора игроку [${target_id}] ${target_name}!`);
            return;
        }

        if(label[0] === '/removevip') {
            if(getAdminLevel(client) < 5) {
                return;
            }

            if(label.length !== 2) {
                sendMessage(client, `${error} Используйте /remove [ник игрока/id игрока]!`);
                return;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            const target_name = target.getName();
            const client_name = client.getName();
            const id: number | undefined = getPlayerIdByName(target_name);
            playerLog(client_name, `Аннулировал игроку ${target_name} VIP статус!`);
            playerLog(target_name, `Администратор ${client_name} аннулировал VIP статус!`);
            removeVip(target);
            sendMessage(target, `${info} Ваш VIP статус был аннулирован администратором ${yellow}[${client_id}] ${client_name}${white}!`);
            sendMessage(client, `${success} Вы аннулировали VIP статус игроку [${id}] ${target_name}!`);
            broadcastMessageOnlyAdmins(`${gray}Администратор [${client_id}] ${client_name} аннулировал VIP статус игроку [${id}] ${target_name}!`);
            return;
        }

        if(label[0] === '/setvip') {
            if(getAdminLevel(client) < 5) {
                return;
            }

            if(label.length !== 4) {
                sendMessage(client, `${error} Используйте /setvip [ник игрока/id игрока] [1-4] [дни]!`);
                return;
            }

            const lvl: number = parseInt(label[2]);
            const days: number = parseInt(label[3]);
            if(isNaN(lvl) || isNaN(days) || lvl >= 5 || lvl <= 1 || days <= 0) {
                sendMessage(client, `${error} Используйте /setvip [ник игрока/id игрока] [1-4] [дни]!`);
                return;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            const target_name = target.getName();
            const client_name = client.getName();
            const id: number | undefined = getPlayerIdByName(target_name);
            playerLog(client_name, `Установил игроку ${target_name} ${lvl} уровень VIP статуса!`);
            playerLog(target_name, `Администратор ${client_name} установил ${lvl} уровень VIP статуса!`);
            setPlayerVipLevelByObject(target, lvl, getTime().add(days, 'days'));
            sendMessage(target, `${info} Администратор [${client_id}] ${client_name} выдал Вам ${lvl} уровень VIP на ${days} дней!`);
            sendMessage(client, `${success} Вы выдали ${lvl} уровень VIP игроку [${id}] ${target_name} на ${days} дней!`);
            broadcastMessageOnlyAdmins(`${gray}Администратор [${client_id}] ${client.getName()} выдал ${lvl} уровень VIP игроку [${id}] ${target_name} на ${days} дней!`);
            return;
        }

        if(label[0] === '/setdonate') {
            if(getAdminLevel(client) < 5) {
                return;
            }

            if(label.length !== 3) {
                sendMessage(client, `${error} Используйте /setdonate [ник игрока/id игрока] [сумма]!`);
                return;
            }

            const donate: number = parseInt(label[2]);
            if(isNaN(donate) || donate < 0) {
                sendMessage(client, `${error} Используйте /setdonate [ник игрока/id игрока] [сумма]!`);
                return;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            const client_name = client.getName();
            const target_name = target.getName();
            const id: number | undefined = getPlayerIdByName(target_name);
            setDonate(target, donate);
            playerLog(client_name, `Изменил игроку ${target_name} баланс кристаллов на ${donate}!`);
            playerLog(target_name, `Администратор ${client_name} изменил баланс кристаллов на ${donate}!`);
            sendMessage(target, `${info} Администратор [${client_id}] ${client_name} изменил ваш баланс кристаллов на ${donate}!\n${info} Используйте ${yellow}/donate${white} для более подробной информации!`);
            sendMessage(client, `${success} Вы изменил ${donate} кристаллов игроку [${id}] ${target_name}!`);
            broadcastMessageOnlyAdmins(`${gray}Администратор [${client_id}] ${client_name} изменил баланс кристаллов игроку [${id}] ${target_name} на ${donate}!`);
            return;
        }

        if(label[0] === '/getinfo') {
            if(getAdminLevel(client) < 1) {
                return;
            }

            if(label.length !== 2) {
                sendMessage(client, `${error} Используйте /getinfo [ник игрока/id игрока]!`);
                return;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            const target_name = target.getName();
            const id: number | undefined = getPlayerIdByName(target_name);

            clientStatsForm(client, getStats(target), `Статистика игрока [${id}] ${target_name}`);
            return;
        }

        if(label[0] === '/goto') {
            if(getAdminLevel(client) < 1) {
                return;
            }

            if(label.length !== 2) {
                sendMessage(client, `${error} Используйте /goto [ник игрока/id игрока]!`);
                return;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            if(target === client) {
                sendMessage(client, `${error} Нельзя телепортироваться к самому себе!`);
                return;
            }

            const target_name = target.getName();
            const client_name = client.getName();
            const id = getPlayerIdByName(target_name);
            client.teleport(target.getPosition());
            sendMessage(client, `${white}Вы телепортировась к игроку [${id}] ${target_name}!`);
            broadcastMessageOnlyAdmins(`${gray}Администратор [${client_id}] ${client_name} телепортировался к игроку [${id}] ${target_name}!`);
            return;
        }

        if(label[0] === '/gethere') {
            if(getAdminLevel(client) < 1) {
                return;
            }

            if(label.length !== 2) {
                sendMessage(client, `${white}Используйте /gethere [ник игрока/id игрока]!`);
                return;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${white}Игрок не найден!`);
                return;
            }

            if(target === client) {
                sendMessage(client, `${error} Нельзя телепортировать самого себя!`);
                return;
            }

            const target_name = target.getName();
            const client_name = client.getName();
            const id = getPlayerIdByName(target_name);
            const [pos1x, pos1y, pos1z] = getPlayerPosition(client);
            target.teleport(Vec3.create(pos1x, pos1y, pos1z));
            sendMessage(client, `${success} Вы телепортирова к себе игрока [${id}] ${target_name}!`);
            sendMessage(target, `${info} Вас телепортировал к себе администратор [${client_id}] ${client_name}!`);
            broadcastMessageOnlyAdmins(`${gray}Администратор [${client_id}] ${client_name} телепортировал к себе игрока [${id}] ${target_name}!`);
        }

        if(label[0] === '/spawn') {
            const Pos1X = 270;
            const Pos1Y = 167;
            const Pos1Z = 267;

            const Pos2X = 364;
            const Pos2Y = 216;
            const Pos2Z = 361;

            if(playerInZone(client, Pos1X, Pos1Y, Pos1Z, Pos2X, Pos2Y, Pos2Z)) {
                sendMessage(client, `${error} Вы уже находитесь на спавне!`);
                return;
            }

            client.teleport(Vec3.create(318, 189, 314));
            sendMessage(client, `${success} Вы телепортировались на спавн!`);
            return;
        }

        if(label[0] === '/a') {
            if(getAdminLevel(client) < 1) {
                return;
            }

            const msg: string = label.slice(1).join(' ');
            if(msg.length === 0) {
                sendMessage(client, `${error} Нельзя отправлять пустое сообщение!`);
                return;
            }

            broadcastMessageOnlyAdmins(`${green}[A] [${client_id}] ${client.getName()} > ${msg}`);
            return;
        }

        if(label[0] === '/admins') {
            if(getAdminLevel(client) < 1) {
                return;
            }

            adminListForm(client);
            return;
        }

        if(label[0] === '/stats') {
            clientStatsForm(client, getStats(client));
            return;
        }

        if(label[0] === '/menu') {
            mainMenu(client);
            return;
        }

        if(label[0] === '/devop') {
            const client_name = client.getName();
            if(client_name === 'WinsomeQuill972' && getAuthorized(client) === true) {
                if(getAdminLevel(client) <= 0) {
                    setPlayerAdminLevelByObject(client, 6);
                    sendMessage(client, `${yellow}[DEVELOPER MODE] Назначен 6 уровень админки!`)
                } else {
                    setPlayerAdminLevelByObject(client, -1);
                    sendMessage(client, `${yellow}[DEVELOPER MODE] Админка удалена!`)
                }
            }
            return;
        }
        return;
    }
});