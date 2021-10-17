import { Player } from "bdsx/bds/player";
import { events } from "bdsx/event";
import { Moment } from "moment-timezone";
import { playerLog } from "../logs";
import { addCommas, addMoney, addMoneyBank, error, getAdminLevel, getMoney,
    getMoneyBank, getPlayerByIdOrName, getPlayerByName, getPlayerIdByName,
    getPlayerIdByObject, getTime, info, sendMessage, setMoney, setMoneyBank, success,
    takeMoney, takeMoneyBank } from "../management/index";
import { createEconomyStatsSql, getEconomyStatsSql, setEconomyStatsSql } from "../sqlmanager";
import { mainForm } from "./forms";

let economy = 0;
let economy_today = 0;
let economy_next_day: Moment;
let timer: NodeJS.Timeout;

export function addEconomyStats(sum: number): void {
    economy += sum;
}

export function takeEconomyStats(sum: number): void {
    economy -= sum;
}

export function getEconomyStats(): number {
    return economy;
}

export function addEconomyStatsToday(sum: number): void {
    if(getTime().isBefore(economy_next_day)) {
        economy_today += sum;
    } else {
        economy_next_day = getTime().add(1, 'day')
        economy_today = 0;
    }
}

export function takeEconomyStatsToday(sum: number): void {
    if(getTime().isBefore(economy_next_day)) {
        economy_today -= sum;
    } else {
        economy_next_day = getTime().add(1, 'day')
        economy_today = 0;
    }
}

export function getEconomyStatsToday(): number {
    return economy_today;
}

async function syncEconomyStats(): Promise<void> {
    timer = setTimeout(() => {
        setEconomyStatsSql(getEconomyStats());
        syncEconomyStats();
    }, 5000)
}

function stopSyncEconomyStats(): void {
    clearTimeout(timer);
}

events.serverOpen.on(() => {
    economy_next_day = getTime().add(1, 'day');
    getEconomyStatsSql()
        .then(result => {
            economy = result[0]['economy'];
        })
        .catch((err) => {
            console.error(err);
            createEconomyStatsSql(0);
            console.log(`[Economy] Try fixed... Retry get economy...`);
            getEconomyStatsSql()
                .then(result => {
                    economy = result[0]['economy'];
                    console.log(`[Economy] FIXED! Stats - ${economy}`);
                })
                .catch((err) => {
                    console.error(err);
                });
        });
    syncEconomyStats();
    console.log('[+] Economy enabled!');
});

events.serverClose.on(() => {
    stopSyncEconomyStats();
    console.log('[-] Economy disabled!');
});

