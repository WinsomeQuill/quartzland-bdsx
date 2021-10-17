import { Player } from "bdsx/bds/player";
import { addCommas, addMoneyBank, blue, error, getClanByPlayer, getDistancePlayers,
    getMoneyBank, getPlayerByName, getPlayerIdByObject, getPlayersNamesForClans,
    green, info, isOnline, red, sendMessage, success, takeMoneyBank, white, yellow } from "../management/index";
import { CustomForm, FormButton, FormDropdown, FormInput, FormLabel, FormSlider,
    ModalForm, SimpleForm } from "bdsx/bds/form";
import { getClanAndRankByMemberSql, getMembersClanSql } from "../sqlmanager";
import { addBalanceClan, addMemberClan, getBalanceClan, getClanOnlineMembers,
    getClanOnlineMembersByRankLimit, getCountMembersClan, getDeputyClan, getDescriptionClan,
    getMemberRankClan, getMembersNamesClan, getOwnerClan, removeClan, removeMemberClan,
    sendMessageClan, setDescriptionClan, takeBalanceClan } from "./manager";
import { playerLog } from "../logs/index";

export function clansMainForm(client: Player, clan_name: string): void {
    const clan_rank = getMemberRankClan(clan_name, client.getName());
    const form = new SimpleForm();
    form.setTitle(`Клан - ${clan_name} | Ранг - ${clan_rank}`);
    form.addButton(new FormButton(`Список игроков онлайн`));
    form.addButton(new FormButton(`Информация о клане`));

    if(clan_rank >= 9) {
        form.addButton(new FormButton(`Изменить информацию о клане`));
        form.addButton(new FormButton(`Пригласить игрока в клан`));
        form.addButton(new FormButton(`Выгнать игрока из клана`));
        form.addButton(new FormButton(`Выдать ранг игроку`));
    }

    form.addButton(new FormButton(`Бюджет клана`));

    if(clan_rank !== 10) {
        form.addButton(new FormButton(`${red}Покинуть клан`));
    }

    if(clan_rank === 10) {
        form.addButton(new FormButton(`${red}Удалить клан`));
    }

    form.addButton(new FormButton(`Выход`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            // pass
        } else {
            if(clan_rank === 10) {
                switch (data.response) {
                    case 0:
                        clansMembersOnlineForm(client, clan_name, clan_rank);
                        break;

                    case 1:
                        clansDescriptionForm(client, clan_name, clan_rank);
                        break;

                    case 2:
                        clansChangeDescriptionForm(client, clan_name, clan_rank);
                        break;

                    case 3:
                        clansInvitePlayerForm(client, clan_name, clan_rank);
                        break;

                    case 4:
                        await clansRemovePlayerForm(client, clan_name, clan_rank);
                        break;

                    case 5:
                        clansSetRankPlayerForm(client, clan_name, clan_rank);
                        break;

                    case 6:
                        clansBalanceForm(client, clan_name, clan_rank);
                        break;

                    case 7:
                        clansRemoveForm(client, clan_name, clan_rank);
                        break;

                    case 8:
                        break;
                }
            }

            if(clan_rank === 9) {
                switch (data.response) {
                    case 0:
                        clansMembersOnlineForm(client, clan_name, clan_rank);
                        break;

                    case 1:
                        clansDescriptionForm(client, clan_name, clan_rank);
                        break;

                    case 2:
                        clansChangeDescriptionForm(client, clan_name, clan_rank);
                        break;

                    case 3:
                        clansInvitePlayerForm(client, clan_name, clan_rank);
                        break;

                    case 4:
                        await clansRemovePlayerForm(client, clan_name, clan_rank);
                        break;

                    case 5:
                        clansSetRankPlayerForm(client, clan_name, clan_rank);
                        break;

                    case 6:
                        clansBalanceForm(client, clan_name, clan_rank);
                        break;

                    case 7:
                        clansLeaveForm(client, clan_name, clan_rank);
                        break;

                    case 8:
                        break;
                }
            }

            if(clan_rank <= 8) {
                switch (data.response) {
                    case 0:
                        clansMembersOnlineForm(client, clan_name, clan_rank);
                        break;

                    case 1:
                        clansDescriptionForm(client, clan_name, clan_rank);
                        break;

                    case 2:
                        clansBalanceForm(client, clan_name, clan_rank);
                        break;

                    case 3:
                        clansLeaveForm(client, clan_name, clan_rank);
                        break;

                    case 4:
                        break;
                }
            }
        }
    });
}

