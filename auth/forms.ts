import { CustomForm, FormInput, FormLabel } from "bdsx/bds/form";
import { Player } from "bdsx/bds/player";
import { blue, bold, getPlayerIdByObject, green, kick, red, reset, sendMessage, sendTip, sendSubtitle, setAuthorized, setLevel, setMoneyCache, setPercentCache, success, white, yellow, networkkick, sendTitle, getTime, setAccountInfo, addCommas, isVip, getAdminLevel, info, broadcastMessageOnlyAdmins, gold, dark_blue, light_blue, bcryptHashed, bcryptHashCompare, getTimeFormat, getInfoBarStatus, setRpgRandomMod } from "../management/index";
import { createAccountSql, createJobProfile, getClanAndRankByMemberSql, getHomeSql, getInfoBarStatusSql, getJobSql, getMuteSql, getRpgElementsSql, getSyncAccountSql, getWarnSql, removeWarnSql, setVipEndSql, setVipLevelSql } from "../sqlmanager";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { playerLog } from "../logs";
import { Vec3 } from "bdsx/bds/blockpos";
import { rpgInitItems } from "../rpg/inventory";

export function regForm(client: Player, description = `У вас есть ${red}30${white} секунд, чтобы зарегистрироватся!`,
    x1: number, y1: number, z1: number, timer: NodeJS.Timeout): void {
    const form = new CustomForm();
    form.setTitle('Регистрация');
    form.addComponent(new FormLabel(`Регистрация на проекте ${bold}Quartz${blue}Land${reset}\n${description}`));
    form.addComponent(new FormInput('Придумайте пароль'));
    form.addComponent(new FormInput('Повторите пароль'));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            regForm(client, `${red}Заполните все поля!`, x1, y1, z1, timer);
        } else {
            const pas1: string = data.response[1];
            const pas2: string = data.response[2];
            if(pas1 !== pas2) {
                regForm(client, `${red}Пароли не совпадают!`, x1, y1, z1, timer);
            } else {
                if(pas1.length < 6 || pas2.length < 6 || pas1.length > 20 || pas2.length > 20) {
                    regForm(client, `${red}Пароль должен быть длинной не менее 6 и не более 20 символов!`, x1, y1, z1, timer);
                } else {
                    const client_name = client.getName();
                    createAccountSql(client_name, bcryptHashed(pas1));
                    const jobs = ['miner', 'builder', 'killer', 'treecutter', 'gardener'];
                    for (let index = 0; index < jobs.length; index++) {
                        createJobProfile(client_name, jobs[index]);
                    }

                    setRpgRandomMod(client);
                    clearTimeout(timer);
                    const client_id = getPlayerIdByObject(client);
                    client.setScoreTag(`ID: ${client_id} | Level: 1`);
                    client.setGameType(0);
                    setAuthorized(client, true);
                    setLevel(client, 1);
                    setMoneyCache(client, 100);
                    setPercentCache(client, 15);
                    sendTitle(client, 'WELCOME');
                    sendSubtitle(client, `TO QUARTZ${blue}LAND${white}`);
                    sendTip(client, `${green}Hello, ${blue}${client_name}${green}!`);
                    sendMessage(client, `${success} Вы зарегистрировались! Желаем приятной игры!`);
                    playerLog(client_name, `Зарегистрировался!`);
                }
            }
        }
    });
}

