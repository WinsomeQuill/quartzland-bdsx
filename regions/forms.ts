import { Player } from "bdsx/bds/player";
import { blue, bold, error, sendMessage, success, yellow, white, green, red, reset, info,
    addCommas, gray, Percent_Plus, getPercentBank, addMoneyBank, getPlayerByName, takeMoneyBank,
    getMoneyBank, getPlayerIdByObject, getDistancePlayers } from "../management/index";
import { SimpleForm, FormInput, FormLabel, FormButton, CustomForm, FormDropdown, ModalForm } from "bdsx/bds/form";
import { addMoneyBankSql, getRegionsByPlayerSql, getRegionsInSellSql } from "../sqlmanager/index";
import { addRegionMember, getPlayersForRegion, getRegionCountDeputy, getRegionCountMembers, getRegionDescription, setRegionFlagChangeStatus,
    getRegionFlags, getRegionFlagStatus, getRegionMemberDeputy, getRegionMembers, getRegionMembersByRank, getRegionOwner, getRegionAVGPosition,
    getRegionPrice, isRegionSell, RegionRemove, removeRegionMember, setRegionDescription, setRegionMemberRank, setRegionOwner, setRegionPrice, getRegionWorldId } from "./manager";

export function regionMainForm(client: Player): void {
    const form = new SimpleForm();
    form.setTitle('Управление регионами');
    form.addButton(new FormButton('Мои регионы'));
    form.addButton(new FormButton('Регионы в которых я участник'));
    form.addButton(new FormButton('Регионы в которых я зам.'));
    form.addButton(new FormButton('Регионы в продаже'));
    form.addButton(new FormButton('Помощь'));
    form.addButton(new FormButton('Выход'));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
           // pass
        } else {
            switch (data.response) {
                case 0:
                    myRegionsForm(client, 3);
                    break;

                case 1:
                    myRegionsForm(client, 1);
                    break;

                case 2:
                    myRegionsForm(client, 2);
                    break;

                case 3:
                    regionsInSellForm(client);
                    break;

                case 4:
                    regionsHelpForm(client);
                    break;

                case 5:
                    break;
            }
        }
    });
}

export function myRegionsForm(client: Player, rank: number): void {
    let count = 0;
    const client_name = client.getName();
    const form = new SimpleForm();
    form.setTitle('Список регионов');
    if(rank === 3) {
        getRegionsByPlayerSql(client_name)
            .then((results) => {
                count = results.length;

                for (let index = 0; index < results.length; index++) {
                    form.addButton(new FormButton(results[index]['name']));
                }

                form.addButton(new FormButton('Назад'));
                form.sendTo(client.getNetworkIdentifier(), async (data) => {
                    if(data.response === null) {
                        regionMainForm(client);
                    } else {
                        if(data.response === count) {
                            regionMainForm(client);
                        } else {
                            regionManagerForm(client, results[data.response]['name'], 3);
                        }
                    }
                });
            })
            .catch((err) => {
                console.error(err);
            });
    }

    if(rank === 2) {
        getRegionsByPlayerSql(client_name, 2)
            .then((results) => {
                count = results.length;

                for (let index = 0; index < results.length; index++) {
                    form.addButton(new FormButton(results[index]['name']));
                }

                form.addButton(new FormButton('Назад'));
                form.sendTo(client.getNetworkIdentifier(), async (data) => {
                    if(data.response === null) {
                        regionMainForm(client);
                    } else {
                        if(data.response === count) {
                            regionMainForm(client);
                        } else {
                            regionManagerForm(client, results[data.response]['name'], 2);
                        }
                    }
                });
            })
            .catch((err) => {
                console.error(err);
            });
    }

    if(rank === 1) {
        getRegionsByPlayerSql(client_name, 1)
            .then((results) => {
                count = results.length;

                for (let index = 0; index < results.length; index++) {
                    form.addButton(new FormButton(results[index]['name']));
                }

                form.addButton(new FormButton('Назад'));
                form.sendTo(client.getNetworkIdentifier(), async (data) => {
                    if(data.response === null) {
                        regionMainForm(client);
                    } else {
                        if(data.response === count) {
                            regionMainForm(client);
                        } else {
                            regionInfoForm(client, results[data.response]['name'], rank);
                        }
                    }
                });
            })
            .catch((err) => {
                console.error(err);
            });
    }
}