export function clansMembersOnlineForm(client: Player, clan_name: string, clan_rank: number): void {
    const form = new CustomForm();
    const members = getClanOnlineMembers(clan_name);
    form.setTitle(`Клан - ${clan_name} | Ранг - ${clan_rank}`);
    form.addComponent(new FormLabel(`Список игроков онлайн:`));

    if(members.length === 0) {
        form.addComponent(new FormLabel(`Все участники клана не в сети!`));
    }

    if(members.length === 1) {
        form.addComponent(new FormLabel(`${members}`));
    }

    if(members.length > 1) {
        form.addComponent(new FormLabel(`${members.join('\n')}`));
    }

    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            // pass
        } else {
            clansMainForm(client, clan_name);
        }
    });
}

export function clansDescriptionForm(client: Player, clan_name: string, clan_rank: number): void {
    const form = new CustomForm();
    const count_members = getCountMembersClan(clan_name);
    const owner = getOwnerClan(clan_name);
    const [deputy1, deputy2] = getDeputyClan(clan_name);
    const description = getDescriptionClan(clan_name);
    const balance = getBalanceClan(clan_name);
    form.setTitle(`Клан - ${clan_name} | Ранг - ${clan_rank}`);
    form.addComponent(new FormLabel(`Название клана: [ ${clan_name} ]`));
    form.addComponent(new FormLabel(`Владелец: [ ${owner} ]`));

    if(deputy1 !== undefined) {
        form.addComponent(new FormLabel(`Заместитель 1: [ ${deputy1} ]`));
    } else {
        form.addComponent(new FormLabel(`Заместитель 1: [ ${green}СВОБОДНО${white} ]`));
    }

    if(deputy2 !== undefined) {
        form.addComponent(new FormLabel(`Заместитель 2: [ ${deputy2} ]`));
    } else {
        form.addComponent(new FormLabel(`Заместитель 2: [ ${green}СВОБОДНО${white} ]`));
    }

    form.addComponent(new FormLabel(`Количество участников: [ ${count_members} ]`));
    form.addComponent(new FormLabel(`Описание: ${description}`));
    form.addComponent(new FormLabel(`Бюджет: [ ${green}${addCommas(balance.toString())}${white} Поликов ]`));

    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            // pass
        } else {
            clansMainForm(client, clan_name);
        }
    });
}

export function clansChangeDescriptionForm(client: Player, clan_name: string, clan_rank: number, warning?: string): void {
    const form = new CustomForm();
    form.setTitle(`Клан - ${clan_name} | Ранг - ${clan_rank}`);

    if(warning !== undefined) {
        form.addComponent(new FormLabel(`${red}${warning}${white}`));
    }

    form.addComponent(new FormInput(`Введите новое описание клана`, `Максимум 120 символов!`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            clansMainForm(client, clan_name);
        } else {
            let num = 0;
            if(warning !== undefined) {
                num = 1;
            }

            if(data.response[num].length > 120) {
                clansChangeDescriptionForm(client, clan_name, clan_rank, 'Слишком длинное описание! Максимум 120 символов!');
                return;
            }

            if(data.response[num].length < 5) {
                clansChangeDescriptionForm(client, clan_name, clan_rank, 'Слишком короткое описание!');
                return;
            }

            playerLog(client.getName(), `Изменил описание клана "${clan_name}" на "${data.response[num]}"!`);
            setDescriptionClan(clan_name, data.response[num]);
            clansMainForm(client, clan_name);
        }
    });
}

