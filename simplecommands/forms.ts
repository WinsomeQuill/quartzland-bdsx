import { CustomForm, FormButton, FormInput, FormLabel, ModalForm, SimpleForm } from "bdsx/bds/form";
import { Player } from "bdsx/bds/player";
import { getEconomyStats, getEconomyStatsToday } from "../economy";
import { addCommas, blue, bold, broadcastMessage, buyDonateExp, error, getAdminLevel, getAdmins, getDonate,
     getInfoBarStatus,
     getPlayerIdByName, getStats, getTime, getTimeFormat, getVipEnd, getVipLevel, gold, gray, green, info, pink, red, reset, sendMessage,
      setDonate, setInfoBarStatus, setMoney, setPlayerVipLevelByObject, success, white, yellow, getRpgMod, setRpgRandomMod } from "../management";
import { setVipEndSql } from "../sqlmanager";
import * as moment from 'moment-timezone';
import { playerLog } from "../logs";
import { rpgMainMenu } from "../rpg/forms";

export function adminListForm(client: Player): void {
    const adms: Player[] = getAdmins();
    const data: string[] = [];

    for (let index = 0; index < adms.length; index++) {
        const name = adms[index].getName();
        data.push(`[${getPlayerIdByName(name)}] ${name} - ${getAdminLevel(client)} уровень`);
    }

    let list;
    if(data.length === 0) {
        list = `${info} На сервере нету администраторов онлайн!`;
    } else {
        list = data.slice(0).join('\n');
    }

    const form = new CustomForm();
    form.setTitle('Администраторы онлайн');
    form.addComponent(new FormLabel(`${list}`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            // pass
        } else {
            apanelMenuForm(client);
        }
    });
}

export function clientStatsForm(client: Player, stats: string, title = 'Ваша статистика'): void {
    const form = new CustomForm();
    form.setTitle(title);
    form.addComponent(new FormLabel(`${stats}`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            // pass
        }
    });
}

export function donateMenuForm(client: Player): void {
    const donate = getDonate(client);
    const vip = getVipEnd(client);

    const form = new SimpleForm();
    form.setTitle(`${gold}Магазин`);

    if(vip !== null && getTime().isBefore(vip)) {
        form.setContent(`${bold}${white}У вас ${yellow}${donate}${white} кристаллов!\n${gold}Ваш VIP статус истекает через ${vip.diff(getTime(), 'days') + 1} дней!`);
    } else {
        form.setContent(`${bold}${white}У вас ${yellow}${donate}${white} кристаллов!`);
    }

    form.addButton(new FormButton(`VIP статус`));
    form.addButton(new FormButton(`Купить Полики`));
    // form.addButton(new FormButton(`Купить опыт`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            // pass
        } else {
            switch (data.response) {
                case 0:
                    VIPMenuForm(client, donate);
                    break;

                case 1:
                    moneyMenuForm(client, donate);
                    break;

                case 2:
                    expMenuForm(client, donate);
                    break;
            }
        }
    });
}

export function VIPMenuForm(client: Player, donate: number): void {
    const vip = getVipEnd(client);

    const form = new SimpleForm();
    form.setTitle(`${gold}Покупка VIP статуса`);

    if(vip !== null && getTime().isBefore(vip)) {
        form.setContent(`${bold}${white}У вас ${yellow}${donate}${white} кристаллов!\n${gold}Ваш VIP статус истекает через ${vip.diff(getTime(), 'days') + 1} дней!`);
    } else {
        form.setContent(`${bold}${white}У вас ${yellow}${donate}${white} кристаллов!`);
    }

    form.addButton(new FormButton(`${bold}${yellow}Bronze VIP\n${blue}90${white} кристаллов`));
    form.addButton(new FormButton(`${bold}${gold}Gold VIP\n${blue}140${white} кристаллов`));
    form.addButton(new FormButton(`${bold}${blue}Diamond VIP\n${blue}190${white} кристаллов`));
    form.addButton(new FormButton(`${bold}${pink}Premium VIP\n${blue}240${white} кристаллов`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            // pass
        } else {
            switch (data.response) {
                case 0:
                    if(vip) {
                        buyVIPConfirmForm(client, 'Bronze VIP', 90, 1, vip);
                    } else {
                        buyVIPConfirmForm(client, 'Bronze VIP', 90, 1);
                    }
                    break;

                case 1:
                    if(vip) {
                        buyVIPConfirmForm(client, 'Gold VIP', 140, 2, vip);
                    } else {
                        buyVIPConfirmForm(client, 'Gold VIP', 140, 2);
                    }
                    break;

                case 2:
                    if(vip) {
                        buyVIPConfirmForm(client, 'Diamond VIP', 190, 3, vip);
                    } else {
                        buyVIPConfirmForm(client, 'Diamond VIP', 190, 3);
                    }
                    break;

                case 3:
                    if(vip) {
                        buyVIPConfirmForm(client, 'Premium VIP', 240, 4, vip);
                    } else {
                        buyVIPConfirmForm(client, 'Premium VIP', 240, 4);
                    }
                    break;
            }
        }
    });
}