export function regionManagerForm(client: Player, name: string, rank: number): void {
    const form = new SimpleForm();
    const sell: boolean = isRegionSell(name);
    form.setTitle(`Управление регионом ${bold}${blue}${name}`);
    form.addButton(new FormButton('Информация'));
    form.addButton(new FormButton('Изменить описание'));
    form.addButton(new FormButton('Добавить игрока'));

    if(rank === 3) {
        form.addButton(new FormButton('Изменить должность игроку'));
    }

    form.addButton(new FormButton('Удалить игрока'));
    form.addButton(new FormButton('Изменить флаги'));

    if(rank === 3) {
        form.addButton(new FormButton(`${red}Удалить регион`));
        if(sell) {
            form.addButton(new FormButton('Убрать с продажи регион'));
        } else {
            form.addButton(new FormButton('Продать регион'));
        }
    }

    form.addButton(new FormButton('Назад'));
    form.addButton(new FormButton('Выход'));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
           // pass
        } else {
            if(rank === 3) {
                switch (data.response) {
                    case 0:
                        regionInfoForm(client, name, rank);
                        break;

                    case 1:
                        regionChangeDescriptionForm(client, name, rank);
                        break;

                    case 2:
                        regionAddMemberForm(client, name, rank);
                        break;

                    case 3:
                        regionSetMemberRankForm(client, name, rank);
                        break;

                    case 4:
                        regionRemoveMemberForm(client, name, rank);
                        break;

                    case 5:
                        regionChangeFlagForm(client, name, rank);
                        break;

                    case 6:
                        regionRemoveConfirmForm(client, name, rank);
                        break;

                    case 7:
                        if(sell) {
                            regionSellRemoveConfirmForm(client, name, rank);
                        } else {
                            regionSetPriceForm(client, name, rank);
                        }
                        break;

                    case 8:
                        myRegionsForm(client, 3);
                        break;

                    case 9:
                        break;
                }
            } else {
                switch (data.response) {
                    case 0:
                        regionInfoForm(client, name, rank);
                        break;

                    case 1:
                        regionChangeDescriptionForm(client, name, rank);
                        break;

                    case 2:
                        regionAddMemberForm(client, name, rank);
                        break;

                    case 3:
                        regionRemoveMemberForm(client, name, rank);
                        break;

                    case 4:
                        regionChangeFlagForm(client, name, rank);
                        break;

                    case 5:
                        myRegionsForm(client, 2);
                        break;

                    case 6:
                        break;
                }
            }
        }
    });
}

export function regionChangeDescriptionForm(client: Player, name: string, rank: number): void {
    const form = new CustomForm();
    form.setTitle(`Управление регионом ${bold}${blue}${name}`);
    form.addComponent(new FormInput('Введите новое описание региона:', 'Максимум 80 символов!'));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            regionManagerForm(client, name, rank);
        } else {
            if(data.response[0].length < 3) {
                sendMessage(client, `${error} Слишком короткое описание региона!`);
                return;
            }

            if(data.response[0].length > 80) {
                sendMessage(client, `${error} Слишком длинное описание региона!`);
                return;
            }

            setRegionDescription(name, data.response[0]);
            sendMessage(client, `${success} Вы изменили описание региона!`);
        }
    });
}

export function regionSetMemberRankForm(client: Player, name: string, rank: number): void {
    const players = getRegionMembers(name, client.getName());

    if(players.length === 0) {
        sendMessage(client, `${error} В регионе ${yellow}${name}${white} никто не состоит кроме Вас!`);
        return;
    }

    const ranks = ['Участник', 'Заместитель'];
    const form = new CustomForm();
    form.setTitle(`Управление регионом ${bold}${blue}${name}`);
    form.addComponent(new FormDropdown('Выберите игрока которому хотите изменить должность', players));
    form.addComponent(new FormDropdown('Выберите новую должность', ranks));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            regionManagerForm(client, name, rank);
        } else {
            if(players[data.response[0]] === client.getName()) {
                sendMessage(client, `${error} Как ты это сделал? #2`);
                return;
            }

            setRegionMemberRank(name, players[data.response[0]], data.response[1] + 1);
            sendMessage(client, `${success} Вы изменили должность игроку ${yellow}${players[data.response[0]]}${white} на ${yellow}${ranks[data.response[1]]}${white} в регионе ${yellow}${name}${white}!`);
        }
    });
}

