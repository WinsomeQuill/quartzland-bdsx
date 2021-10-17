import { Player } from "bdsx/bds/player";
import { events } from "bdsx/event";
import { playerLog } from "../logs";
import { error, getClanByPlayer, getLevel, getMoneyBank, getPlayerByName, getPlayerIdByName, green, info,
    pluginRun, sendMessage, success, takeMoneyBank, white, yellow } from "../management";
import { createClanSql } from "../sqlmanager";
import { clansMainForm } from "./forms";
import { cacheClans, sendMessageClan } from "./manager";

events.serverOpen.on(() => {
    cacheClans();
    pluginRun();
    console.log('[+] Clans enabled!');
});

events.serverClose.on(()=>{
    console.log('[-] Clans disabled!');
});

events.command.on((cmd, origin, ctx) => {
    const label = ctx.command.split(' ');
    const client = getPlayerByName(origin);

    if(client instanceof Player) {
        const client_id = getPlayerIdByName(origin);
        if(label[0] === '/clan') {
            if(label[1] === undefined) {
                const clan_name = getClanByPlayer(client.getName());

                if(clan_name === null) {
                    sendMessage(client, `${error} Вы не состоите в клане!`);
                    return;
                }

                clansMainForm(client, clan_name);
                return;
            }

            if(label[1] === 'create') {
                if(label.length != 3) {
                    sendMessage(client, `${error} Используйте /clan create [название]!`);
                    return;
                }

                if(label[2].length > 40) {
                    sendMessage(client, `${error} Слишком длинное название клана! Максимум 40 символов!`);
                    return;
                }

                const level = getLevel(client);
                if(level < 5) {
                    sendMessage(client, `${error} Для создания клана нужен ${yellow}5${white} уровень!\n${info} У вас на данный момент ${yellow}${level}${white} уровень!`);
                    return;
                }

                const money = getMoneyBank(client);
                if(money < 10000) {
                    sendMessage(client, `${error} Для создания клана нужно ${green}10.000${white} Поликов в банке!`);
                    return;
                }

                const client_name = client.getName();
                playerLog(client_name, `Потратил 10.000 Поликов на создание клана "${label[2]}"!`);
                takeMoneyBank(client, 10000);
                createClanSql(client_name, label[2], 'Описание клана еще не добавлено!');
                sendMessage(client, `${success} Вы создали клан ${yellow}${label[2]}${white}!`);
                sendMessage(client, `${info} Используйте ${yellow}/clan${white} для управления клана!`);
                return;
            }
        }

        if(label[0] === '/c') {
            if(label.length < 2) {
                sendMessage(client, `${error} Используйте /c [сообщение]!`);
                return;
            }

            const clan_name = getClanByPlayer(client);
            if(clan_name === null) {
                sendMessage(client, `${error} Вы не состоите в клане!`);
                return;
            }

            const msg: string = label.slice(1).join(' ');
            sendMessageClan(clan_name, `[${client_id}] ${client.getName()} > ${msg}`, false);
        }
        return;
    }
});