import { Player } from "bdsx/bds/player";
import { events } from "bdsx/event";
import { yellow, white, getIP, getPlayerByName, getTime } from "../management/index";
import * as mysql from "mysql2";
import * as dotenv from "dotenv";
import { RpgItem } from "../rpg/inventory";
dotenv.config({path: '/home/artem/minecraft-server-1/.env'});

const connection = mysql.createConnection({
    host: process.env.HOST_DB,
    user: process.env.USER_DB,
    database: process.env.DB_DB,
    password: process.env.PASSWORD_DB
});

connection.connect((err) => {
    if (err) {
        return console.error("<MySQL Manager ERROR> " + err.message);
    }
    else{
        console.log("<MySQL Manager> Подключение к серверу MySQL успешно установлено!");
    }
});

events.serverOpen.on(() => {
    console.log('[+] SqlManager enabled!');
});

events.serverClose.on(()=>{
    connection.end((err) => {
        if (err) {
            return console.log("<MySQL Manager ERROR> " + err.message);
        }
        console.log("<MySQL Manager> Подключение закрыто!");
    });
    console.log('[-] SqlManager disabled!');
});

export function createAccountSql(client_name: string, password: string): void {
    const client: Player | undefined = getPlayerByName(client_name);
    if (client !== undefined) {
        const ip: string = getIP(client);
        const sql_account = `INSERT INTO accounts (user_name, password, AdmLvl, VipLvl, level, exp, prefix, RegIP, LastIP, donate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const sql_economy = `INSERT INTO economy (player_id, money, bank, percent) VALUES ((SELECT id FROM accounts WHERE user_name = ?), ?, ?, ?)`;
        connection.query(sql_account, [client_name, password, 0, 0, 1, 0, `${yellow}Player${white}`, ip, ip, 0], function(err) {
            if(err) {
                console.log(err);
            }
        });

        connection.query(sql_economy, [client_name, 100, 0, 15], function(err) {
            if(err) {
                console.log(err);
            }
        });

        initRpgElements(client_name);
    }
}

export function getAccountById(id: number): Promise<any> {
    const sql = `SELECT * FROM accounts WHERE id = ?`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [id], function(err, results) {
            if(err) {
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function setAccountInfoSql(client_name: string, admin_lvl: number, vip_lvl: number, money: number, money_bank: number,
    level: number, exp: number, percent_economy: number, job_name: string | null, job_level: number, job_exp: number, donate: number): void {
    if(job_name === null) {
        const sql = `UPDATE accounts as ac, economy as ec SET
            ac.AdmLvl = ?, ac.VipLvl = ?, ac.level = ?, ac.exp = ?,
            ec.money = ?, ec.percent = ?, ec.bank = ?,
            ac.donate = ?
            WHERE ec.player_id = ac.id AND ac.user_name = ?`;
        connection.query(sql, [admin_lvl, vip_lvl, level, exp, money, percent_economy, money_bank, donate, client_name], function(err) {
            if(err) {
                console.log(err);
            }
        });
    } else {
        const sql = `UPDATE accounts as ac, economy as ec, job as jb SET
            ac.AdmLvl = ?, ac.VipLvl = ?, ac.level = ?, ac.exp = ?,
            ec.money = ?, ec.percent = ?, ec.bank = ?,
            jb.level = ?, jb.exp = ?, ac.donate = ?
            WHERE jb.name = ?
            AND ec.player_id = ac.id
            AND ac.user_name = ?`;
        connection.query(sql, [admin_lvl, vip_lvl, level, exp, money, percent_economy, money_bank, job_level, job_exp, donate, job_name, client_name], function(err) {
            if(err) {
                console.log(err);
            }
        });
    }

}

export function setPrefix(client_name: string, prefix: string): void {
    const sql = `UPDATE accounts SET prefix = '${prefix}' WHERE user_name = ?`;
    connection.query(sql, [client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function getRegIp(client_name: string): Promise<any> {
    const sql = `SELECT RegIP FROM accounts WHERE user_name = ?`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results) {
            if(err) {
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function getLastIp(client_name: string): Promise<any> {
    const sql = `SELECT LastIP FROM accounts WHERE user_name = ?`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results) {
            if(err) {
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function setLastIp(client_name: string, ip: string): void {
    const sql = `UPDATE accounts SET LastIP = ? WHERE accounts.user_name = ?`;
    connection.query(sql, [ip, client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function isInDb(client_name: string): Promise<any> {
    const sql = `SELECT id FROM accounts WHERE user_name = ?`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results) {
            if(err) {
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function getPassWord(client_name: string): Promise<any> {
    const sql = `SELECT password FROM accounts WHERE user_name = ?`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results) {
            if(err) {
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function setPassWord(client_name: string, password: string): void {
    const sql = `UPDATE accounts SET password = '${password}' WHERE user_name = ?`;
    connection.query(sql, [client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function getAccountByObject(client_name: string): Promise<any> {
    const sql = `SELECT * FROM accounts WHERE user_name = ?`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results) {
            if(err) {
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function getEconomyInfo(client_name: string): Promise<any> {
    const sql = `SELECT * FROM economy WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results) {
            if(err) {
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function getBansInfo(client_name: string): Promise<any> {
    const sql = `SELECT * FROM accounts_bans, accounts WHERE accounts.id = accounts_bans.player_id AND accounts.user_name = ?`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results) {
            if(err) {
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function setMoneyBankSql(client_name: string, money: number): void {
    const sql = `UPDATE economy SET bank = ${money} WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    connection.query(sql, [client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export async function addMoneyBankSql(client_name: string, money: number): Promise<void> {
    const client_money = await getMoneyBankSql(client_name);
    const sql = `UPDATE economy SET bank = ? + ? WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    connection.query(sql, [client_money[0]['bank'], money, client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function setMoneySql(client_name: string, money: number): void {
    const sql = `UPDATE economy SET money = ${money} WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    connection.query(sql, [client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function getMoneyBankSql(client_name: string): Promise<any> {
    const sql = `SELECT bank FROM economy WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results) {
            if(err) {
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function getMoneySql(client_name: string): Promise<any> {
    const sql = `SELECT money FROM economy WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)'`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results) {
            if(err) {
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function getPercentSql(client_name: string): Promise<any> {
    const sql = `SELECT percent FROM economy WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)'`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results) {
            if(err) {
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function getLevelSql(client_name: string): Promise<any> {
    const sql = `SELECT level FROM accounts WHERE user_name = ?`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results) {
            if(err) {
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function getExpSql(client_name: string): Promise<any> {
    const sql = `SELECT exp FROM accounts WHERE user_name = ?`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results) {
            if(err) {
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function setLevelSql(client_name: string, level: number): void {
    const sql = `UPDATE accounts SET level = ? WHERE user_name = ?`;
    connection.query(sql, [level, client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function setExpSql(client_name: string, exp: number): void {
    const sql = `UPDATE accounts SET exp = ? WHERE user_name = ?`;
    connection.query(sql, [exp, client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function getAdminLevelSql(client_name: string): Promise<any> {
    const sql = `SELECT AdmLvl FROM accounts WHERE user_name = ?`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results) {
            if(err) {
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function getVipLevelSql(client_name: string): Promise<any> {
    const sql = `SELECT VipLvl FROM accounts WHERE user_name = ?`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results) {
            if(err) {
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function setLevelJobSql(client_name: string, level: number, exp: number, job_name: string): void {
    const sql = `UPDATE job SET level = ${level}, exp = ${exp}
        WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)
        AND name = ?`;
    connection.query(sql, [client_name, job_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function getActiveJobSql(client_name: string): Promise<any> {
    const sql = `SELECT *
        FROM job WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)
        AND status = 'current'`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results) {
            if(err) {
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function getJobSql(client_name: string): Promise<any> {
    const sql = `SELECT *
        FROM job WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results) {
            if(err) {
                console.log(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function setActiveJobSql(client_name: string, job_name: string): void {
    const sql = `UPDATE job SET status = 'current'
        WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?) AND name = ?`;
    connection.query(sql, [client_name, job_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function createJobProfile(client_name: string, job_name: string): void {
    const sql = `INSERT INTO job (player_id, name, level, exp, status) VALUES ((SELECT id FROM accounts WHERE user_name = ?), ?, 1, 0, NULL)`;
    connection.query(sql, [client_name, job_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function clearActiveJobSql(client_name: string, job_name: string): void {
    const sql = `UPDATE job SET status = NULL
        WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)
        AND name = ?`;
    connection.query(sql, [client_name, job_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function createJobSql(client_name: string, job_name: string): void {
    const sql = `INSERT INTO job (player_id, name, level, exp, status)
        VALUES ((SELECT id FROM accounts WHERE user_name = ?), ?, 1, 0, NULL)`;
    connection.query(sql, [client_name, job_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function getSyncAccountSql(client_name: string): Promise<any> {
    const sql = `SELECT ac.AdmLvl, ac.VipLvl, ac.VipEnd, ac.level, ac.exp, ac.donate, ec.money, ec.bank, ec.percent, jb.name AS job_name, jb.level AS job_level, jb.exp AS job_exp, jb.status AS job_status
    FROM accounts AS ac, economy AS ec, job AS jb
    WHERE ec.player_id = ac.id
    AND jb.player_id = ac.id
    AND ac.user_name = ?
    AND (jb.status = 'current' OR jb.status IS NULL)
    ORDER BY jb.status DESC LIMIT 1`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function setAdminLevelSql(client_name: string, lvl: number): void {
    const sql = `UPDATE accounts SET AdmLvl = ? WHERE user_name = ?`;
    connection.query(sql, [lvl, client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function setVipLevelSql(client_name: string, lvl: number): void {
    const sql = `UPDATE accounts SET VipLvl = ? WHERE user_name = ?`;
    connection.query(sql, [lvl, client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function setLevelAndExpSql(client_name: string | undefined, level: number, exp: number): void {
    const sql = `UPDATE accounts SET level = ?, exp = ? WHERE user_name = ?`;
    connection.query(sql, [level, exp, client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function setJobLevelAndExpSql(client_name: string | undefined, level: number, exp: number, job_name: string | null): void {
    const sql = `UPDATE job SET level = ?, exp = ? WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?) AND name = ?`;
    connection.query(sql, [level, exp, client_name, job_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function createRegionSql(client_name: string, name: string, description: string,
    pos1x: number, pos1y: number, pos1z: number, pos2x: number, pos2y: number, pos2z: number, world_id: number): void {
    const sql_region = `INSERT INTO regions (name, description, pos1x, pos1y, pos1z, pos2x, pos2y, pos2z, world_id, price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    connection.query(sql_region, [name, description, pos1x, pos1y, pos1z, pos2x, pos2y, pos2z, world_id, 0], function(err) {
        if(err) {
            console.log(err);
        }
    });

    const sql_flags: string[] = [
        `INSERT INTO regions_flags (region_id, flag, status) VALUES ((SELECT id FROM regions WHERE name = ?), 'pvp', 'OFF')`,
        `INSERT INTO regions_flags (region_id, flag, status) VALUES ((SELECT id FROM regions WHERE name = ?), 'build', 'OFF')`,
        `INSERT INTO regions_flags (region_id, flag, status) VALUES ((SELECT id FROM regions WHERE name = ?), 'use', 'OFF')`,
        `INSERT INTO regions_flags (region_id, flag, status) VALUES ((SELECT id FROM regions WHERE name = ?), 'info', 'ON')`,
        `INSERT INTO regions_flags (region_id, flag, status) VALUES ((SELECT id FROM regions WHERE name = ?), 'send-chat', 'ON')`,
        `INSERT INTO regions_flags (region_id, flag, status) VALUES ((SELECT id FROM regions WHERE name = ?), 'item-drop', 'ON')`,
    ];

    for (let index = 0; index < sql_flags.length; index++) {
        connection.query(sql_flags[index], [name], function(err) {
            if(err) {
                console.log(err);
            }
        });
    }

    const sql_owner = `INSERT INTO regions_members (region_id, member_id, rank) VALUES ((SELECT id FROM regions WHERE name = ?), (SELECT id FROM accounts WHERE user_name = ?), 3)`;
    connection.query(sql_owner, [name, client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function changeRegionFlagSql(region_name: string, flag_name: string, flag_value: boolean): void {
    if(flag_value) {
        const sql = `UPDATE regions_flags SET status = 'ON' WHERE region_id = (SELECT id FROM regions WHERE name = ?) AND flag = ?`;
        connection.query(sql, [region_name, flag_name], function(err) {
            if(err) {
                console.log(err);
            }
        });
    } else {
        const sql = `UPDATE regions_flags SET status = 'OFF' WHERE region_id = (SELECT id FROM regions WHERE name = ?) AND flag = ?`;
        connection.query(sql, [region_name, flag_name], function(err) {
            if(err) {
                console.log(err);
            }
        });
    }
}


/** @deprecated **/
export function getRegionsNameSql(): Promise<any> {
    const sql = `SELECT DISTINCT name FROM regions AS rg, regions_flags AS rf, regions_members WHERE rf.status = 'OFF'`;
    return new Promise((resolve, reject) => {
        connection.query(sql, function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function getRegionsInfoSql(): Promise<any> {
    const sql = `SELECT DISTINCT rg.id AS id, rg.name AS name, rg.description, rg.pos1x, rg.pos1y, rg.pos1z, rg.pos2x, rg.pos2y, rg.pos2z, rg.world_id, rg.price, (SELECT user_name FROM accounts WHERE rm.member_id = accounts.id AND rm.rank = 3) AS owner FROM regions AS rg, regions_members AS rm WHERE rm.region_id = rg.id ORDER BY rg.id`;
    return new Promise((resolve, reject) => {
        connection.query(sql, function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function getRegionsFlagsSql(name: string): Promise<any> {
    const sql = `SELECT DISTINCT rf.flag AS flag, rf.status AS status FROM regions AS rg, regions_flags AS rf WHERE rg.id = rf.region_id AND rg.name = ?;`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [name], function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function getRegionsMembersSql(name: string): Promise<any> {
    const sql = `SELECT DISTINCT user_name AS member_name, regions_members.rank AS member_rank FROM accounts, regions_members, regions WHERE regions_members.member_id = accounts.id AND regions_members.region_id = regions.id AND regions.name = ? AND regions_members.rank > 0`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [name], function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function getCountRegionsPlayerSql(client_name: string): Promise<any> {
    const sql = `SELECT DISTINCT COUNT(rg.name) AS counts FROM regions AS rg, regions_members AS rm, accounts AS ac WHERE rg.id = rm.region_id AND rm.member_id = ac.id AND ac.user_name = ?`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, result) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(result);
        });
    });
}

export function setRegionMemberRankSql(region_name: string, client_name: string, rank: number): void {
    const sql = `UPDATE regions_members, regions, accounts SET rank = ? WHERE regions_members.region_id = regions.id AND regions.name = ? AND accounts.id = regions_members.member_id AND accounts.user_name = ?`;
    connection.query(sql, [rank, region_name, client_name], function(err) {
        if(err) {
            console.error(err);
        }
    });
}

export function getRegionsByPlayerSql(client_name: string, rank = 3): Promise<any> {
    const sql = `SELECT rg.name, rg.description, rg.pos1x, rg.pos1y, rg.pos1z, rg.pos2x, rg.pos2y, rg.pos2z, rg.price FROM regions AS rg, regions_members AS rm
    WHERE rg.id = rm.region_id AND rm.member_id = (SELECT id FROM accounts WHERE user_name = ?) AND rm.rank = ?`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name, rank], function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function getRegionsInSellSql(): Promise<any> {
    const sql = `SELECT DISTINCT rg.name, rg.description, rg.pos1x, rg.pos1y, rg.pos1z, rg.pos2x, rg.pos2y, rg.pos2z, rg.price FROM regions AS rg WHERE rg.price != 0`;
    return new Promise((resolve, reject) => {
        connection.query(sql, function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function setRegionDescriptionSql(region_name: string, description: string): void {
    const sql = `UPDATE regions SET description = ? WHERE name = ?`;
    connection.query(sql, [description, region_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function addRegionMemberSql(region_name: string, client_name: string, rank: number): void {
    const sql = `INSERT INTO regions_members (region_id, member_id, rank) VALUES ((SELECT id FROM regions WHERE name = ?), (SELECT id FROM accounts WHERE user_name = ?), ?)`;
    connection.query(sql, [region_name, client_name, rank], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function removeRegionMemberSql(region_name: string, client_name: string): void {
    const sql = `UPDATE regions_members SET regions_members.rank = 0 WHERE (SELECT id FROM accounts WHERE user_name = ?) = regions_members.member_id AND regions_members.region_id = (SELECT id FROM regions WHERE name = ?)`;
    connection.query(sql, [client_name, region_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function removeRegionSql(region_name: string): void {
    const sql = `DELETE FROM regions WHERE regions.name = ?`;
    connection.query(sql, [region_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function setRegionPriceSql(region_name: string, price: number): void {
    const sql = `UPDATE regions SET regions.price = ? WHERE regions.name = ?`;
    connection.query(sql, [price, region_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function createClanSql(client_name: string, clan_name: string, description: string): void {
    const sql = `INSERT INTO clans (name, description, balance) VALUES (?, ?, ?)`;
    connection.query(sql, [clan_name, description, 0], function(err) {
        if(err) {
            console.log(err);
        }
    });

    addMemberClanSql(client_name, clan_name, 10);
}

export function getInfoClansSql(): Promise<any> {
    const sql = `SELECT DISTINCT cn.id, cn.name AS name, ac.user_name AS owner, cn.description AS description, cn.balance AS balance FROM accounts AS ac, clans_players AS cp, clans AS cn WHERE cp.player_id = ac.id AND cp.clan_id = cn.id AND cp.rank = 10 ORDER BY cn.id`;
    return new Promise((resolve, reject) => {
        connection.query(sql, function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function getMembersClanSql(clan_name: string, rank = 10): Promise<any> {
    const sql = `SELECT DISTINCT ac.user_name AS member_name, cp.rank AS member_rank FROM accounts AS ac, clans_players AS cp, clans AS cn WHERE cp.player_id = ac.id AND cp.clan_id = cn.id AND cn.name = ? AND cp.rank < ? AND cp.rank > 0`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [clan_name, rank], function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function addMemberClanSql(client_name: string, clan_name: string, rank: number): void {
    const sql_clans_players = `INSERT INTO clans_players (clan_id, player_id, rank) VALUES ((SELECT DISTINCT id FROM clans WHERE name = ?), (SELECT DISTINCT id FROM accounts WHERE user_name = ?), ?)`;
    connection.query(sql_clans_players, [clan_name, client_name, rank], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function setMemberRankClanSql(client_name: string, clan_name: string, rank: number): void {
    const sql_clans_players = `UPDATE clans_players AS cp SET cp.rank = ? WHERE (SELECT id FROM accounts WHERE user_name = ?) = cp.player_id AND (SELECT id FROM clans WHERE name = ?) = cp.clan_id`;
    connection.query(sql_clans_players, [rank, client_name, clan_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function removeMemberClanSql(client_name: string, clan_name: string): void {
    setMemberRankClanSql(client_name, clan_name, 0);
}

export function getClanAndRankByMemberSql(client_name: string): Promise<any> {
    const sql = `SELECT DISTINCT cn.name AS name, cp.rank AS rank FROM clans AS cn, clans_players AS cp, accounts AS ac WHERE cp.player_id = (SELECT id FROM accounts WHERE user_name = ?) AND cn.id = cp.clan_id`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function setDescriptionClanSql(clan_name: string, description?: string): void {
    if(description !== undefined) {
        const sql_clans_players = `UPDATE clans AS cn SET cn.description = ? WHERE cn.name = ?`;
        connection.query(sql_clans_players, [description, clan_name], function(err) {
            if(err) {
                console.log(err);
            }
        });
    }
}

export function setBalanceClanSql(clan_name: string, balance: number): void {
    if(balance !== undefined) {
        const sql_clans_players = `UPDATE clans AS cn SET cn.balance = ? WHERE cn.name = ?`;
        connection.query(sql_clans_players, [balance, clan_name], function(err) {
            if(err) {
                console.log(err);
            }
        });
    }
}

/** @deprecated **/
export function getClansNamesSql(): Promise<any> {
    const sql = `SELECT DISTINCT name FROM clans`;
    return new Promise((resolve, reject) => {
        connection.query(sql, function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function removeClanSql(clan_name: string): void {
    const sql_clans_players = `DELETE FROM clans AS cn WHERE cn.name = ?`;
    connection.query(sql_clans_players, [clan_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function addBanSql(client_name: string, admin_name: string, ban_gived: Date, ban_end: Date, ban_reason: string): void {
    const sql = `INSERT INTO accounts_bans (player_id, admin_id, ban_gived, ban_end, ban_reason) VALUES ((SELECT id FROM accounts WHERE user_name = ?), (SELECT id FROM accounts WHERE user_name = ?), ?, ?, ?)`;
    connection.query(sql, [client_name, admin_name, ban_gived, ban_end, ban_reason], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function getBanSql(client_name: string): Promise<any> {
    const sql = `SELECT DISTINCT * FROM accounts_bans WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function setBanSql(client_name: string, admin_name: string, ban_gived: Date, ban_end: Date, ban_reason: string): void {
    const sql = `UPDATE accounts_bans AS ab SET ab.admin_id = (SELECT id FROM accounts WHERE user_name = ?), ab.ban_gived = ?, ab.ban_end = ?, ab.ban_reason = ? WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    connection.query(sql, [admin_name, ban_gived, ban_end, ban_reason, client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function removeBanSql(client_name: string): void {
    const sql = `UPDATE accounts_bans AS ab SET ab.ban_end = NULL WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    connection.query(sql, [client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function addMuteSql(client_name: string, admin_name: string, mute_gived: Date, mute_end: Date, mute_reason: string): void {
    const sql = `INSERT INTO accounts_mutes (player_id, admin_id, mute_gived, mute_end, mute_reason) VALUES ((SELECT id FROM accounts WHERE user_name = ?), (SELECT id FROM accounts WHERE user_name = ?), ?, ?, ?)`;
    connection.query(sql, [client_name, admin_name, mute_gived, mute_end, mute_reason], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function getMuteSql(client_name: string): Promise<any> {
    const sql = `SELECT DISTINCT * FROM accounts_mutes WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function setMuteSql(client_name: string, admin_name: string, mute_gived: Date, mute_end: Date, mute_reason: string): void {
    const sql = `UPDATE accounts_mutes AS am SET am.admin_id = (SELECT id FROM accounts WHERE user_name = ?), am.mute_gived = ?, am.mute_end = ?, am.mute_reason = ? WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    connection.query(sql, [admin_name, mute_gived, mute_end, mute_reason, client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function removeMuteSql(client_name: string): void {
    const sql = `UPDATE accounts_mutes AS am SET am.mute_end = NULL WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    connection.query(sql, [client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function addWarnSql(client_name: string, admin_name: string, warn_gived: Date, warn_end: Date, warn_reason: string, warn_count: number): void {
    const sql = `INSERT INTO accounts_warns (player_id, admin_id, warn_gived, warn_end, warn_reason, warn_count) VALUES ((SELECT id FROM accounts WHERE user_name = ?), (SELECT id FROM accounts WHERE user_name = ?), ?, ?, ?, ?)`;
    connection.query(sql, [client_name, admin_name, warn_gived, warn_end, warn_reason, warn_count], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function getWarnSql(client_name: string): Promise<any> {
    const sql = `SELECT DISTINCT * FROM accounts_warns WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function setWarnSql(client_name: string, admin_name: string, warn_gived: Date, warn_end: Date, warn_reason: string, warn_count: number): void {
    const sql = `UPDATE accounts_warns AS aw SET aw.admin_id = (SELECT id FROM accounts WHERE user_name = ?), aw.warn_gived = ?, aw.warn_end = ?, aw.warn_reason = ?, aw.warn_count = ? WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    connection.query(sql, [admin_name, warn_gived, warn_end, warn_reason, warn_count, client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function removeWarnSql(client_name: string, count: number): void {
    if(count === 3) {
        const sql = `UPDATE accounts_warns AS aw SET aw.warn_count = 0 AND aw.warn_end = NULL WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
        connection.query(sql, [client_name], function(err) {
            if(err) {
                console.log(err);
            }
        });
    } else {
        const sql = `UPDATE accounts_warns AS aw SET aw.warn_count = aw.warn_count - ? AND aw.warn_end = NULL WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
        connection.query(sql, [count, client_name], function(err) {
            if(err) {
                console.log(err);
            }
        });
    }
}

export function getPunishmentSql(client_name: string): Promise<any> {
    const sql = `SELECT DISTINCT am.mute_end AS mute_end, aw.warn_end AND warn_end, aw.warn_count AS warn_count FROM accounts_mutes AS am, accounts_warns AS aw WHERE am.player_id = aw.player_id AND am.player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function getAdminBanSql(client_name: string): Promise<any> {
    const sql = `SELECT DISTINCT ac.user_name AS user_name FROM accounts AS ac, accounts_bans AS ab WHERE player_id = (SELECT id FROm accounts WHERE user_name = ?) AND admin_id = ac.id`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function setVipEndSql(client_name: string, vip_end: Date | null): void {
    if(vip_end !== null) {
        const sql = `UPDATE accounts SET VipEnd = ? WHERE user_name = ?`;
        connection.query(sql, [vip_end, client_name], function(err) {
            if(err) {
                console.log(err);
            }
        });
    } else {
        const sql = `UPDATE accounts SET VipEnd = ? WHERE user_name = ?`;
        connection.query(sql, [getTime().toDate(), client_name], function(err) {
            if(err) {
                console.log(err);
            }
        });
    }
}

export function getEconomyStatsSql(): Promise<any> {
    const sql = `SELECT economy FROM stats`;
    return new Promise((resolve, reject) => {
        connection.query(sql, function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export async function createEconomyStatsSql(sum: number): Promise<void> {
    const sql = `INSERT INTO stats (economy) VALUES (?)`;
    connection.query(sql, [sum], function(err) {
        if(err) {
            console.error(err);
        }
    });
}

export function setEconomyStatsSql(sum: number): void {
    const sql = `UPDATE stats SET economy = ?`;
    connection.query(sql, [sum], function(err) {
        if(err) {
            console.error(err);
        }
    });
}

export async function addLogSql(client_name: string, date: Date, text: string): Promise<void> {
    const sql = `INSERT INTO logs(user_name, date, text) VALUES(?, ?, ?)`;
    connection.query(sql, [client_name, date, text], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export async function setHomeSql(client_name: string, x: number, y: number, z: number): Promise<void> {
    const sql = `INSERT INTO positions (player_id, HomeX, HomeY, HomeZ) VALUES((SELECT id FROM accounts WHERE user_name = ?), ?, ?, ?)`;
    connection.query(sql, [client_name, x, y, z], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function getHomeSql(client_name: string): Promise<any> {
    const sql = `SELECT HomeX, HomeY, HomeZ FROM positions WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export async function updateHomeSql(client_name: string, x: number, y: number, z: number): Promise<void> {
    const sql = `UPDATE positions SET HomeX = ?, HomeY = ?, HomeZ = ? WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    connection.query(sql, [x, y, z, client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function initRpgElements(client_name: string): void {
    const sql = `INSERT INTO rpg_elements (player_id, info_bar) VALUES ((SELECT id FROM accounts WHERE user_name = ?), 'ON')`;
    connection.query(sql, [client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

function getAccountsNames(): Promise<any> {
    const sql = `SELECT user_name FROM accounts`;
    return new Promise((resolve, reject) => {
        connection.query(sql, function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function setInfoBarStatusSql(client_name: string, status: string): void {
    const sql = `UPDATE rpg_elements SET info_bar = ? WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    connection.query(sql, [status, client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function getInfoBarStatusSql(client_name: string): Promise<any> {
    const sql = `SELECT info_bar FROM rpg_elements WHERE player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export async function setRpgModSql(client_name: string, mod: string, mod_level: number): Promise<any> {
    const sql = `INSERT INTO rpg_players_mods (player_id, mod_id, mod_level) VALUES((SELECT id FROM accounts WHERE user_name = ?),(SELECT id FROM rpg_mods WHERE name = ?), ?)`;
    connection.query(sql, [client_name, mod, mod_level], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export async function updateRpgModSql(client_name: string, mod: string, mod_level: number): Promise<any> {
    const sql = `UPDATE rpg_players_mods AS pm SET pm.mod_id = (SELECT id FROM rpg_mods WHERE rpg_mods.name = ?), pm.mod_level = ? WHERE pm.player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    connection.query(sql, [mod, mod_level, client_name], function(err) {
        if(err) {
            console.log(err);
        }
    });
}

export function getRpgElementsSql(client_name: string): Promise<any> {
    const sql = `SELECT DISTINCT e.evolution AS Evolution, e.augmentation AS Augmentation, (SELECT name FROM rpg_mods WHERE id = pm.mod_id) AS ModName, pm.mod_level AS ModLevel, (SELECT name FROM rpg_mods WHERE id = pm.mod_2_id) AS ModName2, pm.mod_2_level AS ModLevel2 FROM rpg_elements AS e, rpg_players_mods AS pm WHERE pm.player_id = (SELECT id FROM accounts WHERE user_name = ?)`;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function addRpgItemSql(client_name: string, item: RpgItem, count: number): void {
    const sql = `INSERT INTO rpg_players_items (player_id, item_id, count) VALUES((SELECT id FROM accounts WHERE user_name = ?),(SELECT id FROM rpg_items WHERE name = ?), ?)`;
    connection.query(sql, [client_name, item.getName(), count], function(err) {
        if(err) {
            console.error(err);
        }
    });
}

export function getRpgItemsSql(client_name: string): Promise<any> {
    const sql = `SELECT DISTINCT im.name, im.description, im.type, im.price, pim.count FROM rpg_items AS im, rpg_players_items AS pim WHERE pim.player_id = (SELECT id FROM accounts WHERE user_name = ?) AND im.id = pim.item_id `;
    return new Promise((resolve, reject) => {
        connection.query(sql, [client_name], function(err, results: any) {
            if(err) {
                console.error(err);
                return reject(err);
            }
            return resolve(results);
        });
    });
}

export function updateRpgItemSql(client_name: string, item: RpgItem, count: number): void {
    const sql = `UPDATE rpg_players_items SET count = ? WHERE rpg_players_items.player_id = (SELECT id FROM accounts WHERE user_name = ?) AND rpg_players_items.item_id = (SELECT id FROM rpg_items WHERE name = ?)`;
    connection.query(sql, [count, client_name, item.getName()], function(err) {
        if(err) {
            console.error(err);
        }
    });
}