export function regionAddMemberForm(client: Player, name: string, rank: number): void {
    const players = getPlayersForRegion(name, client);

    if(players.length < 1) {
        sendMessage(client, `${error} На сервере нету игроков кроме вас!`);
        return;
    }

    const ranks = ['Участник', 'Заместитель'];
    const countdeputy = getRegionCountDeputy(name);
    const countmembers = getRegionCountMembers(name);
    const form = new CustomForm();
    form.setTitle(`Управление регионом ${bold}${blue}${name}`);
    form.addComponent(new FormDropdown('Выберите игрока которого хотите добавить в регион', players));
    form.addComponent(new FormDropdown('Выберите должность игрока', ranks));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            regionManagerForm(client, name, rank);
        } else {
            if(players[data.response[0]] === client.getName()) {
                sendMessage(client, `${error} Как ты это сделал? #1`);
                return;
            }

            const rank = data.response[1] + 1;

            if(rank === 2 && countdeputy === 1) {
                sendMessage(client, `${error} В каждом регионе может быть только один заместитель!`);
                return;
            }

            if(countmembers === 10) {
                sendMessage(client, `${error} В каждом регионе может быть только 10 участников!`);
                return;
            }


            const target = getPlayerByName(players[data.response[0]]);
            if(target !== undefined) {
                const dist = getDistancePlayers(client, target);

                if(dist > 10) {
                    sendMessage(client, `${error} Игрок слишком далеко от вас!`);
                    return;
                }

                regionAddMemberConfirmForm(target, name, client, rank, ranks[data.response[1]]);
                sendMessage(client, `${success} Вы отправили приглашение игроку ${yellow}${players[data.response[0]]}${white} в регион ${yellow}${name}${white} как ${yellow}${ranks[data.response[1]]}${white}!`);
            } else {
                sendMessage(client, `${error} Игрок не найден! Возможно он вышел с сервера!`);
            }
        }
    });
}

export function regionAddMemberConfirmForm(client: Player, name: string, owner: Player, rank: number, rank_name: string): void {
    const form = new ModalForm();
    const owner_name = owner.getName();
    const owner_id = getPlayerIdByObject(owner);
    const client_name = client.getName();
    const client_id = getPlayerIdByObject(client);
    form.setTitle(`Приглашение в регион ${bold}${blue}${name}`);
    form.setContent(`${white}Игрок ${yellow}[${owner_id}] ${owner_name}${white} приглашает Вас в регион ${yellow}${name}${white}!\nВаша должность: ${yellow}${rank_name}${white}.\nПринять приглашение?`);
    form.setButtonConfirm(`Принять`);
    form.setButtonCancel(`Отклонить`);
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            sendMessage(client, `${info} Вы ${red}отклонили${white} приглашение в регион ${yellow}${name} ${white}от игрока ${yellow}[${owner_id}] ${owner_name}${white}!`);
            sendMessage(owner, `${info} Игрок ${yellow}[${client_id}] ${client_name} ${red}отклонил ${white}ваше приглашение в регион ${yellow}${name}${white}!`);
        } else {
            if(data.response === true) {
                sendMessage(client, `${success} Вы приняли приглашение от ${yellow}[${owner_id}] ${owner_name}${white} и теперь состоите в регионе ${yellow}${name}${white} как ${yellow}${rank_name}${white}!`);
                sendMessage(owner, `${info} Игрок ${yellow}[${client_id}] ${client_name} ${green}принял ${white}ваше приглашение в регион ${yellow}${name}${white}!`);
                addRegionMember(name, client_name, rank);
            } else {
                sendMessage(client, `${info} Вы ${red}отклонили${white} приглашение в регион ${yellow}${name}${white} от игрока ${yellow}[${owner_id}] ${owner_name}${white}!`);
                return;
            }
        }
    });
}

export function regionRemoveMemberForm(client: Player, name: string, rank: number): void {
    const players = getRegionMembers(name, client.getName());

    if(players.length === 0) {
        sendMessage(client, `${error} В регионе ${yellow}${name}${white} никто не состоит кроме Вас!`);
        return;
    }

    const form = new CustomForm();
    form.setTitle(`Управление регионом ${bold}${blue}${name}`);
    form.addComponent(new FormDropdown('Выберите игрока которого хотите удалить из региона', players));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            regionManagerForm(client, name, rank);
        } else {
            if(players[data.response[0]] === client.getName()) {
                sendMessage(client, `${error} Как ты это сделал? #2`);
                return;
            }

            removeRegionMember(name, players[data.response[0]]);
            sendMessage(client, `${success} Вы удалили игрока ${yellow}${players[data.response[0]]}${white} из региона ${yellow}${name}${white}!`);
        }
    });
}