export function buyVIPConfirmForm(client: Player, vip_name: string, vip_price: number, vip_level: number, vip_time: null | moment.Moment = null): void {
    const donate = getDonate(client);
    const vip_lvl = getVipLevel(client);
    const form = new ModalForm();
    form.setTitle(`${gold}Покупка ${vip_name}`);
    form.setContent(`${white}Вы действительно хотите купить / продлить ${yellow}${vip_name}${white} статус на месяц?`);
    form.setButtonConfirm(`${green}Да, купить!`);
    form.setButtonCancel(`${red}Нет, я подумаю!`);
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            VIPMenuForm(client, donate);
        } else {
            if(data.response) {
                if(vip_lvl > vip_level) {
                    sendMessage(client, `${error} Вы не можете купить VIP статус более низкого уровня по сравнению с текущим!\n${info} Дождитесь окончания текущего VIP статуса!`);
                } else {
                    if(donate < vip_price) {
                        sendMessage(client, `${error} У вас недостаточно кристаллов для покупки ${yellow}${vip_name}${white} статуса!`);
                    } else {
                        const client_name = client.getName();
                        const sum = donate - vip_price;
                        const client_id: number | undefined = getPlayerIdByName(client_name);
                        broadcastMessage(`${info} Игрок ${yellow}[${client_id}] ${client_name}${white} приобрел ${red}${vip_name}${white} статус!`);
                        setDonate(client, sum);
                        if(vip_time !== null) {
                            const time = getTime().add(vip_time.diff(getTime(), 'days') + 31, 'days');
                            playerLog(client_name, `Потратил ${sum} кристаллов на продление ${vip_name} статус! (Дата окончания: ${getTimeFormat(time)})`);
                            setPlayerVipLevelByObject(client, vip_level, time);
                            setVipEndSql(client.getName(), time.toDate());
                            sendMessage(client, `${success} Поздравляем! Вы продлили ${yellow}${vip_name}${white} статус!\nСрок окончания VIP статуста можно узнать в ${yellow}/donate${white}!`);
                        } else {
                            const time = getTime().add(30, 'days');
                            playerLog(client_name, `Потратил ${sum} кристаллов на покупку ${vip_name} статус! (Дата окончания: ${getTimeFormat(time)})`);
                            setPlayerVipLevelByObject(client, vip_level, time);
                            setVipEndSql(client.getName(), time.toDate());
                            sendMessage(client, `${success} Поздравляем! Вы приобрели ${yellow}${vip_name}${white} статус!\nСрок окончания VIP статуста можно узнать в ${yellow}/donate${white}!`);
                        }
                    }
                }

            } else {
                VIPMenuForm(client, donate);
            }
        }
    });
}

export function expMenuForm(client: Player, donate: number, warning?: string): void {
    const form = new CustomForm();
    let count = 1;
    form.setTitle(`${gold}Покупка опыта`);

    //(lvl + 1) * 35 - limit exp

    if(warning !== undefined) {
        count = 2;
        form.addComponent(new FormLabel(`${red}${warning}`));
    }

    form.addComponent(new FormLabel(`${yellow}1 опыт - 2 кристалла`));
    form.addComponent(new FormInput(`Введите желаемое количество опыта:`, '10'));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            donateMenuForm(client);
        } else {
            const exp = parseInt(data.response[count]);
            if(isNaN(exp) || exp < 0) {
                expMenuForm(client, donate, 'Неверный формат! Укажите количество опыта в цифрах!');
            } else {
                if((exp * 2) > donate) {
                    expMenuForm(client, donate, 'У вас недостаточно кристаллов!');
                } else {
                    setDonate(client, donate - (exp * 2));
                    buyDonateExp(client, exp);
                    sendMessage(client, `${success} Вы купили ${yellow}${exp}${white} опыта за ${blue}${exp * 2}${white} кристаллов!`);
                }
            }
        }
    });
}

