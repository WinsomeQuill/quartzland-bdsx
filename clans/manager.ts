import { Player } from "bdsx/bds/player";
import { getPlayerByName, getPlayerIdByName, gray, isOnline, sendMessage } from "../management";
import { addMemberClanSql, getInfoClansSql, getMembersClanSql, removeClanSql, removeMemberClanSql, setBalanceClanSql, setDescriptionClanSql } from "../sqlmanager";

interface Clan {
    id: number,
    owner: string;
    name: string;
    description: string;
    members: any;
    balance: number;
}

export const clans: { [name: string]: Clan; } = { };

export function cacheClans(): void {
    getInfoClansSql()
        .then((data) => {
            for (let index = 0; index < data.length; index++) {
                if(data[index] === undefined) {
                    console.log(`Clan "${data[index]['name']}" not found info in MySQL!`);
                    continue;
                }

                const clan = data[index];
                getMembersClanSql(clan['name'])
                    .then((result_members) => {
                        clans[clan['name']] = {
                            id: clan['id'],
                            owner: clan['owner'],
                            name: clan['name'],
                            description: clan['description'],
                            members: [],
                            balance: clan['balance'],
                        };

                        for (let index = 0; index < result_members.length; index++) {
                            if(result_members[index]['member_rank'] !== 10) {
                                clans[clan['name']].members.push({ member_name: result_members[index]['member_name'], member_rank: result_members[index]['member_rank'] });
                            }
                        }

                    })
                    .catch((err) => {
                        console.error(err);
                    })
            }

        })
        .catch((err) => {
            console.error(err);
        });
}

export function getClanOnlineMembers(clan_name: string, format: boolean = true): string[] {
    const data: string[] = [`[${getPlayerIdByName(clans[clan_name].owner)}] ${clans[clan_name].owner} - ранг 10`];
    for (let index = 0; index < clans[clan_name].members.length; index++) {
        const client_name = clans[clan_name].members['member_name'];
        const client_rank = clans[clan_name].members['member_rank'];
        if(isOnline(client_name)) {
            if(format) {
                const client_id = getPlayerIdByName(client_name);
                data.push(`[${client_id}] ${client_name} - ранг ${client_rank}`);
            } else {
                data.push(client_name);
            }
        }
    }
    return data;
}

export function getClanOnlineMembersByRankLimit(clan_name: string, rank_limit: number): string[] {
    const data: string[] = [];

    if(rank_limit === 10) {
        data.push(getOwnerClan(clan_name));
    }

    for (let index = 0; index < clans[clan_name].members.length; index++) {
        const client_name = clans[clan_name].members['member_name'];
        const client_rank = clans[clan_name].members['member_rank'];
        if(isOnline(client_name) && client_rank <= rank_limit) {
            data.push(client_name);
        }
    }
    return data;
}

export function getOwnerClan(clan_name: string): string {
    return clans[clan_name].owner;
}

export function getMembersClan(clan_name: string): any[] {
    return clans[clan_name].members;
}

export function getMemberRankClan(clan_name: string, client_name: string): number {
    const clan = clans[clan_name];
    const owner = getOwnerClan(clan_name);

    if(owner === client_name) {
        return 10;
    }

    for (let index = 0; index < clan.members.length; index++) {
        if(clan.members[index]['member_name'] === client_name) {
            return clan.members[index]['member_rank'];
        }
    }
    return 0;
}

export function getMembersNamesClan(clan_name: string): string[] {
    const data: string[] = [];
    const member = clans[clan_name].members;
    for (let index = 0; index < clans[clan_name].members.length; index++) {
        if(member[index]['member_rank'] != 0) {
            data.push(member[index]['member_name']);
        }
    }
    return data;
}

export function getCountMembersClan(clan_name: string): number {
    return clans[clan_name].members.length;
}

export function getDescriptionClan(clan_name: string): string {
    return clans[clan_name].description;
}

export function getBalanceClan(clan_name: string): number {
    return clans[clan_name].balance;
}

export function setDescriptionClan(clan_name: string, description: string): void {
    clans[clan_name].description = description;
    setDescriptionClanSql(clan_name, description);
}

export function setBalanceClan(clan_name: string, balance: number): void {
    clans[clan_name].balance = balance;
    setBalanceClanSql(clan_name, balance);
}

export function addBalanceClan(clan_name: string, balance: number): void {
    clans[clan_name].balance += balance;
    setBalanceClanSql(clan_name, clans[clan_name].balance);
}

export function takeBalanceClan(clan_name: string, balance: number): void {
    clans[clan_name].balance -= balance;
    setBalanceClanSql(clan_name, clans[clan_name].balance);
}

export function getDeputyClan(clan_name: string): string[] {
    const data: string[] = [];
    const member = clans[clan_name].members;
    for (let index = 0; index < member.length; index++) {
        if(member[index]['member_rank'] === 9) {
            data.push(member[index]['member_name']);
        }
    }
    return data;
}

export function addMemberClan(client: Player, clan_name: string, rank: number): void {
    const client_name = client.getName();
    clans[clan_name].members.push({ member_name: client_name, member_rank: rank });
    addMemberClanSql(client_name, clan_name, rank);
}

export function removeMemberClan(client_name: string, clan_name: string): void {
    const member = clans[clan_name].members;
    for (let index = 0; index < clans[clan_name].members.length; index++) {
        member[index]['member_rank'] = 0;
        break;
    }
    removeMemberClanSql(client_name, clan_name);
}

export function removeClan(clan_name: string) {
    delete clans[clan_name];
    removeClanSql(clan_name);
}

export function sendMessageClan(clan_name: string, message: string, news_prefix: boolean = true): void {
    const members = getMembersClan(clan_name);
    const owner = getPlayerByName(getOwnerClan(clan_name));

    if(owner !== undefined) {
        if(news_prefix) {
            sendMessage(owner, `${gray}[Новости клана] ${message}`);
        } else {
            sendMessage(owner, `${gray}[${clan_name}] ${message}`);
        }
    }

    for (let index = 0; index < members.length; index++) {
        const target = getPlayerByName(members[index]['member_name']);
        const owner = getPlayerByName(getOwnerClan(clan_name));
        if(target !== undefined && owner !== undefined) {
            if(news_prefix) {
                sendMessage(target, `${gray}[Новости клана] ${message}`);
                sendMessage(owner, `${gray}[Новости клана] ${message}`);
            } else {
                sendMessage(target, `${gray}[${clan_name}] ${message}`);
                sendMessage(owner, `${gray}[${clan_name}] ${message}`);
            }
        }
    }
}