export function regionChangeFlagForm(client: Player, name: string, rank: number): void {
    const flags = getRegionFlags(name);
    const form = new SimpleForm();
    form.setTitle(`Управление регионом ${bold}${blue}${name}`);
    form.setContent(`Нажмите на нужный флаг, чтобы ${green}включить${white} или ${red}выключить${white} его!`);
    for (let index = 0; index < flags.length; index++) {
        const flag_name = flags[index]['flag'];
        const flag_status = flags[index]['status'];
        if(flag_status === 'OFF') {
            form.addButton(new FormButton(`${flag_name} [${red}OFF${gray}]`));
        } else {
            form.addButton(new FormButton(`${flag_name} [${green}ON${gray}]`));
        }
    }

    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            regionManagerForm(client, name, rank);
        } else {
            switch (data.response) {
                case 0:
                    if(getRegionFlagStatus(name, 'pvp') === 'OFF') {
                        setRegionFlagChangeStatus(name, 'pvp', true)
                        sendMessage(client, `${success} Вы ${green}включили${white} флаг ${yellow}PVP ${white}в регионе ${yellow}${name}!`);
                    } else {
                        setRegionFlagChangeStatus(name, 'pvp', false)
                        sendMessage(client, `${success} Вы ${red}выключили${white} флаг ${yellow}PVP ${white}в регионе ${yellow}${name}!`);
                    }
                    break;

                case 1:
                    if(getRegionFlagStatus(name, 'build') === 'OFF') {
                        setRegionFlagChangeStatus(name, 'build', true)
                        sendMessage(client, `${success} Вы ${green}включили${white} флаг ${yellow}Build ${white}в регионе ${yellow}${name}!`);
                    } else {
                        setRegionFlagChangeStatus(name, 'build', false)
                        sendMessage(client, `${success} Вы ${red}выключили${white} флаг ${yellow}Build ${white}в регионе ${yellow}${name}!`);
                    }
                    break;

                case 2:
                    if(getRegionFlagStatus(name, 'use') === 'OFF') {
                        setRegionFlagChangeStatus(name, 'use', true)
                        sendMessage(client, `${success} Вы ${green}включили${white} флаг ${yellow}Use ${white}в регионе ${yellow}${name}!`);
                    } else {
                        setRegionFlagChangeStatus(name, 'use', false)
                        sendMessage(client, `${success} Вы ${red}выключили${white} флаг ${yellow}Use ${white}в регионе ${yellow}${name}!`);
                    }
                    break;

                case 3:
                    if(getRegionFlagStatus(name, 'info') === 'OFF') {
                        setRegionFlagChangeStatus(name, 'info', true)
                        sendMessage(client, `${success} Вы ${green}включили${white} флаг ${yellow}Info ${white}в регионе ${yellow}${name}!`);
                    } else {
                        setRegionFlagChangeStatus(name, 'info', false)
                        sendMessage(client, `${success} Вы ${red}выключили${white} флаг ${yellow}Info ${white}в регионе ${yellow}${name}!`);
                    }
                    break;

                case 4:
                    if(getRegionFlagStatus(name, 'send-chat') === 'OFF') {
                        setRegionFlagChangeStatus(name, 'send-chat', true)
                        sendMessage(client, `${success} Вы ${green}включили${white} флаг ${yellow}Send Chat ${white}в регионе ${yellow}${name}!`);
                    } else {
                        setRegionFlagChangeStatus(name, 'send-chat', false)
                        sendMessage(client, `${success} Вы ${red}выключили${white} флаг ${yellow}Send Chat ${white}в регионе ${yellow}${name}!`);
                    }
                    break;

                case 5:
                    if(getRegionFlagStatus(name, 'item-drop') === 'OFF') {
                        setRegionFlagChangeStatus(name, 'item-drop', true)
                        sendMessage(client, `${success} Вы ${green}включили${white} флаг ${yellow}Item Drop ${white}в регионе ${yellow}${name}!`);
                    } else {
                        setRegionFlagChangeStatus(name, 'item-drop', false)
                        sendMessage(client, `${success} Вы ${red}выключили${white} флаг ${yellow}Item Drop ${white}в регионе ${yellow}${name}!`);
                    }
                    break;
            }
            regionChangeFlagForm(client, name, rank);
        }
    });
}