export function moneyMenuForm(client: Player, donate: number, warning?: string): void {
    const form = new CustomForm();
    let count = 1;
    form.setTitle(`${gold}Покупка Поликов`);

    if(warning !== undefined) {
        count = 2;
        form.addComponent(new FormLabel(`${red}${warning}`));
    }

    form.addComponent(new FormLabel(`${yellow}400 Поликов - 1 кристалл`));
    form.addComponent(new FormInput(`Введите количество кристаллов:`, '100'));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            donateMenuForm(client);
        } else {
            const money = parseInt(data.response[count]);
            if(isNaN(money) || money < 0) {
                moneyMenuForm(client, donate, 'Неверный формат! Укажите количество кристаллов в цифрах!');
            } else {
                if(money > donate) {
                    moneyMenuForm(client, donate, 'У вас недостаточно кристаллов!');
                } else {
                    const sum = money * 400;
                    setDonate(client, donate - money);
                    setMoney(client, sum);
                    playerLog(client.getName(), `Потратил ${money} кристаллов на покупку ${sum} Поликов!`);
                    sendMessage(client, `${success} Вы купили ${yellow}${sum}${white} Поликов за ${blue}${money}${white} кристаллов!`);
                }
            }
        }
    });
}

export function apanelMenuForm(client: Player): void {
    const form = new SimpleForm();
    form.setTitle(`Панель администрирования`);
    form.setContent(`${bold}${white}Привет, ${client.getName()}!\nВаш уровень админа - ${getAdminLevel(client)}`);
    form.addButton(new FormButton(`Администрация онлайн`));
    form.addButton(new FormButton(`Админ команды`));
    form.addButton(new FormButton(`Статистика экономики`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            // pass
        } else {
            switch (data.response) {
                case 0:
                    adminListForm(client);
                    break;

                case 1:
                    ahelpMenuForm(client);
                    break;

                case 2:
                    economyStatsMenuForm(client);
                    break;
            }
        }
    });
}

export function ahelpMenuForm(client: Player): void {
    const form = new SimpleForm();
    form.setTitle(`Команды для администраторов`);
    for (let index = 1; index < 7; index++) {
        form.addButton(new FormButton(`${index} Уровень админа`));
    }
    form.addButton(new FormButton(`Назад`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            // pass
        } else {
            data.response += 1;
            if(data.response === 7) {
                apanelMenuForm(client);
            } else {
                ahelpForm(client, data.response);
            }
        }
    });
}

export function ahelpForm(client: Player, admin_level: number): void {
    let content = "";

    switch (admin_level) {
        case 1:
            content = `${yellow}/apanel ${white}- панель администрирования
${yellow}/gm ${white}- сменить игровой режим
${yellow}/ask ${white}- ответить игроку
${yellow}/pm ${white}- написать / отправить форму игроку
${yellow}/getinfo ${white}- посмотреть статистику игрока
${yellow}/goto ${white}- телепортироваться к игроку
${yellow}/gethere ${white}- телепортировать к себе игрока
${yellow}/a ${white}- написать в админ чат
${yellow}/admins ${white}- список администраторов онлайн на сервере
${yellow}/kick ${white}- кикнуть игрока с сервера
${yellow}/mute ${white}- выдать блокировку чата игроку
${yellow}/unmute ${white}- снять блокировку чата игроку`;
            break;

        case 2:
            content = `${yellow}/cc ${white}- очистить чат всем игрокам
${yellow}/sethp ${white}- установить здоровье игроку
${yellow}/seteat ${white}- установить голод игроку
${yellow}/slay ${white}- убить игрока
${yellow}/slap ${white}- подкинуть / подбросить игрока
${yellow}/offmute ${white}- выдать блокировку чата игроку в оффлайне
${yellow}/unoffmute ${white}- снять блокировку чата игроку в оффлайне`;
            break;

        case 3:
            content = `${yellow}/skick ${white}- тихо кикнуть игрока с сервера
${yellow}/ban ${white}- выдать блокировку аккаунта игроку
${yellow}/unban ${white}- снять блокировку аккаунта игроку
${yellow}/warn ${white}- выдать предупреждение игроку
${yellow}/unwarn ${white}- снять предупреждение игроку`;
            break;

        case 4:
            content = `${yellow}/offban ${white}- выдать блокировку аккаунта игроку в оффлайне
${yellow}/offwarn ${white}- выдать предупреждение игроку в оффлайне
${yellow}/unoffwarn ${white}- снять предупреждение игроку в оффлайне`;
            break;

        case 5:
            if(admin_level === 5 && getAdminLevel(client) >= 5) {
                content = `${yellow}/setadmin ${white}- выдать права администратора игроку
${yellow}/removevip ${white}- аннулировать VIP статус игроку
${yellow}/setvip ${white}- выдать VIP статус игроку
${yellow}/setdonate ${white}- выдать кристаллы игроку`;
            } else {
                content = `${red} У вас недостаточно высокий уровень администратора, чтобы просматривать данный список комманд!`;
            }
            break;

        case 6:
            if(admin_level === 6 && getAdminLevel(client) === 6) {
                content = `${yellow}/command ${white}- TEXT`;
            } else {
                content = `${red} У вас недостаточно высокий уровень администратора, чтобы просматривать данный список комманд!`;
            }
            break;
    }

    const form = new SimpleForm();
    form.setTitle(`Команды для ${admin_level} уровня админа`);
    form.setContent(content);
    form.addButton(new FormButton(`Назад`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            // pass
        } else {
            ahelpMenuForm(client);
        }
    });
}