export function clansInvitePlayerForm(client: Player, clan_name: string, clan_rank: number, warning?: string): void {
    const form = new CustomForm();
    const members_names = getPlayersNamesForClans();
    const member_count = getCountMembersClan(clan_name);

    if(members_names.length === 0) {
        sendMessage(client, `${error} На сервере нету подходящих игроков!`);
        return;
    }

    form.setTitle(`Клан - ${clan_name} | Ранг - ${clan_rank}`);

    if(warning !== undefined) {
        form.addComponent(new FormLabel(`${red}${warning}${white}`));
    }

    form.addComponent(new FormLabel(`${yellow}Если вы не нашли нужного игрока, то скорее всего он уже состоит в другом клане или просто вышел с сервера или его уровень меньше 3!${white}`));
    form.addComponent(new FormDropdown(`Выберите игрока которому хотите отправить приглашение в клан`, members_names));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            clansMainForm(client, clan_name);
        } else {
            let num = 1;
            if(warning !== undefined) {
                num = 2;
            }

            if(!isOnline(members_names[data.response[num]])) {
                clansInvitePlayerForm(client, clan_name, clan_rank, 'Игрок не найден! Скорее всего он вышел с сервера.');
                return;
            }

            if(getClanByPlayer(members_names[data.response[num]])) {
                clansInvitePlayerForm(client, clan_name, clan_rank, 'Игрок не найден! Скорее всего он вступил в другой клан.');
                return;
            }

            if(member_count >= 20) {
                clansInvitePlayerForm(client, clan_name, clan_rank, 'В клане может быть только до 20 участников!');
                return;
            }

            const target_client = getPlayerByName(members_names[data.response[num]]);
            if(target_client !== undefined) {
                const dist = getDistancePlayers(client, target_client);
                if(dist > 10) {
                    clansInvitePlayerForm(client, clan_name, clan_rank, 'Игрок слишком далеко от вас!');
                    return;
                }
                clansInvitePlayerConfirmForm(client, clan_name, target_client);
            }
            clansMainForm(client, clan_name);
        }
    });
}

export function clansInvitePlayerConfirmForm(client: Player, clan_name: string, owner: Player): void {
    const form = new ModalForm();
    const owner_id = getPlayerIdByObject(owner);
    const owner_name = owner.getName();
    const client_id = getPlayerIdByObject(client);
    const client_name = client.getName();
    form.setTitle(`Приглашени в клан ${clan_name}`);
    form.setContent(`Игрок ${yellow}[${owner_id}] ${owner_name}${white} приглашает Вас вступить в клан ${yellow}${clan_name}${white}, принять приглашение?`);
    form.setButtonConfirm('Да, вступить в клан!');
    form.setButtonCancel('Нет, отклюнить приглашение!');
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            sendMessage(client, `${info} Вы ${red}отклонили${white} приглашение в клан ${yellow}${clan_name}${white} от игрока ${yellow}[${owner_id}] ${owner_name}${white}!`);
            sendMessage(owner, `${info} Игрок ${yellow}[${client_id}] ${client_name}${white} ${red}отклонил${white} ваше приглашение в клан!`);
        } else {
            if(data.response) {
                playerLog(owner.getName(), `Пригласил игрока ${client_name} в клан "${clan_name}"!`);
                playerLog(client.getName(), `Принял приглашение в клан "${clan_name}" от игрока ${owner_name}!`);
                sendMessage(client, `${info} Вы ${green}приняли${white} приглашение в клан ${yellow}${clan_name}${white} от игрока ${yellow}[${owner_id}] ${owner_name}${white}!\nИспользуйте ${yellow}/clan${white} чтобы открыть меню клана!`);
                sendMessage(owner, `${info} Игрок ${yellow}[${client_id}] ${client_name}${white} ${green}принял${white} ваше приглашение в клан!`);
                addMemberClan(client, clan_name, 1);
                sendMessageClan(clan_name, `Игрок [${client_id}] ${client_name} теперь состоит в нашем клане!`);
            } else {
                sendMessage(client, `${info} Вы ${red}отклонили${white} приглашение в клан ${yellow}${clan_name}${white} от игрока ${yellow}[${owner_id}] ${owner_name}${white}!`);
                sendMessage(owner, `${info} Игрок ${yellow}[${client_id}] ${client_name}${white} ${red}отклонил${white} ваше приглашение в клан!`);
            }
        }
    });
}