export function regionRemoveConfirmForm(client: Player, name: string, rank: number): void {
    const form = new ModalForm();
    form.setTitle(`Удаление региона ${bold}${blue}${name}`);
    form.setContent(`${white}Вы действительно хотите удалить регион ${yellow}${name}${white}?\n${red}Это действие нельзя будет отменить!`);
    form.setButtonConfirm(`${red}Да, удалить навсегда!`);
    form.setButtonCancel(`Нет, я передумал!`);
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            regionManagerForm(client, name, rank);
        } else {
            if(data.response === true) {
                if(RegionRemove(client, name)) {
                    sendMessage(client, `${success} Вы удалили свой регион ${yellow}${name}${white}!`);
                } else {
                    sendMessage(client, `${error} Произошла ошибка при удалении региона ${yellow}${name}${white}! #3`);
                }
                return;
            } else {
                sendMessage(client, `${info} Вы отменили удаление региона ${yellow}${name}${white}!`);
                return;
            }
        }
    });
}

export function regionSetPriceForm(client: Player, name: string, rank: number): void {
    const form = new CustomForm();
    form.setTitle(`Продажа региона ${bold}${blue}${name}`);
    form.addComponent(new FormLabel(`${red}Внимание! ${white}Вы собираетесь выставить на продажу свой регион ${yellow}${name}${white}!\nВнимательно вводите цену!\nУчастники региона удалены не будут!`));
    form.addComponent(new FormInput('Введите цену за регион', 'Например: 123.456'));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            regionManagerForm(client, name, rank);
        } else {

            if(!parseInt(data.response[1])) {
                sendMessage(client, `${error} Неверный формат цены!`);
                return;
            }

            const price = parseInt(data.response[1]);

            if(price < 5) {
                sendMessage(client, `${error} Минимальная цена региона 5 Поликов!`);
                return;
            }

            setRegionPrice(name, price);
            sendMessage(client, `${success} Вы выставили регион ${yellow}${name}${white} на продажу за ${green}${addCommas(getRegionPrice(name).toString())}${white} Поликов!`);
            sendMessage(client, `${info} Убрать регион с продажи можно в меню региона ${yellow}/rg menu -> [название региона] -> Убрать с продажи${white}!`);
        }
    });
}

export function regionSellRemoveConfirmForm(client: Player, name: string, rank: number): void {
    const form = new ModalForm();
    form.setTitle(`Управление регионом ${bold}${blue}${name}`);
    form.setContent(`${white}Вы действительно хотите убрать с продажи регион ${yellow}${name}${white}?`);
    form.setButtonConfirm('Да, убрать с продажи');
    form.setButtonCancel('Нет, оставить на продаже');
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            regionManagerForm(client, name, rank);
        } else {
            if(data.response === true) {
                sendMessage(client, `${success} Вы убрали с продажи регион ${yellow}${name}${white}!`);
                setRegionPrice(name, 0);
                return;
            } else {
                sendMessage(client, `${info} Вы отказались убирать с продажи регион ${yellow}${name}${white}!`);
                sendMessage(client, `${info} Продажа региона ${yellow}${name}${white} сохранена!`);
                return;
            }
        }
    });
}

