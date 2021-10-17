import { CustomForm, FormButton, FormInput, FormLabel, SimpleForm } from "bdsx/bds/form";
import { Player } from "bdsx/bds/player";
import { addCommas, addMoney, addMoneyBank, error, getMoney, getMoneyBank, getPercentBank,
    getPlayerByIdOrName, getPlayerIdByObject, green, info, Percent_Minus,
    sendMessage, success, takeMoney, takeMoneyBank, white, yellow } from "../management";
import { playerLog } from "../logs/index"

export function mainForm(client: Player, balance: number, balance_bank: number): void {
    const form = new SimpleForm();
    form.setTitle('Управление Поликами');
    form.setContent(`Баланс: ${green}${addCommas(balance.toString())}${white} Поликов
Баланс в банке: ${green}${addCommas(balance_bank.toString())}${white} Поликов`);
    form.addButton(new FormButton(`Перевести игроку`));
    form.addButton(new FormButton(`Положить Полики в банк`));
    form.addButton(new FormButton(`Снять Полики с банка`));
    form.addButton(new FormButton(`Выход`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            // pass
        } else {
            switch (data.response) {
                case 0:
                    transferForm(client, balance, balance_bank);
                    break;
                case 1:
                    putInBankForm(client, balance, balance_bank);
                    break;
                case 2:
                    takeFromBankForm(client, balance, balance_bank);
                    break;
                case 3:
                    break;
            }
        }
    });
}

export function transferForm(client: Player, balance: number, balance_bank: number): void {
    const form = new CustomForm();
    form.setTitle('Перевести Полики');
    form.addComponent(new FormLabel(`Баланс: ${green}${addCommas(balance.toString())}${white} Поликов`));
    form.addComponent(new FormLabel(`Баланс в банке: ${green}${addCommas(balance_bank.toString())}${white} Поликов`));
    form.addComponent(new FormInput('Введите ник или ID игрока', 'Например: 0 или Steve'));
    form.addComponent(new FormInput('Введите сумму которую хотите перевести', '100'));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            //pass
        } else {
            const target: Player | undefined = getPlayerByIdOrName(data.response[2]);
            if(target === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return 0;
            }

            if(target === client) {
                sendMessage(client, `${error} Нельзя переводить самому себе!`);
                return 0;
            }

            const sum = parseInt(data.response[3]);
            if(isNaN(sum) || sum < 0) {
                sendMessage(client, `${error} Вы ввели некорректную сумму!`);
                return 0;
            }

            if(sum > 5000000 || sum < 100) {
                sendMessage(client, `${error} Переводить можно от 100 до 5.000.000 Поликов за раз!`);
                return 0;
            }

            if(sum > balance_bank) {
                const need = sum - balance_bank;
                sendMessage(client, `${error} У вас недостаточно Поликов в банке (Нужно еще: ${addCommas(need.toString())} Поликов)!`);
                return 0;
            }

            const client_name = client.getName();
            const target_name = target.getName();
            const id = getPlayerIdByObject(target);
            const client_id = getPlayerIdByObject(client);
            const percent: number = getPercentBank(client);
            const new_sum: number = Percent_Minus(sum, percent);
            const target_money: number = getMoney(target);
            const target_bank: number = getMoneyBank(target);
            takeMoneyBank(client, sum);
            addMoneyBank(target, new_sum);
            playerLog(client_name, `Перевел на банк игроку ${target_name} ${addCommas(new_sum.toString())} Поликов! (Поликов: ${addCommas(balance.toString())}) (Банк: ${addCommas((balance_bank - sum).toString())}) (Комиссия: ${percent} процентов)`);
            playerLog(target_name, `Получил на банк от игрока ${client_name} ${addCommas(new_sum.toString())} Поликов! (Поликов: ${addCommas(target_money.toString())}) (Банк: ${addCommas((target_bank + new_sum).toString())})`);
            sendMessage(client, `${success} Вы перевели игроку ${yellow}[${id}] ${target_name} ${green}${addCommas(new_sum.toString())} ${white}Поликов!\n${info} Комиссия составила: ${yellow}${percent}${white} процентов!`);
            sendMessage(target, `${info} Игрок ${yellow}[${client_id}] ${client_name} ${white}перевел вам на банк ${green}${addCommas(new_sum.toString())}${white} Поликов!`);
        }
    });
}

export function putInBankForm(client: Player, balance: number, balance_bank: number): void {
    const form = new CustomForm();
    form.setTitle('Положить в банк');
    form.addComponent(new FormLabel(`Баланс: ${green}${addCommas(balance.toString())}${white} Поликов`));
    form.addComponent(new FormLabel(`Баланс в банке: ${green}${addCommas(balance_bank.toString())}${white} Поликов`));
    form.addComponent(new FormInput('Введите сумму которую хотите положить в банк', '100'));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            //pass
        } else {
            const sum = parseInt(data.response[2]);
            if(isNaN(sum) || sum < 0) {
                sendMessage(client, `${error} Вы ввели некорректную сумму!`);
                return 0;
            }

            if(sum > 10000000 || sum < 100) {
                sendMessage(client, `${error} Положить в банк можно от 100 до 10.000.000 Поликов за раз!`);
                return 0;
            }

            if(sum > balance) {
                const need = sum - balance;
                sendMessage(client, `${error} У вас недостаточно Поликов (Нужно еще: ${addCommas(need.toString())} Поликов)!`);
                return 0;
            }

            addMoneyBank(client, sum);
            takeMoney(client, sum);
            playerLog(client.getName(), `Положил в банк ${addCommas(sum.toString())} Поликов! (Поликов: ${addCommas((balance - sum).toString())}) (Банк: ${addCommas((balance_bank + sum).toString())})`);
            sendMessage(client, `${success} Вы положили в банк ${addCommas(sum.toString())} Поликов!`);
        }
    });
}

export function takeFromBankForm(client: Player, balance: number, balance_bank: number): void {
    const form = new CustomForm();
    form.setTitle('Снять с банка');
    form.addComponent(new FormLabel(`Баланс: ${green}${addCommas(balance.toString())}${white} Поликов`));
    form.addComponent(new FormLabel(`Баланс в банке: ${green}${addCommas(balance_bank.toString())}${white} Поликов`));
    form.addComponent(new FormInput('Введите сумму которую хотите снять с банка', '100'));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            //pass
        } else {
            const sum = parseInt(data.response[2]);
            if(isNaN(sum) || sum < 0) {
                sendMessage(client, `${error} Вы ввели некорректную сумму!`);
                return 0;
            }

            if(sum > 10000000 || sum < 100) {
                sendMessage(client, `${error} Снимать с банка можно от 100 до 5.000.000 Поликов за раз!`);
                return 0;
            }

            if(sum > balance_bank) {
                const need = sum - balance;
                sendMessage(client, `${error} У вас недостаточно Поликов в банке (Нужно еще: ${addCommas(need.toString())} Поликов)!`);
                return 0;
            }

            const percent: number = getPercentBank(client);
            const new_sum: number = Percent_Minus(sum, percent);
            takeMoneyBank(client, sum);
            addMoney(client, new_sum);
            playerLog(client.getName(), `Снял с банка ${addCommas(new_sum.toString())} Поликов! (Поликов: ${addCommas((balance + new_sum).toString())}) (Банк: ${addCommas((balance_bank - sum).toString())}) (Комиссия: ${percent} процентов)`);
            sendMessage(client, `${success} Вы сняли с банка ${green}${new_sum}${white} Поликов!\n${info} Комиссия составила: ${yellow}${percent}${white} процентов!`);
        }
    });
}