export function authForm(client: Player, description = `У вас есть ${red}30 секунд${white}, чтобы авторизоваться!`,
    password: string, count = 1, x1: number, y1: number, z1: number, timer: NodeJS.Timeout): void {
    const form = new CustomForm();
    form.setTitle('Авторизация');
    form.addComponent(new FormLabel(`Авторизация на проекте ${bold}Quartz${blue}Land${reset}\n${description}`));
    form.addComponent(new FormInput('Введите пароль'));
    form.sendTo(client.getNetworkIdentifier(), (data) => {
        const client_name = client.getName();
        if(count === 3) {
            playerLog(client_name, `Вышел с сервера! Причина: Неверный пароль [ 3 / 3 ]!`);
            client.teleport(Vec3.create(x1, y1, z1));
            kick(client, `${yellow} Вы ввели неверный пароль [ 3 / 3 ]`);
            clearTimeout(timer);
            return;
        }

        if(count === 0) {
            count = 1;
        }

        if(data.response === null) {
            authForm(client, `${red}Неверный пароль! [ ${count} / 3 ]`, password, count += 1, x1, y1, z1, timer);
        } else {
            const pas1: string = data.response[1];
            if(bcryptHashCompare(pas1, password) === false) {
                authForm(client, `${red}Неверный пароль! [ ${count} / 3 ]`, password, count += 1, x1, y1, z1, timer)
            } else {
                getJobSql(client_name)
                    .then((job) => {
                        if(job[0] === undefined) {
                            const jobs = ['miner', 'builder', 'killer', 'treecutter', 'gardener'];
                            for (let index = 0; index < jobs.length; index++) {
                                createJobProfile(client_name, jobs[index]);
                            }
                        }
                    })
                    .catch((err) => {
                        console.error(err);
                    });

                const client_id = getPlayerIdByObject(client);
                let level = 1;
                let exp = 0;
                let mute_end: any = null;
                let warn_end: any = null;
                let AdmLvl = 0;
                let vip_lvl = 0;
                let vip_end: any = null;
                let job_name: any = null;
                let clan_name: any = null;
                let home_x = 0;
                let home_y = 0;
                let home_z = 0;
                let job_level = 0;
                let job_exp = 0;
                let warn_count = 0;
                let rpg_info_bar = "ON";
                let rpg_evolution = 0;
                let rpg_augmentation = 0;
                let rpg_mod = "";
                let rpg_mod_level = 0;
                let rpg_mod_2 = "";
                let rpg_mod_2_level = 0;
                let money = 0;
                let bank = 0;
                let donate = 0;

                getSyncAccountSql(client_name)
                    .then((data) => {
                        if(data[0]['VipEnd'] !== undefined && data[0]['VipEnd'] !== null) {
                            const time = getTime(data[0]['VipEnd']);
                            const time_format = getTimeFormat(data[0]['VipEnd']);
                            if(time_format !== "1997-01-01 00:00:00") {
                                if(isVip(client, time)) {
                                    vip_end = time;
                                } else {
                                    vip_end = null;
                                    setVipLevelSql(client_name, 0);
                                    setVipEndSql(client_name, null);
                                }
                            } else {
                                vip_lvl = 0;
                                vip_end = null;
                            }
                        }

                        if(data[0]['job_status'] !== null) {
                            job_name = data[0]['job_name'];
                            job_level = data[0]['job_level'];
                            job_exp = data[0]['job_exp'];
                        }

                        money = data[0]['money'];
                        bank = data[0]['bank'];
                        level = data[0]['level'];
                        exp = data[0]['exp'];
                        AdmLvl = data[0]['AdmLvl'];
                        donate = data[0]['donate'];

                        getClanAndRankByMemberSql(client_name)
                            .then((clan) => {
                                if(clan[0] !== undefined && clan[0] !== null) {
                                    clan_name = clan[0]['name'];
                                }

                                getMuteSql(client_name)
                                    .then((mute) => {
                                        if(mute[0] !== undefined && mute[0] !== null) {
                                            if(mute[0]['mute_end'] !== undefined) {
                                                mute_end = getTime(mute[0]['mute_end']);
                                            }
                                        }

                                        getWarnSql(client_name)
                                            .then((warn) => {
                                                if(warn[0] !== undefined && warn[0] !== null) {
                                                    if(warn[0]['warn_count'] !== undefined && warn[0]['warn_end'] !== undefined) {
                                                        if(!getTime().isBefore(warn[0]['warn_end'])) {
                                                            removeWarnSql(client_name, 3);
                                                            warn_end = null;
                                                            warn_count = 0;
                                                        }
                                                    } else {
                                                        if(warn[0]['warn_end'] !== undefined) {
                                                            warn_end = getTime(warn[0]['warn_end']);
                                                        }

                                                        if(warn[0]['warn_count'] !== undefined) {
                                                            warn_count = warn[0]['warn_count'];
                                                        }
                                                    }
                                                }

                                            getHomeSql(client_name)
                                                .then((home) => {
                                                    if(home[0] !== undefined) {
                                                        home_x = home[0]['HomeX'];
                                                        home_y = home[0]['HomeY'];
                                                        home_z = home[0]['HomeZ'];
                                                    }

                                                    getInfoBarStatusSql(client_name)
                                                        .then((rpg_infobar) => {
                                                            if(rpg_infobar[0] !== undefined) {
                                                                rpg_info_bar = rpg_infobar[0]['info_bar'];
                                                            }

                                                            getRpgElementsSql(client_name)
                                                                .then((rpg_elements) => {
                                                                    if(rpg_elements[0] !== undefined) {
                                                                        rpg_evolution = rpg_elements[0]['Evolution'];
                                                                        rpg_augmentation = rpg_elements[0]['Augmentation'];
                                                                        rpg_mod = rpg_elements[0]['ModName'];
                                                                        rpg_mod_level = rpg_elements[0]['ModLevel'];
                                                                        console.log(rpg_elements[0]['ModName'], rpg_elements[0]['ModLevel']);
                                                                        if(rpg_elements[0]['ModName2'] !== undefined && rpg_elements[0]['ModLevel2'] !== undefined) {
                                                                            rpg_mod_2 = rpg_elements[0]['ModName2'];
                                                                            rpg_mod_2_level = rpg_elements[0]['ModLevel2'];
                                                                        } else {
                                                                            rpg_mod_2 = "";
                                                                            rpg_mod_2_level = 0;
                                                                        }
                                                                    }

                                                                    if(client_id !== undefined) {
                                                                        console.log(`Bar: ${rpg_info_bar} | Evo: ${rpg_evolution} | Aug: ${rpg_augmentation} | Mod: ${rpg_mod} | Lvl: ${rpg_mod_level} | Mod2: ${rpg_mod_2} | Lvl2: ${rpg_mod_2_level}`);
                                                                        setAccountInfo(client_id, client, AdmLvl,
                                                                            vip_lvl, vip_end, money, bank,
                                                                            donate, level, exp,
                                                                            15 - vip_lvl * 2, job_name, job_level, job_exp,
                                                                            clan_name, mute_end, warn_end, warn_count, home_x, home_y,
                                                                            home_z, rpg_info_bar, rpg_evolution, rpg_augmentation,
                                                                            rpg_mod, rpg_mod_level, rpg_mod_2, rpg_mod_2_level);

                                                                        rpgInitItems(client_name);
                                                                    }


                                                                    if(level > 10) {
                                                                        client.setScoreTag(`ID: ${client_id} | Level: ${level}`);
                                                                    } else {
                                                                        client.setScoreTag(`ID: ${client_id} | Level: ${addCommas(level.toString())}`);
                                                                    }

                                                                    sendTitle(client, 'WELCOME');
                                                                    sendSubtitle(client, `TO QUARTZ${blue}LAND${white}`);
                                                                    sendTip(client, `${green}Hello, ${blue}${client_name}${green}!`);
                                                                    sendMessage(client, `${success} Вы вошли в аккаунт! Желаем приятной игры!`);
                                                                    clearTimeout(timer);

                                                                    if(AdmLvl >= 1) {
                                                                        client.setGameType(1);
                                                                        playerLog(client_name, `Вошел в аккаунт как администратор ${AdmLvl} уровня!`);
                                                                        switch(AdmLvl) {
                                                                            case 1:
                                                                                sendMessage(client, `${white}Вы вошли как ${light_blue}Помощник Администрации${white}!`);
                                                                                broadcastMessageOnlyAdmins(`${white}[${client_id}]${client_name} вошел как ${light_blue}Помощник Администрации${white}!`)
                                                                                break;

                                                                            case 2:
                                                                                sendMessage(client, `${white}Вы вошли как ${blue}Модератор${white}!`);
                                                                                broadcastMessageOnlyAdmins(`${white}[${client_id}] ${client_name} вошел как ${blue}Модератор${white}!`)
                                                                                break;

                                                                            case 3:
                                                                                sendMessage(client, `${white}Вы вошли как ${yellow}Младший Администратор!`);
                                                                                broadcastMessageOnlyAdmins(`${white}[${client_id}] ${client_name} вошел как ${yellow}Младший Администратор${white}!`)
                                                                                break;

                                                                            case 4:
                                                                                sendMessage(client, `${white}Вы вошли как ${gold}Администратор${white}!`);
                                                                                broadcastMessageOnlyAdmins(`${white}[${client_id}] ${client_name} вошел как ${gold}Администратор${white}!`)
                                                                                break;

                                                                            case 5:
                                                                                sendMessage(client, `${white}Вы вошли как ${dark_blue}Старший Администратор${white}!`);
                                                                                broadcastMessageOnlyAdmins(`${white}[${client_id}] ${client_name} вошел как ${dark_blue}Старший Администратор${white}!`)
                                                                                break;

                                                                            case 6:
                                                                                sendMessage(client, `${white}Вы вошли как ${red}Главный Администратор${white}!`);
                                                                                broadcastMessageOnlyAdmins(`${white}[${client_id}] ${client_name} вошел как ${red}Главный Администратор${white}!`)
                                                                                break;
                                                                        }
                                                                    } else {
                                                                        playerLog(client_name, `Вошел в аккаунт!`);
                                                                        client.setGameType(0);
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
                                                    })
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

                    })
                    .catch((err) => {
                        console.error(err);
                    });
            }
        }
    });
}

export function banForm(network: NetworkIdentifier, admin: string, ban_gived: string, ban_end: string, ban_expirece: number, ban_reason: string): void {
    const form = new CustomForm();
    form.setTitle(`${bold}Quartz${blue}Land`);
    form.addComponent(new FormLabel(`${red}Ваш аккаунт заблокирован!${white}`));
    form.addComponent(new FormLabel(`Выдал: ${yellow}${admin}${white}`));
    form.addComponent(new FormLabel(`Дата выдачи: ${yellow}${ban_gived}${white}`));
    form.addComponent(new FormLabel(`Дата снятия: ${yellow}${ban_end}${white}`));
    form.addComponent(new FormLabel(`Истекает через: ${yellow}${ban_expirece}${white} дней`));
    form.addComponent(new FormLabel(`Причина: ${yellow}${ban_reason}${white}`));
    form.addComponent(new FormLabel(`Если вы не согласны с наказанием, то создайте жалобу на нашем форуме!`));
    form.addComponent(new FormLabel(`Наш форум - Forum.quartzland.ru`));
    form.sendTo(network, async () => {
        // pass
    });

    setTimeout(() => {
        networkkick(network, '');
    }, 300);
}