export function regionInfoForm(client: Player, name: string, rank: number): void {
    const form = new CustomForm();
    const desc = getRegionDescription(name);
    const owner = getRegionOwner(name);
    const deputy = getRegionMemberDeputy(name);
    const members = getRegionMembersByRank(name, 1);
    const sell = isRegionSell(name);
    const world_id = getRegionWorldId(name);
    const [posx, posy, posz] = getRegionAVGPosition(name);
    form.setTitle(`Информация о регионе ${bold}${blue}${name}`);
    form.addComponent(new FormLabel(`Название региона: [ ${yellow}${name}${white} ]`));
    form.addComponent(new FormLabel(`Описание региона: ${desc}`));
    form.addComponent(new FormLabel(`Владелец: [ ${bold}${red}${owner}${reset}${white} ]`));

    if(deputy === '') {
        form.addComponent(new FormLabel(`Заместитель: [ ${green}Свободно${white} ]`));
    } else {
        form.addComponent(new FormLabel(`Заместитель: [ ${bold}${yellow}${deputy}${reset}${white} ]`));
    }

    if(members.length === 0) {
        form.addComponent(new FormLabel(`Участники: [ ${red}Пусто${white} ]`));
    }

    if(members.length === 1) {
        form.addComponent(new FormLabel(`Участники: [ ${yellow}${members[0]}${white} ]`));
    }

    if(members.length >= 2) {
        form.addComponent(new FormLabel(`Участники: [ ${yellow}${members.join(', ')}${white} ]`));
    }

    if(sell) {
        const price = getRegionPrice(name);
        form.addComponent(new FormLabel(`Продается: [ ${green}Да${white} ]`));
        form.addComponent(new FormLabel(`Цена: [ ${yellow}${addCommas(price.toString())}${white} ]`));
    } else {
        form.addComponent(new FormLabel(`Продается: [ ${red}Нет${white} ]`));
    }

    switch (world_id) {
        case 0:
            form.addComponent(new FormLabel(`Измерение: Верхний мир`));
            break;
        case 1:
            form.addComponent(new FormLabel(`Измерение: Нижний мир (Ад)`));
            break;
        default:
            form.addComponent(new FormLabel(`Измерение: Неизвестно`));
            break;
    }

    form.addComponent(new FormLabel(`Примерные координаты региона: X: ${yellow}${posx}${white} | Y: ${yellow}${posy}${white} | Z: ${yellow}${posz}${white}`));

    const flags = getRegionFlags(name);
    const flags_data = [];

    for (let index = 0; index < flags.length; index++) {
        if(flags[index].status === 'OFF') {
            flags_data.push(`${flags[index].flag}: ${red}OFF${reset}\n`);
        } else {
            flags_data.push(`${flags[index].flag}: ${green}ON${reset}\n`);
        }
    }

    form.addComponent(new FormLabel(`Флаги:\n${flags_data.join('')}`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(rank !== 0) {
            if(data.response === null) {
                regionManagerForm(client, name, rank);
            } else {
                regionManagerForm(client, name, rank);
            }
        } else {
            if(data.response === null) {
                sendMessage(client, `${info} Примерные координаты региона ${yellow}${name}${white}: X: ${yellow}${posx}${white} | Y: ${yellow}${posy}${white} | Z: ${yellow}${posz}${white}`);
            } else {
                regionsInSellForm(client);
                sendMessage(client, `${info} Примерные координаты региона ${yellow}${name}${white}: X: ${yellow}${posx}${white} | Y: ${yellow}${posy}${white} | Z: ${yellow}${posz}${white}`);
            }
        }
    });
}

export function regionBuyOrVeiwInfo(client: Player, name: string): void {
    const form = new SimpleForm();
    form.setTitle(`Регион - ${blue}${name}`);
    form.addButton(new FormButton(`Информация о регионе`));
    form.addButton(new FormButton(`Купить регион`));
    form.addButton(new FormButton(`Назад`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            regionMainForm(client);
        } else {
            switch (data.response) {
                case 0:
                    regionInfoForm(client, name, 0);
                    break;

                case 1:
                    regionBuyConfirmForm(client, name);
                    break;

                case 2:
                    regionMainForm(client);
                    break;
            }
        }
    });
}