export async function clansRemovePlayerForm(client: Player, clan_name: string, clan_rank: number, warning?: string): Promise<void> {
    const form = new CustomForm();
    const members_sql = await getMembersClanSql(clan_name, clan_rank - 1);
    const members: string[] = [];

    for (let index = 0; index < members_sql.length; index++) {
        members.push(members_sql[index]['member_name']);
    }

    form.setTitle(`Клан - ${clan_name} | Ранг - ${clan_rank}`);

    if(warning !== undefined) {
        form.addComponent(new FormLabel(`${red}${warning}${white}`));
    }

    form.addComponent(new FormLabel(`${yellow}Если вы не нашли нужного игрока, значит он уже не состоит в клане!${white}`));
    form.addComponent(new FormDropdown(`Выберите игрока которого хотите выгнать`, members));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            clansMainForm(client, clan_name);
        } else {
            let num = 1;
            if(warning !== undefined) {
                num = 2;
            }

            console.log(data.response, members[data.response[num]]);
            const target_name = members[data.response[num]];
            const result = await getClanAndRankByMemberSql(target_name);
            if(result[0]['name'] === null) {
                clansRemovePlayerForm(client, clan_name, clan_rank, 'Игрок не найден! Скорее всего он уже не состоит в клане.');
                return;
            }

            const target_client = getPlayerByName(target_name);
            const client_id = getPlayerIdByObject(client);
            const client_name = client.getName();
            removeMemberClan(target_name, clan_name);

            if(target_client !== undefined) {
                const target_id = getPlayerIdByObject(target_client);
                playerLog(client_name, `Выгнал игрока ${target_name} из клана "${clan_name}"`);
                playerLog(target_name, `Покинул клан "${clan_name}"! Причина: Выгнан игроком ${client_name}!`);
                sendMessage(client, `${success} Вы выгнали игрока ${yellow}[${target_id}] ${target_name}${white} из клана!`);
                sendMessage(target_client, `${info} Игрок ${yellow}[${client_id}] ${client_name}${white} выгнал вас из клана!`);
                sendMessageClan(clan_name, `Игрок [${client_id}] ${client_name} выгнал игрока [${target_id}] ${target_name} из клана!`);
            } else {
                playerLog(client_name, `Выгнал игрока ${target_name} из клана "${clan_name}"`);
                playerLog(target_name, `Покинул клан "${clan_name}"! Причина: Выгнан игроком ${client_name}!`);
                sendMessage(client, `${success} Вы выгнали игрока ${yellow}${target_name}${white} из клана!`);
                sendMessageClan(clan_name, `Игрок [${client_id}] ${client_name} выгнал игрока ${target_name} из клана!`);
            }

            clansMainForm(client, clan_name);
        }
    });
}

export function clansSetRankPlayerForm(client: Player, clan_name: string, clan_rank: number, warning?: string): void {
    const members = getClanOnlineMembersByRankLimit(clan_name, clan_rank - 1);

    if(members.length === 0) {
        sendMessage(client, `${error} Все участники клана, кроме Вас, не в сети!`);
        return;
    }

    const form = new CustomForm();
    form.setTitle(`Клан - ${clan_name} | Ранг - ${clan_rank}`);

    if(warning !== undefined) {
        form.addComponent(new FormLabel(`${red}${warning}${white}`));
    }

    form.addComponent(new FormLabel(`${yellow}Если вы не нашли нужного игрока, значит он не состоит в клане или ему нельзя изменять ранг, либо он не в сети!${white}`));
    form.addComponent(new FormDropdown(`Выберите игрока которому хотите изменить ранг`, members));
    form.addComponent(new FormSlider(`Выберите игрока которому хотите изменить ранг`, 1, clan_rank - 1));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            clansMainForm(client, clan_name);
        } else {
            let num = 1, slider = 2;
            if(warning !== undefined) {
                num = 2, slider = 3;
            }


            const target_name = members[data.response[num]];
            const target_client = getPlayerByName(target_name);
            const client_id = getPlayerIdByObject(client);
            if(target_client === undefined) {
                clansSetRankPlayerForm(client, clan_name, clan_rank, 'Игрок не найден! Скорее всего он вышел с сервера!');
                return;
            } else {

                if(getClanByPlayer(target_name) === null) {
                    clansSetRankPlayerForm(client, clan_name, clan_rank, 'Игрок не найден! Скорее всего он уже не состоит в клане!');
                    return;
                }

                const client_name = client.getName();
                const target_id = getPlayerIdByObject(target_client);
                sendMessage(client, `${success} Вы изменили ранг игроку ${yellow}[${target_id}] ${target_name}${white} на ${blue}${data.response[slider]}${white}!`);
                sendMessage(target_client, `${info} Игрок ${yellow}[${client_id}] ${client_name}${white} изменил ваш ранг на ${blue}${data.response[slider]}${white}!`);
                playerLog(client_name, `Изменил в клане "${clan_name}" ранг игроку ${target_name} на ${data.response[slider]}`);
                playerLog(target_name, `Получил ${data.response[slider]} ранг в клане "${clan_name}" от игрока ${client_name}!`);
            }


            clansMainForm(client, clan_name);
        }
    });
}

