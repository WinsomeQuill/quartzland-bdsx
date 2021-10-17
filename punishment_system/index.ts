import { Player } from "bdsx/bds/player";
import { events } from "bdsx/event";
import { playerLog } from "../logs";
import { broadcastMessage, broadcastMessageOnlyAdmins, error, getAdminLevel, getMuteByObject,
    getPlayerByIdOrName, getPlayerByName, getPlayerIdByName, getPlayerIdByObject, getTime, getTimeFormat, getWarnCountByObject,
    red, sendMessage, setMuteByObject, setWarnByObject, setWarnCountByObject, white, yellow } from "../management/index";
import { addBanSql, addMuteSql, addWarnSql, getBanSql, getMuteSql, getWarnSql, isInDb,
    removeBanSql, removeMuteSql, removeWarnSql, setBanSql, setMuteSql, setWarnSql } from "../sqlmanager";
import { banForm, kickForm, muteForm, warnForm } from "./forms";

events.serverOpen.on(()=>{
    console.log('[+] Punishment System enabled!');
});

events.serverClose.on(()=>{
    console.log('[-] Punishment System disabled!');
});

events.command.on((cmd, origin, ctx) => {
    const label = ctx.command.split(' ');
    const client = getPlayerByName(origin);
    if(client instanceof Player) {
        const client_id = getPlayerIdByName(origin);
        if(label[0] === '/skick') {
            if(getAdminLevel(client) < 3) {
                return;
            }

            if(label.length < 3) {
                sendMessage(client, `${error} Используйте /skick [ник игрока/id игрока] [причина]!`);
                return;
            }

            const target_client = getPlayerByIdOrName(label[1]);
            if(target_client === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            if(target_client === client) {
                sendMessage(client, `${error} Нельзя выдавать наказания самому себе!`);
                return;
            }

            const target_id = getPlayerIdByObject(target_client);
            const target_name = target_client.getName();
            const client_name = client.getName();
            const mute_end = getTime().add(label[2], 'minutes');
            const msg: string = label.slice(2).join(' ');

            setMuteByObject(target_client, mute_end);
            playerLog(client_name, `Тихо кикнул игрока ${target_name}! Причина: ${msg}.`);
            playerLog(target_name, `Тихо кикнут администратором ${client_name}! Причина: ${msg}.`);
            broadcastMessageOnlyAdmins(`${yellow}Администратор [${client_id}] ${client_name} тихо кикнул игрока [${target_id}] ${target_name}! Причина: ${msg}.`);
            kickForm(target_client, `[${client_id}] ${client_name}`, getTimeFormat(), msg);
            return;
        }

        if(label[0] === '/kick') {
            if(getAdminLevel(client) < 1) {
                return;
            }

            if(label.length < 3) {
                sendMessage(client, `${error} Используйте /kick [ник игрока/id игрока] [причина]!`);
                return;
            }

            const target_client = getPlayerByIdOrName(label[1]);
            if(target_client === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            if(target_client === client) {
                sendMessage(client, `${error} Нельзя выдавать наказания самому себе!`);
                return;
            }

            const target_id = getPlayerIdByObject(target_client);
            const target_name = target_client.getName();
            const client_name = client.getName();
            const mute_end = getTime().add(label[2], 'minutes');
            const msg: string = label.slice(2).join(' ');

            setMuteByObject(target_client, mute_end);
            playerLog(client_name, `Кикнул игрока ${target_name}! Причина: ${msg}.`);
            playerLog(target_name, `Кикнут администратором ${client_name}! Причина: ${msg}.`);
            broadcastMessage(`${red}Администратор [${client_id}] ${client_name} кикнул игрока [${target_id}] ${target_name}! Причина: ${msg}.`);
            kickForm(target_client, `[${client_id}] ${client_name}`, getTimeFormat(), msg);
            return;
        }

        if(label[0] === '/mute') {
            if(getAdminLevel(client) < 1) {
                return;
            }

            if(label.length < 4) {
                sendMessage(client, `${error} Используйте /mute [ник игрока/id игрока] [минуты] [причина]!`);
                return;
            }

            const time = parseInt(label[2]);
            if(isNaN(time)) {
                sendMessage(client, `${error} Время указывается в минутах!`);
                return;
            }

            if(time <= 0) {
                sendMessage(client, `${error} Неверный формат времени!`);
                return;
            }

            const target_client = getPlayerByIdOrName(label[1]);
            if(target_client === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            if(target_client === client) {
                sendMessage(client, `${error} Нельзя выдавать наказания самому себе!`);
                return;
            }

            const mute = getMuteByObject(target_client);
            if(mute !== null) {
                if(getTime().isBefore(mute)) {
                    sendMessage(client, `${error} У игрока уже заблокирован чат!`);
                    return;
                }
            }

            const target_id = getPlayerIdByObject(target_client);
            const target_name = target_client.getName();
            const client_name = client.getName();
            const mute_end = getTime().add(label[2], 'minutes');
            const msg: string = label.slice(3).join(' ');
            getMuteSql(target_name)
                .then((result) => {
                    if(result[0] !== undefined && result[0] !== null) {
                        setMuteSql(target_name, client_name, getTime().toDate(), mute_end.toDate(), msg);
                    } else {
                        addMuteSql(target_name, client_name, getTime().toDate(), mute_end.toDate(), msg);
                    }

                    playerLog(client_name, `Выдал блокировку чата игроку ${target_name} на ${label[2]} минут! Причина: ${msg}.`);
                    playerLog(target_name, `Администратор ${client_name} выдал блокировку чата на ${label[2]} минут! Причина: ${msg}.`);
                    setMuteByObject(target_client, mute_end);
                    broadcastMessage(`${red}Администратор [${client_id}] ${client_name} выдал блокировку чата игроку [${target_id}] ${target_name} на ${label[2]} минут! Причина: ${msg}.`);
                    muteForm(target_client, `[${client_id}] ${client_name}`, getTimeFormat(), mute_end.format('YYYY-MM-DD hh:mm:ss'), mute_end.diff(getTime(), 'minutes'), msg);
                })
                .catch(err => {
                    console.error(err);
                });
            return;
        }

        if(label[0] === '/offmute') {
            if(getAdminLevel(client) < 2) {
                return;
            }

            if(label.length < 4) {
                sendMessage(client, `${error} Используйте /offmute [ник игрока] [минуты] [причина]!`);
                return;
            }

            const time = parseInt(label[2]);
            if(isNaN(time)) {
                sendMessage(client, `${error} Время указывается в минутах!`);
                return;
            }

            if(time <= 0) {
                sendMessage(client, `${error} Неверный формат времени!`);
                return;
            }



            const target_name = label[1];
            isInDb(target_name)
                .then((result_db) => {
                    if(result_db[0] === null || result_db[0] === undefined) {
                        sendMessage(client, `${error} Игрок ${yellow}${target_name}${white} не найден в базе данных!`);
                        return;
                    }

                    getMuteSql(target_name)
                        .then((result) => {
                            if(result[0] === null || result[0] === undefined) {
                                sendMessage(client, `${error} У игрока ${yellow}${target_name}${white} не заблокирован чат!`);
                                return;
                            }

                            if(getTime().isBefore(result[0]['mute_end'])) {
                                sendMessage(client, `${error} У игрока ${yellow}${target_name}${white} уже заблокирован чат!`);
                                return;
                            }

                            const client_name = client.getName();
                            const mute_end = getTime().add(label[2], 'minutes');
                            const msg: string = label.slice(3).join(' ');

                            if(result[0] !== undefined && result[0] !== null) {
                                setMuteSql(target_name, client_name, getTime().toDate(), mute_end.toDate(), msg);
                            } else {
                                addMuteSql(target_name, client_name, getTime().toDate(), mute_end.toDate(), msg);
                            }

                            playerLog(client_name, `Выдал в оффлайне блокировку чата игроку ${target_name} на ${label[2]} минут! Причина: ${msg}.`);
                            playerLog(target_name, `Администратор ${client_name} выдал в оффлайне блокировку чата на ${label[2]} минут! Причина: ${msg}.`);
                            broadcastMessage(`${red}Администратор [${client_id}] ${client_name} выдал в оффлайне блокировку чата игроку ${target_name} на ${label[2]} минут! Причина: ${msg}.`);
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                })
                .catch((err) => {
                    console.error(err);
                });
            return;
        }

        if(label[0] === '/unmute') {
            if(getAdminLevel(client) < 1) {
                return;
            }

            if(label.length < 3) {
                sendMessage(client, `${error} Используйте /unmute [ник игрока/id игрока] [причина]!`);
                return;
            }

            const target_client = getPlayerByIdOrName(label[1]);
            if(target_client === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            const mute = getMuteByObject(target_client);
            if(mute === null) {
                sendMessage(client, `${error} У игрока не заблокирован чат!`);
                return;
            }

            if(!getTime().isBefore(mute)) {
                sendMessage(client, `${error} У игрока не заблокирован чат!`);
                return;
            }

            const target_id = getPlayerIdByObject(target_client);
            const target_name = target_client.getName();
            const client_name = client.getName();
            const msg: string = label.slice(2).join(' ');

            playerLog(client_name, `снял блокировку чата игроку ${target_name}! Причина: ${msg}.`);
            playerLog(target_name, `Администратор ${client_name} снял блокировку чата! Причина: ${msg}.`);
            removeMuteSql(target_name);
            setMuteByObject(target_client, getTime());
            broadcastMessage(`${red}Администратор [${client_id}] ${client_name} снял блокировку чата игроку [${target_id}] ${target_name}! Причина: ${msg}.`);
            return;
        }

        if(label[0] === '/unoffmute') {
            if(getAdminLevel(client) < 2) {
                return;
            }

            if(label.length < 3) {
                sendMessage(client, `${error} Используйте /unoffmute [ник игрока] [причина]!`);
                return;
            }


            const target_name = label[1];
            isInDb(target_name)
                .then((result_db) => {
                    if(result_db[0] === null || result_db[0] === undefined) {
                        sendMessage(client, `${error} Игрок ${yellow}${target_name}${white} не найден в базе данных!`);
                        return;
                    }

                    getMuteSql(target_name)
                        .then((mute) => {
                            if(mute[0] === undefined || mute[0] === null) {
                                sendMessage(client, `${error} У игрока не заблокирован чат!`);
                                return;
                            }

                            if(!getTime().isBefore(mute)) {
                                sendMessage(client, `${error} У игрока не заблокирован чата!`);
                                return;
                            }

                            const client_name = client.getName();
                            const msg: string = label.slice(2).join(' ');

                            playerLog(client_name, `В оффлайне снял блокировку чата игроку ${target_name}! Причина: ${msg}.`);
                            playerLog(target_name, `Администратор ${client_name} в оффлайне снял блокировку чата! Причина: ${msg}.`);
                            removeMuteSql(target_name);
                            broadcastMessage(`${red}Администратор [${client_id}] ${client_name} в оффлайне снял блокировку чата игроку ${target_name}! Причина: ${msg}.`);
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                })
                .catch((err) => {
                    console.error(err);
                });

        }

        if(label[0] === '/ban') {
            if(getAdminLevel(client) < 3) {
                return;
            }

            if(label.length < 4) {
                sendMessage(client, `${error} Используйте /ban [ник игрока/id игрока] [дни] [причина]!`);
                return;
            }

            const time = parseInt(label[2]);
            if(isNaN(time)) {
                sendMessage(client, `${error} Время указывается в днях!`);
                return;
            }

            if(time <= 0) {
                sendMessage(client, `${error} Неверный формат времени!`);
                return;
            }

            const target_client = getPlayerByIdOrName(label[1]);
            if(target_client === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            if(target_client === client) {
                sendMessage(client, `${error} Нельзя выдавать наказания самому себе!`);
                return;
            }


            const target_name = target_client.getName();
            getBanSql(target_name)
                .then((result) => {
                    const target_id = getPlayerIdByObject(target_client);
                    const client_name = client.getName();
                    const ban_end = getTime().add(label[2], 'days');
                    const msg: string = label.slice(3).join(' ');

                    if(result[0] !== undefined && result[0] !== null) {
                        setBanSql(target_name, client_name, getTime().toDate(), ban_end.toDate(), msg);
                    } else {
                        addBanSql(target_name, client_name, getTime().toDate(), ban_end.toDate(), msg);
                    }

                    playerLog(client_name, `Заблокировал игрока ${target_name} на ${label[2]} дней! Причина: ${msg}.`);
                    playerLog(target_name, `Администратор ${client_name} заблокировал на ${label[2]} дней! Причина: ${msg}.`);
                    broadcastMessage(`${red}Администратор [${client_id}] ${client_name} заблокировал игрока [${target_id}] ${target_name} на ${label[2]} дней! Причина: ${msg}.`);
                    banForm(target_client, `[${client_id}] ${client_name}`, getTimeFormat(), ban_end.format('YYYY-MM-DD hh:mm:ss'), ban_end.diff(getTime(), 'days') + 1, msg);
                })
                .catch((err) => {
                    console.error(err);
                });
            return;
        }

        if(label[0] === '/offban') {
            if(getAdminLevel(client) < 4) {
                return;
            }

            if(label.length < 4) {
                sendMessage(client, `${error} Используйте /offban [ник игрока] [дни] [причина]!`);
                return;
            }

            const time = parseInt(label[2]);
            if(isNaN(time)) {
                sendMessage(client, `${error} Время указывается в днях!`);
                return;
            }

            if(time <= 0) {
                sendMessage(client, `${error} Неверный формат времени!`);
                return;
            }


            const target_name = label[1];
            getMuteSql(target_name)
                .then((result_db) => {
                    if(result_db[0] === null || result_db[0] === undefined) {
                        sendMessage(client, `${error} Игрок ${yellow}${target_name}${white} не найден в базе данных!`);
                        return;
                    }

                    getBanSql(target_name)
                        .then((result) => {
                            if(result[0] === null || result[0] === undefined) {
                                sendMessage(client, `${error} У игрока ${yellow}${target_name}${white} не заблокирован аккаунт!`);
                                return;
                            }

                            if(getTime().isBefore(result[0]['ban_end'])) {
                                sendMessage(client, `${error} У игрока ${yellow}${target_name}${white} уже заблокирован аккаунт!`);
                                return;
                            }

                            const client_name = client.getName();
                            const ban_end = getTime().add(label[2], 'minutes');
                            const msg: string = label.slice(3).join(' ');

                            if(result[0] !== undefined && result[0] !== null) {
                                setBanSql(target_name, client_name, getTime().toDate(), ban_end.toDate(), msg);
                            } else {
                                addBanSql(target_name, client_name, getTime().toDate(), ban_end.toDate(), msg);
                            }

                            playerLog(client_name, `В оффлайне заблокировал игрока ${target_name} на ${label[2]} дней! Причина: ${msg}.`);
                            playerLog(target_name, `Администратор ${client_name} в оффлайне заблокировал на ${label[2]} дней! Причина: ${msg}.`);
                            broadcastMessage(`${red}Администратор [${client_id}] ${client_name} в оффлайне заблокировал игрока ${target_name} на ${label[2]} дней! Причина: ${msg}.`);
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                })
                .catch((err) => {
                    console.error(err);
                });

            return;
        }

        if(label[0] === '/unban') {
            if(getAdminLevel(client) < 3) {
                return;
            }

            if(label.length < 3) {
                sendMessage(client, `${error} Используйте /unban [ник игрока] [причина]!`);
                return;
            }

            const target_name = label[1];
            isInDb(target_name)
                .then((result_db) => {
                        if(result_db[0] === null || result_db[0] === undefined) {
                            sendMessage(client, `${error} Игрок ${yellow}${target_name}${white} не найден в базе данных!`);
                            return;
                        }

                        getBanSql(target_name)
                            .then((ban) => {
                                if(ban[0] === undefined || ban[0] === null) {
                                    sendMessage(client, `${error} У игрока не заблокирован аккаунт!`);
                                    return;
                                }

                                if(!getTime().isBefore(ban)) {
                                    sendMessage(client, `${error} У игрока не заблокирован аккаунта!`);
                                    return;
                                }

                                const client_name = client.getName();
                                const msg: string = label.slice(2).join(' ');

                                playerLog(client_name, `Снял блокировку аккаунта игроку ${target_name}! Причина: ${msg}.`);
                                playerLog(target_name, `Администратор ${client_name} снял блокировку аккаунта! Причина: ${msg}.`);
                                removeBanSql(target_name);
                                broadcastMessage(`${red}Администратор [${client_id}] ${client_name} снял блокировку аккаунта игроку ${target_name}! Причина: ${msg}.`);
                            })
                            .catch((err) => {
                                console.error(err);
                            });
                    })
                .catch((err) => {
                    console.error(err);
                });

            return;
        }

        if(label[0] === '/warn') {
            if(getAdminLevel(client) < 3) {
                return;
            }

            if(label.length < 4) {
                sendMessage(client, `${error} Используйте /warn [ник игрока/id игрока] [дни] [причина]!`);
                return;
            }

            const time = parseInt(label[2]);
            if(isNaN(time)) {
                sendMessage(client, `${error} Время указывается в днях!`);
                return;
            }

            if(time <= 0) {
                sendMessage(client, `${error} Неверный формат времени!`);
                return;
            }

            const target_client = getPlayerByIdOrName(label[1]);
            if(target_client === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            if(target_client === client) {
                sendMessage(client, `${error} Нельзя выдавать наказания самому себе!`);
                return;
            }
            let warn_count = getWarnCountByObject(target_client);

            if(warn_count === null) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            warn_count += 1;


            const target_id = getPlayerIdByObject(target_client);
            const target_name = target_client.getName();
            const client_name = client.getName();
            const msg: string = label.slice(3).join(' ');

            if(warn_count >= 3) {
                getBanSql(target_name)
                    .then((result) => {
                        const ban_end = getTime().add('14', 'days');

                        if(result[0] !== undefined && result[0] !== null) {
                            setBanSql(target_name, client_name, getTime().toDate(), ban_end.toDate(), '3 из 3 предупреждения');
                        } else {
                            addBanSql(target_name, client_name, getTime().toDate(), ban_end.toDate(), '3 из 3 предупреждения');
                        }

                        playerLog(client_name, `Выдал предупреждение игроку ${target_name} [${warn_count} / 3]! Причина: ${msg}.`);
                        playerLog(target_name, `Администратор ${client_name} выдал предупреждение [${warn_count} / 3]! Причина: ${msg}.`);
                        playerLog(client_name, `Заблокировал игрока ${target_name} на 14 дней! Причина: 3 из 3 предупреждения.`);
                        playerLog(target_name, `Администратор ${client_name} Заблокировал на 14 дней! Причина: 3 из 3 предупреждения.`);
                        setWarnSql(target_name, client_name, getTime().toDate(), getTime().toDate(), msg, 0);
                        broadcastMessage(`${red}Администратор [${client_id}] ${client_name} выдал предупреждение игроку [${target_id}] ${target_name} [${warn_count} / 3]! Причина: ${msg}.`);
                        broadcastMessage(`${red}Администратор [${client_id}] ${client_name} заблокировал игрока [${target_id}] ${target_name} на 14 дней! Причина: 3 из 3 предупреждения.`);
                        banForm(target_client, `[${client_id}] ${client_name}`, getTimeFormat(), ban_end.format('YYYY-MM-DD hh:mm:ss'), ban_end.diff(getTime(), 'days') + 1, msg);
                    })
                    .catch((err) => {
                        console.error(err);
                    });
                return;
            }

            let warn_end = getTime().add(label[2], 'days');
            setWarnByObject(target_client, warn_end);
            setWarnCountByObject(target_client, warn_count);

            getWarnSql(target_name)
                .then((result) => {
                    if(warn_count !== null) {
                        if(result[0] !== undefined && result[0] !== null) {
                            if(warn_count === 2) {
                                warn_end = getTime(result[0]['warn_end']).add(label[2], 'days');
                                setWarnSql(target_name, client_name, getTime().toDate(), warn_end.toDate(), msg, warn_count);
                            } else {
                                setWarnSql(target_name, client_name, getTime().toDate(), warn_end.toDate(), msg, warn_count);
                            }

                        } else {
                            addWarnSql(target_name, client_name, getTime().toDate(), warn_end.toDate(), msg, warn_count);
                        }

                        playerLog(client_name, `Выдал предупреждение игроку ${target_name} на ${label[2]} дней [${warn_count} / 3]! Причина: ${msg}.`);
                        playerLog(target_name, `Администратор ${client_name} выдал предупреждение на ${label[2]} дней [${warn_count} / 3]! Причина: ${msg}.`);
                        broadcastMessage(`${red}Администратор [${client_id}] ${client_name} выдал предупреждение игроку [${target_id}] ${target_name} [${warn_count} / 3]! Причина: ${msg}.`);
                        warnForm(target_client, `[${client_id}] ${client_name}`, getTimeFormat(), warn_end.format('YYYY-MM-DD hh:mm:ss'), warn_end.diff(getTime(), 'days') + 1, msg, warn_count);
                    }
                })
                .catch((err) => {
                    console.error(err);
                });
            return;
        }

        if(label[0] === '/unwarn') {
            if(getAdminLevel(client) < 3) {
                return;
            }

            if(label.length < 3) {
                sendMessage(client, `${error} Используйте /unwarn [ник игрока/id игрока] [причина]!`);
                return;
            }

            const target_client = getPlayerByIdOrName(label[1]);
            if(target_client === undefined) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            let warn_count = getWarnCountByObject(target_client);

            if(warn_count === null) {
                sendMessage(client, `${error} Игрок не найден!`);
                return;
            }

            warn_count -= 1;

            const target_id = getPlayerIdByObject(target_client);
            const target_name = target_client.getName();
            const client_name = client.getName();
            const msg: string = label.slice(3).join(' ');

            setWarnByObject(target_client, getTime());
            setWarnCountByObject(target_client, warn_count);
            removeWarnSql(target_name, 1);

            playerLog(client_name, `Снял предупреждение игроку ${target_name} [${warn_count} / 3]! Причина: ${msg}.`);
            playerLog(target_name, `Администратор ${client_name} снял предупреждение [${warn_count} / 3]! Причина: ${msg}.`);
            broadcastMessage(`${red}Администратор [${client_id}] ${client_name} снял предупреждение игроку [${target_id}] ${target_name} [${warn_count} / 3]! Причина: ${msg}.`);
            return;
        }

        if(label[0] === '/offwarn') {
            if(getAdminLevel(client) < 4) {
                return;
            }

            if(label.length < 4) {
                sendMessage(client, `${error} Используйте /offwarn [ник игрока] [дни] [причина]!`);
                return;
            }

            const time = parseInt(label[2]);
            if(isNaN(time)) {
                sendMessage(client, `${error} Время указывается в днях!`);
                return;
            }

            if(time <= 0) {
                sendMessage(client, `${error} Неверный формат времени!`);
                return;
            }

                const target_name = label[1];

                isInDb(target_name)
                    .then((result_db) => {
                        if(result_db[0] === null || result_db[0] === undefined) {
                            sendMessage(client, `${error} Игрок ${yellow}${target_name}${white} не найден в базе данных!`);
                            return;
                        }

                    getBanSql(target_name)
                        .then((result) => {
                                if(result[0] !== null && result[0] !== undefined) {
                                    if(getTime().isBefore(result[0]['ban_end'])) {
                                        sendMessage(client, `${error} У игрока ${yellow}${target_name}${white} уже заблокирован аккаунт!`);
                                        return;
                                    }
                                }

                            getWarnSql(target_name)
                                .then((result_warn) => {
                                    const client_name = client.getName();
                                    const msg: string = label.slice(3).join(' ');
                                    let warn_end = getTime().add(label[2], 'minutes');

                                    if(result[0] !== undefined && result[0] !== null) {

                                        const warn_count = result_warn[0]['warn_count'] + 1;
                                        if(warn_count >= 3) {
                                            const ban_end = getTime().add('14', 'days');

                                            if(result[0] !== undefined && result[0] !== null) {
                                                setBanSql(target_name, client_name, getTime().toDate(), ban_end.toDate(), '3 из 3 предупреждения');
                                            } else {
                                                addBanSql(target_name, client_name, getTime().toDate(), ban_end.toDate(), '3 из 3 предупреждения');
                                            }

                                            playerLog(client_name, `В оффлайне выдал предупреждение игроку ${target_name} на ${label[2]} дней [${warn_count} / 3]! Причина: ${msg}.`);
                                            playerLog(target_name, `Администратор ${client_name} В оффлайне выдал предупреждение на ${label[2]} дней [${warn_count} / 3]! Причина: ${msg}.`);
                                            playerLog(client_name, `В оффлайне заблокировал игрока ${target_name} на 14 дней! Причина: 3 из 3 предупреждения.`);
                                            playerLog(target_name, `Администратор ${client_name} в оффлайне заблокировал на 14 дней! Причина: 3 из 3 предупреждения.`);
                                            setWarnSql(target_name, client_name, getTime().toDate(), getTime().toDate(), msg, 0);
                                            broadcastMessage(`${red}Администратор [${client_id}] ${client_name} в оффлайне выдал предупреждение игроку ${target_name} [${warn_count} / 3]! Причина: ${msg}.`);
                                            broadcastMessage(`${red}Администратор [${client_id}] ${client_name} в оффлайне заблокировал игрока ${target_name} на 14 дней! Причина: 3 из 3 предупреждения.`);
                                            return;
                                        }

                                        if(warn_count === 2) {
                                            warn_end = getTime(result[0]['warn_end']).add(label[2], 'days');
                                            setWarnSql(target_name, client_name, getTime().toDate(), warn_end.toDate(), msg, warn_count);
                                        } else {
                                            setWarnSql(target_name, client_name, getTime().toDate(), warn_end.toDate(), msg, warn_count);
                                        }

                                        playerLog(client_name, `Выдал предупреждение игроку ${target_name} на ${label[2]} дней [${warn_count} / 3]! Причина: ${msg}.`);
                                        playerLog(target_name, `Администратор ${client_name} выдал предупреждение на ${label[2]} дней [${warn_count} / 3]! Причина: ${msg}.`);
                                        broadcastMessage(`${red}Администратор [${client_id}] ${client_name} в оффлайне выдал предупреждение игроку ${target_name} [${warn_count} / 3]! Причина: ${msg}.`);
                                    } else {
                                        playerLog(client_name, `Выдал предупреждение игроку ${target_name} на ${label[2]} дней [1 / 3]! Причина: ${msg}.`);
                                        playerLog(target_name, `Администратор ${client_name} выдал предупреждение на ${label[2]} дней [1 / 3]! Причина: ${msg}.`);
                                        addWarnSql(target_name, client_name, getTime().toDate(), warn_end.toDate(), msg, 1);
                                        broadcastMessage(`${red}Администратор [${client_id}] ${client_name} в оффлайне выдал предупреждение игроку ${target_name} [1 / 3]! Причина: ${msg}.`);
                                    }
                                })
                                .catch((err) => {
                                    console.error(err);
                                });
                        })
                        .catch((err) => {
                            console.error(err);
                        });
                })
                .catch((err) => {
                    console.error(err);
                });

            return;
        }

        if(label[0] === '/unoffwarn') {
            if(getAdminLevel(client) < 4) {
                return;
            }

            if(label.length < 3) {
                sendMessage(client, `${error} Используйте /unoffwarn [ник игрока] [причина]!`);
                return;
            }


                const target_name = label[1];
                isInDb(target_name)
                    .then((result_db) => {
                        if(result_db[0] === null || result_db[0] === undefined) {
                            sendMessage(client, `${error} Игрок ${yellow}${target_name}${white} не найден в базе данных!`);
                            return;
                        }

                        getWarnSql(target_name)
                            .then((warn) => {
                                if(warn[0] === undefined || warn[0] === null) {
                                    sendMessage(client, `${error} У игрока нету предупреждений!`);
                                    return;
                                }

                                const warn_time = warn[0]['warn_end'];
                                if(!getTime().isBefore(warn_time)) {
                                    sendMessage(client, `${error} У игрока истекли все предупреждения!`);
                                    return;
                                }

                                const warn_count = warn[0]['warn_count'] - 1;
                                const client_name = client.getName();
                                const msg: string = label.slice(2).join(' ');

                                playerLog(client_name, `Снял 1 предупреждение игроку ${target_name} [${warn_count} / 3]! Причина: ${msg}.`);
                                playerLog(target_name, `Администратор ${client_name} снял 1 предупреждение [${warn_count} / 3]! Причина: ${msg}.`);
                                removeWarnSql(target_name, 1);
                                broadcastMessage(`${red}Администратор [${client_id}] ${client_name} в оффлайне снял 1 предупреждение игроку ${target_name} [${warn_count} / 3]! Причина: ${msg}.`);
                                return;
                            })
                            .catch((err) => {
                                console.error(err);
                            });
                    })
                    .catch((err) => {
                        console.error(err);
                    });
        }
        return;
    }
});