export function regionBuyConfirmForm(client: Player, name: string): void {
    const form = new ModalForm();
    const owner_name = getRegionOwner(name);
    const owner = getPlayerByName(owner_name);

    if(owner === client) {
        sendMessage(client, `${error} Нельзя покупать регион у самого себя!`);
        return;
    }

    const price = getRegionPrice(name);
    const percent = getPercentBank(client);
    const com = Percent_Plus(price, percent);
    const money = getMoneyBank(client);
    const client_id = getPlayerIdByObject(client);
    form.setTitle(`Регион - ${blue}${name}`);
    form.setContent(`Вы действительно хотите купить регион ${yellow}${name}${white}?\n${yellow}Цена: ${green}${addCommas(price.toString())}${white} Поликов\nКомиссия составляет ${yellow}${percent}${white} процентов!\nКомиссия: ${green}${addCommas((Percent_Plus(price, percent) - price).toString())}${white} Поликов.\nОбщая сумма к оплате: ${green}${addCommas(com.toString())}${white} Поликов.\n${red}Внимание! ${white}После покупки региона все участники кроме ${yellow}Заместителя${white} останутся на месте!`);
    form.setButtonConfirm(`Да, купить регион!`);
    form.setButtonCancel(`Нет, я отказываюсь!`);
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            regionMainForm(client);
        } else {
            if(data.response) {
                if(money < com) {
                    sendMessage(client, `${error} У вас недостаточно Поликов в банке для покупки региона! (Нужно еще: ${addCommas((com - money).toString())})`);
                    sendMessage(client, `${info} Чтобы пополнить личный банковский счет - используйте ${yellow}/money -> "Положить Полики в банк"${white}!`);
                    return;
                }

                if(!isRegionSell(name)) {
                    sendMessage(client, `${error} Данный регион уже купили или он был снять с продажи владельцем!`);
                    return;
                }

                const client_name = client.getName();
                if(owner !== undefined) {
                    addMoneyBank(owner, price);
                    addMoneyBankSql(owner_name, price)
                    sendMessage(owner, `${info} Игрок ${yellow}[${client_id}] ${client_name} ${white}купил у Вас регион ${yellow}${name}${white} за ${green}${addCommas(price.toString())}${white} Поликов!`);
                    sendMessage(owner, `${info} Используйте ${yellow}/money ${white}или ${yellow}/menu ${white}чтобы узнать свой баланс!`);
                } else {
                    addMoneyBankSql(owner_name, price);
                }

                const deputy_name = getRegionMemberDeputy(name);
                const deputy = getPlayerByName(deputy_name);
                if(deputy !== undefined) {
                    if(deputy_name !== client_name) {
                        sendMessage(deputy, `${info} Регион ${yellow}${name}${white} в котором Вы были как Заместитель, был успешно продан!`);
                        sendMessage(deputy, `${info} Вы больше не состоите в данном регионе!`);
                    }
                }

                setRegionMemberRank(name, deputy_name, 0);
                takeMoneyBank(client, com);
                setRegionOwner(name, client_name);
                setRegionPrice(name, 0);
                sendMessage(client, `${success} Поздравляем Вас с покупкой региона ${yellow}${name}${white} у игрока ${yellow}${owner_name}${white} за ${green}${addCommas(com.toString())}${white}!`);
            } else {
                regionBuyOrVeiwInfo(client, name);
            }
        }
    });
}

export function regionsInSellForm(client: Player): void {
    let count = 0;
    const form = new SimpleForm();
    form.setTitle('Список регионов на продаже');
    getRegionsInSellSql()
        .then((results) => {
            count = results.length;

            for (let index = 0; index < results.length; index++) {
                form.addButton(new FormButton(results[index]['name']));
            }

            if(results.length !== 0) {
                count = results.length;
            }

            form.addButton(new FormButton('Назад'));
            form.sendTo(client.getNetworkIdentifier(), async (data) => {
                if(data.response === null) {
                    regionMainForm(client);
                } else {
                    if(data.response === count) {
                        regionMainForm(client);
                    } else {
                        regionBuyOrVeiwInfo(client, results[data.response]['name']);
                    }
                }
            });
        })
        .catch((err) => {
            console.error(err);
        });
}