export function clansBalanceForm(client: Player, clan_name: string, clan_rank: number, warning?: string): void {
    const form = new SimpleForm();
    const balance_clan = getBalanceClan(clan_name);
    form.setTitle(`Клан - ${clan_name} | Ранг - ${clan_rank}`);
    form.setContent(`Баланс клана: ${green}${addCommas(balance_clan.toString())}${white} Поликов`);
    form.addButton(new FormButton(`Пополнить баланс клана`));

    if(clan_rank >= 9) {
        form.addButton(new FormButton(`Снять с баланса клана`));
    }

    form.addButton(new FormButton(`Назад`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            clansMainForm(client, clan_name);
        } else {
            if(clan_rank >= 9) {
                switch (data.response) {
                    case 0:
                        clansUpBalanceForm(client, clan_name, clan_rank);
                        break;

                    case 1:
                        clansTakeBalanceForm(client, clan_name, clan_rank);
                        break;

                    case 2:
                        clansMainForm(client, clan_name);
                        break;
                }
            } else {
                switch (data.response) {
                    case 0:
                        clansUpBalanceForm(client, clan_name, clan_rank);
                        break;

                    case 2:
                        clansMainForm(client, clan_name);
                        break;
                }
            }
        }
    });
}

export function clansUpBalanceForm(client: Player, clan_name: string, clan_rank: number, warning?: string): void {
    const form = new CustomForm();
    const client_balance: number = getMoneyBank(client);
    form.setTitle(`Клан - ${clan_name} | Ранг - ${clan_rank}`);

    if(warning !== undefined) {
        form.addComponent(new FormLabel(`${red}${warning}${white}`));
    }

    form.addComponent(new FormInput(`Введите сумму для пополнения:`, '1000'));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            clansMainForm(client, clan_name);
        } else {

            let num = 0;
            if(warning !== undefined) {
                num = 1;
            }

            const input_money: string = data.response[num];
            if(isNaN(parseInt(input_money))) {
                clansUpBalanceForm(client, clan_name, clan_rank, 'Неверный формат! Используйте только цифры!');
                return;
            }

            const int_money: number = parseInt(input_money);
            if(int_money < 1000) {
                clansUpBalanceForm(client, clan_name, clan_rank, `Ошибка! Сумма пополнения должна быть больше или равна ${green}1000${red} Поликов!`);
                return;
            }

            if(int_money > client_balance) {
                clansUpBalanceForm(client, clan_name, clan_rank, `Ошибка! У вас недостаточно Поликов в банке! Нужно еще ${green}${addCommas((int_money - client_balance).toString())}${red} Поликов!`);
                return;
            }

            const client_name = client.getName();
            const client_id = getPlayerIdByObject(client);
            takeMoneyBank(client, int_money);
            addBalanceClan(clan_name, int_money);
            playerLog(client_name, `Пополнил баланс клана "${clan_name}" на ${int_money} Поликов!`);
            sendMessage(client, `${success} Вы пополнили баланс клана на ${green}${int_money}${white} Поликов!`);
            sendMessageClan(clan_name, `Игрок [${client_id}] ${client_name} пополнил баланс клана на ${green}${int_money}${white} Поликов`);
        }
    });
}