export function economyStatsMenuForm(client: Player): void {
    let economy_today: number | string = getEconomyStatsToday();
    let economy: number | string = getEconomyStats();
    const form = new SimpleForm();
    form.setTitle(`Статистика экономики`);

    if(economy >= 10000) {
        economy = addCommas(economy.toString());
    }

    if(economy_today >= 10000) {
        economy_today = addCommas(economy_today.toString());
    }

    if(economy_today === 0) {
        form.setContent(`${yellow}Всего Поликов на сервере: ${bold}${white}${economy}\n${reset}${yellow}Заработано Поликов за сегодня: ${bold}${white}${economy_today}`);
    }

    if(economy_today > 0) {
        form.setContent(`${yellow}Всего Поликов на сервере: ${bold}${white}${economy}\n${reset}${yellow}Заработано Поликов за сегодня: ${bold}${green}${economy_today}`);
    }

    if(economy_today < 0) {
        form.setContent(`${yellow}Всего Поликов на сервере: ${bold}${white}${economy}\n${reset}${yellow}Заработано Поликов за сегодня: ${bold}${red}${economy_today}`);
    }

    form.addButton(new FormButton(`Назад`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            // pass
        } else {
            if(data.response === 0) {
                apanelMenuForm(client);
            } else {
                apanelMenuForm(client);
            }
        }
    });
}

export function personalMessageForm(client: Player, client_id: number, message: string, admin: Player): void {
    const form = new SimpleForm();
    form.setTitle(`Сообщение от ${admin.getName()}`);
    form.setContent(message);
    form.addButton(new FormButton(`Закрыть`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            sendMessage(admin, `${info} Игрок ${yellow}[${client_id}] ${client.getName()} ${white}закрыл ваше сообщение!`);
        } else {
            sendMessage(admin, `${info} Игрок ${yellow}[${client_id}] ${client.getName()} ${white}закрыл ваше сообщение!`);
        }
    });
}

export function mainMenu(client: Player): void {
    const [, level] = getRpgMod(client);
    const form = new SimpleForm();
    form.setTitle(`Главное меню`);
    form.addButton(new FormButton(`Статистика`));
    form.addButton(new FormButton(`Настройки`));
    form.addButton(new FormButton(`RPG Меню`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            // pass
        } else {
            switch (data.response) {
                case 0:
                    clientStatsForm(client, getStats(client));
                    break;

                case 1:
                    settingsMenu(client);
                    break;

                case 2:
                    if(level === 0) {
                        setRpgRandomMod(client);
                    }
                    rpgMainMenu(client);
                    break;
            }
        }
    });
}

export function settingsMenu(client: Player): void {
    const status = getInfoBarStatus(client);
    const form = new SimpleForm();
    form.setTitle(`Настройки аккаунта`);
    if(status === "ON") {
        form.addButton(new FormButton(`Info Bar [${green}ON${gray}]`));
    } else {
        form.addButton(new FormButton(`Info Bar [${red}OFF${gray}]`));
    }
    form.addButton(new FormButton(`Назад`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            // pass
        } else {
            switch(data.response) {
                case 0:
                    if(status === "ON") {
                        setInfoBarStatus(client, false);
                        settingsMenu(client);
                    } else {
                        setInfoBarStatus(client, true);
                        settingsMenu(client);
                    }
                    break;

                case 1:
                    mainMenu(client);
                    break;
            }
        }
    });
}