export function regionsHelpForm(client: Player, page = 0): void {
    if(page === 0) {
        const form = new SimpleForm();
        form.setTitle('Помощь по регионам');
        form.addButton(new FormButton(`Первая страница`));
        form.addButton(new FormButton(`Вторая страница`));
        form.addButton(new FormButton(`Назад`));
        form.sendTo(client.getNetworkIdentifier(), async (data) => {
            if(data.response === null) {
                regionMainForm(client);
            } else {
                switch (data.response) {
                    case 0:
                        regionsHelpForm(client, 1);
                        break;

                    case 1:
                        regionsHelpForm(client, 2);
                        break;

                    case 2:
                        regionMainForm(client);
                        break;
                }
            }
        });
    }

    if(page === 1) {
        const form = new CustomForm();
        form.setTitle(`Помощь по регионам [ ${page} / 2 ]`);
        form.addComponent(new FormLabel(`
${yellow}Что такое регион?${white}
Регион - это приватная территория, которой владеют один или несколько игроков. У каждого региона есть свои настройки в виде флагов.
${yellow}Что такое флаги региона?${white}
Это ограничения для других игроков, которые находятся на территории региона, но не состоят в нем. Например, флаг ${green}Build${white} отвечает за строительство в регионе, если он включен, то любому игроку необязательно находится в списке участниках региона, чтобы строить в нем.
${yellow}Какие флаги есть и за что они отвечают?${white}
Вот список флагов и их описания:
${green}PVP${white} - Получать урон от других игроков
${green}Build${white} - Строительство
${green}Use${white} - Что-то использовать (дверь, кровать, сундук и т.п.)
${green}Info${white} - Смотреть информацию о регионе
${green}Send Chat${white} - Писать в чат
${green}Item Drop${white} - Выбрасывать предметы
${yellow}Как создать свой регион и есть какие-то ограничения?${white}
Чтобы создать регион, нужно поставить первую точку командой ${green}/rg pos1${white}, затем вторую точку командой ${green}/rg pos2${white}, а после прописать команду ${green}/rg create [название_региона]${white} и регион будет создан!
Что касается ограничений, то они есть, каждый игрок может иметь определенное количество регионов, все зависит от его привилегий.
Имеется ограничение по размеру региона, они так же зависят от привилегий игрока.
${yellow}Как управлять своим регионом?${white}
Все легко и просто, введите команду ${green}/rg menu${white} и откроется меню, далее перейдите в раздел ${green}"Мои регионы"${white} и выберите нужный регион (если у вас их несколько), после выбора откроется меню упраления регионом.`));
        form.sendTo(client.getNetworkIdentifier(), async (data) => {
            if(data.response === null) {
                regionsHelpForm(client, 0);
            } else {
                regionsHelpForm(client, 0);
            }
        });
    }

    if(page === 2) {
        const form = new CustomForm();
        form.setTitle(`Помощь по регионам [ ${page} / 2 ]`);
        form.addComponent(new FormLabel(`
${yellow}Какие должности есть в регионе? Можно создать свои должности?${white}
Создавать свои должности нельзя. В каждом регионе есть три должности: ${red}Владелец${white}, ${green}Заместитель${white} и ${green}Участник${white}.
${red}Владелец${white} имеет полное управление регионом.
${green}Заместитель${white} имеет права Владельца, за исключением удаление и продажи региона.
${green}Участник${white} не имеет управление регионом. Все должности игнорируют флаги региона!
${yellow}Как попасть в список участников чужого региона?${white}
Для этого вам нужно найти владельца (или его заместителя) региона, а далее попросить отправить приглашение на вступление в регион. Если вам отказали, то увы, других способов нету!
${yellow}Могу ли я перенести свой регион в другое место не удаляя его?${white}
К сожалению, нет, в данный момент такой функции еще нет. Следите за новостями, возможно скоро мы это добавим!
${yellow}Могу ли я восстановить регион после его удаления?${white}
К сожалению, нет.
${yellow}Как продать регион?${white}
Все довольно просто. Чтобы выставить свой регион на продажу перейдите в меню управления региона и выберите пункт ${green}"Продать регион"${white}, а затем введите желаемую сумму за регион!
Если вы хотите снять с продажи регион, то перейдите в меню управления региона и выберите пункт ${green}"Убрать с продажи регион"${white}
${yellow}Нужно ли повторно выставлять регион на продажу после рестарта сервера?${white}
Нет, все регионы сохраняются в базе данных, поэтому Ваш регион смогу купить даже, если Вы будете не в сети (оффлайн).
${yellow}Как посмотреть, какие сейчас регионы продаются?${white}
Введите команду ${green}/rg menu${white} и перейдите в раздел ${green}"Регионы в продаже"${white}, а дальше выберите регион, который хотите купить.
В этом же разделе можно посмотреть информацию о регионе, включая его местоположение.
${yellow}Что случится с участниками региона после успешной продажи?${white}
Старого владельца заменит новый, а заместитель старого владельца будет удален из региона, все остальные участники останутся на месте.
${yellow}При покупки региона есть комиссия?${white}
Да, на игрока который покупает возлагается комиссия с определнным процентом. Процент комиссии зависит от привилегий игрока.`));
        form.sendTo(client.getNetworkIdentifier(), async (data) => {
            if(data.response === null) {
                regionsHelpForm(client, 0);
            } else {
                regionsHelpForm(client, 0);
            }
        });
    }

}