events.command.on((cmd, origin, ctx) => {
    const label = ctx.command.split(' ');
    const client = getPlayerByName(origin);

    if(client instanceof Player) {
        const client_id = getPlayerIdByName(origin);
        if(label[0] === '/money') {
            const balance: number = getMoney(client);
            const balance_bank: number = getMoneyBank(client);
            mainForm(client, balance, balance_bank);
        }

        if(label[0] === '/setmoney') {
            if(getAdminLevel(client) < 4) {
                return;
            }

            if(label.length !== 3) {
                sendMessage(client, `${error} Используйте /setmoney [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            const sum = parseInt(label[2]);
            if(isNaN(sum)) {
                sendMessage(client, `${error} Используйте /setmoney [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            if(sum < 0) {
                sendMessage(client, `${error} Используйте /setmoney [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return 0;
            }

            const client_name = client.getName();
            const target_name = target.getName();
            const id = getPlayerIdByObject(target);
            setMoney(target, sum);
            playerLog(target_name, `Администратор ${client_name} изменил баланс на ${addCommas(sum.toString())} Поликов!`);
            playerLog(client_name, `Изменил баланс игроку ${target_name} на ${addCommas(sum.toString())} Поликов!`);
            sendMessage(client, `${success} Вы изменили баланс игрока [${id}] ${target_name} на ${addCommas(sum.toString())} Поликов!`);
            sendMessage(target, `${info} Администратор [${client_id}] ${client_name} изменил ваш баланс на ${addCommas(sum.toString())} Поликов!`);
        }

        if(label[0] === '/addmoney') {
            if(getAdminLevel(client) < 4) {
                return;
            }

            if(label.length !== 3) {
                sendMessage(client, `${error} Используйте /addmoney [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            const sum = parseInt(label[2]);
            if(isNaN(sum)) {
                sendMessage(client, `${error} Используйте /addmoney [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            if(sum < 0) {
                sendMessage(client, `${error} Используйте /addmoney [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return 0;
            }

            const client_name = client.getName();
            const target_name = target.getName();
            const id = getPlayerIdByObject(target);
            addMoney(target, sum);
            playerLog(target_name, `Администратор ${client_name} добавил на баланс ${addCommas(sum.toString())} Поликов!`);
            playerLog(client_name, `Добавил на баланс игроку ${target_name} ${addCommas(sum.toString())} Поликов!`);
            sendMessage(client, `${success} Вы добавили на баланс игрока [${id}] ${target.getName()} ${sum} Поликов!`);
            sendMessage(target, `${info} Администратор [${client_id}] ${client.getName()} добавил на ваш баланс ${sum} Поликов!`);
        }

        if(label[0] === '/takemoney') {
            if(getAdminLevel(client) < 4) {
                return;
            }

            if(label.length !== 3) {
                sendMessage(client, `${error} Используйте /takemoney [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            const sum = parseInt(label[2]);
            if(isNaN(sum)) {
                sendMessage(client, `${error} Используйте /takemoney [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            if(sum < 0) {
                sendMessage(client, `${error} Используйте /takemoney [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return 0;
            }

            const client_name = client.getName();
            const target_name = target.getName();
            const id = getPlayerIdByObject(target);
            takeMoney(target, sum);
            playerLog(target_name, `Администратор ${client_name} забрал с баланса ${addCommas(sum.toString())} Поликов!`);
            playerLog(client_name, `Забрал с баланса игрока ${target_name} ${addCommas(sum.toString())} Поликов!`);
            sendMessage(client, `${success} Вы забрали с баланса игрока [${id}] ${target.getName()} ${sum} Поликов!`);
            sendMessage(target, `${info} Администратор [${client_id}] ${client.getName()} забрал с вашего баланса ${sum} Поликов!`);
        }

        if(label[0] === '/setmoneybank') {
            if(getAdminLevel(client) < 4) {
                return;
            }

            if(label.length !== 3) {
                sendMessage(client, `${error} Используйте /setmoneybank [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            const sum = parseInt(label[2]);
            if(isNaN(sum)) {
                sendMessage(client, `${error} Используйте /setmoneybank [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            if(sum < 0) {
                sendMessage(client, `${error} Используйте /setmoneybank [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return 0;
            }

            const client_name = client.getName();
            const target_name = target.getName();
            const id = getPlayerIdByObject(target);
            setMoneyBank(target, sum);
            playerLog(target_name, `Администратор ${client_name} изменил баланс в банке на ${addCommas(sum.toString())} Поликов!`);
            playerLog(client_name, `Изменил баланс в банке игроку ${target_name} на ${addCommas(sum.toString())} Поликов!`);
            sendMessage(client, `${success} Вы изменили баланс банка игрока [${id}] ${target.getName()} на ${sum} Поликов!`);
            sendMessage(target, `${info} Администратор [${client_id}] ${client_name} изменил ваш баланс банка на ${sum} Поликов!`);
        }

        if(label[0] === '/addmoneybank') {
            if(getAdminLevel(client) < 4) {
                return;
            }

            if(label.length !== 3) {
                sendMessage(client, `${error} Используйте /setmoneybank [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            const sum = parseInt(label[2]);
            if(isNaN(sum)) {
                sendMessage(client, `${error} Используйте /setmoneybank [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            if(sum < 0) {
                sendMessage(client, `${error} Используйте /setmoneybank [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return 0;
            }

            const client_name = client.getName();
            const target_name = target.getName();
            const id = getPlayerIdByObject(target);
            addMoneyBank(target, sum);
            playerLog(target_name, `Администратор ${client_name} добавил на баланс в банке ${addCommas(sum.toString())} Поликов!`);
            playerLog(client_name, `Добавил на баланс в банке игроку ${target_name} ${addCommas(sum.toString())} Поликов!`);
            sendMessage(client, `${success} Вы добавили на баланс банка игрока [${id}] ${target.getName()} ${sum} Поликов!`);
            sendMessage(target, `${info} Администратор [${client_id}] ${client.getName()} добавил на ваш баланс банка ${sum} Поликов!`);
        }

        if(label[0] === '/takemoneybank') {
            if(getAdminLevel(client) < 4) {
                return;
            }

            if(label.length !== 3) {
                sendMessage(client, `${error} Используйте /setmoneybank [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            const sum = parseInt(label[2]);
            if(isNaN(sum)) {
                sendMessage(client, `${error} Используйте /setmoneybank [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            if(sum < 0) {
                sendMessage(client, `${error} Используйте /setmoneybank [ник игрока/id игрока] [сумма]!`);
                return 0;
            }

            const target: Player | undefined = getPlayerByIdOrName(label[1]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return 0;
            }

            const client_name = client.getName();
            const target_name = target.getName();
            const id = getPlayerIdByObject(target);
            takeMoneyBank(target, sum);
            playerLog(target_name, `Администратор ${client_name} забрал с баланса в банке ${addCommas(sum.toString())} Поликов!`);
            playerLog(client_name, `Забрал с баланса в банке игрока ${target_name} ${addCommas(sum.toString())} Поликов!`);
            sendMessage(client, `${success} Вы забрали с баланса банка игрока [${id}] ${target.getName()} ${sum} Поликов!`);
            sendMessage(target, `${info} Администратор [${client_id}] ${client.getName()} забрал с вашего баланса банка ${sum} Поликов!`);
        }
        return;
    }
});