export function clansTakeBalanceForm(client: Player, clan_name: string, clan_rank: number, warning?: string): void {
    const form = new CustomForm();
    const clan_balance: number = getBalanceClan(clan_name);
    form.setTitle(`Клан - ${clan_name} | Ранг - ${clan_rank}`);

    if(warning !== undefined) {
        form.addComponent(new FormLabel(`${red}${warning}${white}`));
    }

    form.addComponent(new FormInput(`Введите сумму для снятия:`, '1000'));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            clansMainForm(client, clan_name);
        } else {

            if(clan_rank <= 8) {
                clansMainForm(client, clan_name);
                return;
            }

            let num = 0;
            if(warning !== undefined) {
                num = 1;
            }

            const input_money: string = data.response[num];
            if(isNaN(parseInt(input_money))) {
                clansTakeBalanceForm(client, clan_name, clan_rank, 'Неверный формат! Используйте только цифры!');
                return;
            }

            const int_money: number = parseInt(input_money);
            if(int_money < 1000) {
                clansTakeBalanceForm(client, clan_name, clan_rank, `Ошибка! Сумма для снятия должна быть больше или равна ${green}1000${red} Поликов!`);
                return;
            }

            if(int_money > clan_balance) {
                clansTakeBalanceForm(client, clan_name, clan_rank, `Ошибка! В клане недостаточно Поликов! Нужно еще ${green}${addCommas((int_money - clan_balance).toString())}${red} Поликов!`);
                return;
            }

            addMoneyBank(client, int_money);
            takeBalanceClan(clan_name, int_money);
            playerLog(client.getName(), `Снял с баланса клана "${clan_name}" ${int_money} Поликов!`);
            sendMessage(client, `${success} Вы сняли с баланса клана ${green}${int_money}${white} Поликов!`);
        }
    });
}

export function clansLeaveForm(client: Player, clan_name: string, clan_rank: number): void {
    const form = new ModalForm();
    form.setTitle(`Клан - ${clan_name} | Ранг - ${clan_rank}`);
    form.setContent(`${red}Вы действительно хотите покинуть клан ${yellow}${clan_name}${red}?`);
    form.setButtonConfirm(`Да, покинуть клан!`);
    form.setButtonCancel(`Нет, остаться!`);
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            clansMainForm(client, clan_name);
        } else {
            if(data.response) {
                const client_id = getPlayerIdByObject(client);
                const client_name = client.getName();
                removeMemberClan(client_name, clan_name);
                sendMessage(client, `${success} Вы покинули клан ${yellow}${clan_name}${white}!`);
                sendMessageClan(clan_name, `Игрок [${client_id}] ${client_name} самостоятельно покинул клан!`);
            } else {
                clansMainForm(client, clan_name);
            }
        }
    });
}

export function clansRemoveForm(client: Player, clan_name: string, clan_rank: number): void {
    const form = new ModalForm();
    const members: string[] = getMembersNamesClan(clan_name);
    form.setTitle(`Клан - ${clan_name} | Ранг - ${clan_rank}`);
    form.setContent(`${red}Вы действительно хотите удалить клан ${yellow}${clan_name}${red}? Это действие нельзя будет отменить!`);
    form.setButtonConfirm(`${red}Да, удалить навсегда!`);
    form.setButtonCancel(`Нет, оставить!`);
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            clansMainForm(client, clan_name);
        } else {
            if(data.response) {
                if(clan_rank === 10) {
                    const client_id = getPlayerIdByObject(client);
                    sendMessageClan(clan_name, `Владелец [${client_id}] ${client.getName()} удалил клан! `);
                    for (let index = 0; index < members.length; index++) {
                        removeMemberClan(members[index], clan_name);
                    }

                    removeClan(clan_name);
                    sendMessage(client, `${success} Вы удалили клан ${yellow}${clan_name}${white}!`);
                }
            } else {
                clansMainForm(client, clan_name);
            }
        }
    });
}