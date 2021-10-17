import { BlockPos, Vec3 } from "bdsx/bds/blockpos";
import { Player } from "bdsx/bds/player";
import { blockInZone, getAdminLevel, maxplayers, playerInZone, players } from "../management";
import { getRegionsInfoSql, getRegionsFlagsSql,
    getRegionsMembersSql, changeRegionFlagSql, setRegionMemberRankSql,
    removeRegionSql, addRegionMemberSql, setRegionPriceSql, setRegionDescriptionSql,
    removeRegionMemberSql, createRegionSql } from "../sqlmanager";

interface Region {
    id: number,
    owner: string;
    name: string;
    description: string;
    pos1x: number;
    pos1y: number;
    pos1z: number;
    pos2x: number;
    pos2y: number;
    pos2z: number;
    members: any;
    flags: any;
    price: number;
    world_id: number;
}

export const regions: { [name: string]: Region; } = { };

export function cacheRegions(): void {
    getRegionsInfoSql()
        .then((data) => {
            for (let index = 0; index < data.length; index++) {
                if(data[index] === undefined) {
                    console.log(`Region "${data[index]['name']}" not found info in MySQL!`);
                    continue;
                }

                const region = data[index];
                getRegionsFlagsSql(region['name'])
                    .then((result_flags) => {
                        getRegionsMembersSql(region['name'])
                            .then((result_members) => {
                                regions[region['name']] = {
                                    id: region['id'],
                                    owner: region['owner'],
                                    name: region['name'],
                                    description: region['description'],
                                    pos1x: region['pos1x'],
                                    pos1y: region['pos1y'],
                                    pos1z: region['pos1z'],
                                    pos2x: region['pos2x'],
                                    pos2y: region['pos2y'],
                                    pos2z: region['pos2z'],
                                    members: [],
                                    flags: [],
                                    price: region['price'],
                                    world_id: region['world_id'],
                                };

                                for (let index = 0; index < result_members.length; index++) {
                                    if(result_members[index]['member_rank'] !== 3) {
                                        regions[region['name']].members.push({ member_name: result_members[index]['member_name'], member_rank: result_members[index]['member_rank'] });
                                    }
                                }

                                for (let index = 0; index < result_flags.length; index++) {
                                    regions[region['name']].flags.push({ flag: result_flags[index]['flag'], status: result_flags[index]['status'] });
                                }
                            })
                            .catch((err) => {
                                console.error(err)
                            });
                    })
                    .catch((err) => {
                        console.error(err)
                    });
            }
        })
        .catch((err) => {
            console.error(err)
        });
}

export async function createRegion(region_name: string, client: Player, description: string, pos1x: number, pos1y: number, pos1z: number, pos2x: number, pos2y: number, pos2z: number, world_id: number): Promise<void> {
    const id = Object.keys(regions).length + 1;
    const client_name = client.getName();

    regions[region_name] = {
        id: id,
        owner: client_name,
        name: region_name,
        description: description,
        pos1x: pos1x,
        pos1y: pos1y,
        pos1z: pos1z,
        pos2x: pos2x,
        pos2y: pos2y,
        pos2z: pos2z,
        members: [],
        flags: [],
        price: 0,
        world_id: world_id,
    };

    regions[region_name].flags.push({ flag: 'pvp', status: 'OFF' });
    regions[region_name].flags.push({ flag: 'build', status: 'OFF' });
    regions[region_name].flags.push({ flag: 'use', status: 'OFF' });
    regions[region_name].flags.push({ flag: 'info', status: 'ON' });
    regions[region_name].flags.push({ flag: 'send-chat', status: 'ON' });
    regions[region_name].flags.push({ flag: 'item-drop', status: 'ON' });

    createRegionSql(client_name, region_name, description, pos1x, pos1y, pos1z, pos2x, pos2y, pos2z, world_id);
}

export function isRegionExists(region_name: string): boolean {
    if(regions[region_name] !== undefined) {
        return true;
    }
    return false;
}

export function getRegionPos1(region_name: string): number[] {
    const pos: number[] = [
        regions[region_name].pos1x,
        regions[region_name].pos1y,
        regions[region_name].pos1z
    ];
    return pos;
}

export function getRegionPos2(region_name: string): number[] {
    const pos: number[] = [
        regions[region_name].pos2x,
        regions[region_name].pos2y,
        regions[region_name].pos2z
    ];
    return pos;
}

export function getRegionDescription(region_name: string): string {
    return regions[region_name].description;
}

export function setRegionDescription(region_name: string, description: string): void {
    regions[region_name].description = description;
    setRegionDescriptionSql(region_name, description);
}

export function getRegionMemberRank(region_name: string, client_name: string): number {
    for(let index = 0; index < regions[region_name].members.length; index++) {
        if(regions[region_name].members[index]['member_name'] === client_name) {
            return regions[region_name].members[index]['member_rank'];
        }
    }
    return -1;
}

export function setRegionMemberRank(region_name: string, client_name: string, rank: number): void {
    for(let index = 0; index < regions[region_name].members.length; index++) {
        if(regions[region_name].members[index]['member_name'] === client_name) {
            regions[region_name].members[index]['member_rank'] = rank;
            setRegionMemberRankSql(region_name, client_name, rank);
        }
    }
}

export function getRegionMembers(region_name: string, client_name: string): any[] {
    const data: any[] = [];
    for(let index = 0; index < regions[region_name].members.length; index++) {
        if(regions[region_name].members[index]['member_name'] !== client_name && regions[region_name].members[index]['member_rank'] > 0 && regions[region_name].members[index]['member_rank'] !== 3) {
            data.push(regions[region_name].members[index]['member_name']);
        }
    }
    return data;
}

export function getRegionMemberDeputy(region_name: string): string {
    for(let index = 0; index < regions[region_name].members.length; index++) {
        if(regions[region_name].members[index]['member_rank'] === 2) {
            return regions[region_name].members[index]['member_name'];
        }
    }
    return '';
}

export function getRegionMembersByRank(region_name: string, rank: number): any[] {
    const data: any[] = [];
    for(let index = 0; index < regions[region_name].members.length; index++) {
        if(regions[region_name].members[index]['member_rank'] === rank) {
            data.push(regions[region_name].members[index]['member_name']);
        }
    }
    return data;
}

export function getRegionCountDeputy(region_name: string): number {
    let count = 0;
    for(let index = 0; index < regions[region_name].members.length; index++) {
        if(regions[region_name].members[index]['member_rank'] === 2) {
            count++;
        }
    }
    return count;
}

export function getRegionCountMembers(region_name: string): number {
    let count = 0;
    for(let index = 0; index < regions[region_name].members.length; index++) {
        if(regions[region_name].members[index]['member_rank'] === 1) {
            count++;
        }
    }
    return count;
}

export function addRegionMember(region_name: string, client_name: string, rank: number): void {
    regions[region_name].members.push({ member_name: client_name, member_rank: rank });
    addRegionMemberSql(region_name, client_name, rank);
}

export function removeRegionMember(region_name: string, client_name: string): void {
    for(let index = 0; index < regions[region_name].members.length; index++) {
        if(regions[region_name].members[index]['member_name'] === client_name) {
            regions[region_name].members[index]['member_rank'] = 0;
            removeRegionMemberSql(region_name, client_name);
        }
    }
}

export function getRegionFlags(region_name: string): any {
    return regions[region_name].flags;
}

export function getRegionFlagStatus(region_name: string, flag_name: string): string {
    for (let index = 0; index < regions[region_name].flags.length; index++) {
        if(regions[region_name].flags[index]['flag'] === flag_name) {
            return regions[region_name].flags[index]['status'];
        }
    }
    console.log(`FLAG ${flag_name} NOT FOUND! #1`);
    return '';
}

export function setRegionFlagChangeStatus(region_name: string, flag_name: string, flag_status: boolean): boolean {
    for (let index = 0; index < regions[region_name].flags.length; index++) {
        if(regions[region_name].flags[index]['flag'] === flag_name) {
            if(flag_status === true) {
                regions[region_name].flags[index]['status'] = 'ON';
                changeRegionFlagSql(region_name, regions[region_name].flags[index]['flag'], true);
                return true;
            } else {
                regions[region_name].flags[index]['status'] = 'OFF';
                changeRegionFlagSql(region_name, regions[region_name].flags[index]['flag'], false);
                return true;
            }
        }
    }
    console.log(`FLAG ${flag_name} NOT FOUND! #2`);
    return false;
}

export function getCountRegionsPlayer(client: Player): number {
    const keys = Object.keys(regions);
    let count = 0;

    for (let index = 0; index < keys.length; index++) {
        const region = regions[keys[index]];
        if(region.owner === client.getName()) {
            count += 1;
        }
    }

    return count;
}

export function getRegionOwner(region_name: string): string {
    return regions[region_name].owner;
}

export function RegionRemove(client: Player, region_name: string): boolean {
    if(getRegionOwner(region_name) === client.getName()) {
        delete regions[region_name];
        removeRegionSql(region_name);
        return true;
    } else {
        return false;
    }
}

export function setRegionOwner(region_name: string, client_name: string): void {
    setRegionMemberRankSql(region_name, regions[region_name].owner, 0);
    setRegionMemberRankSql(region_name, client_name, 3);
    regions[region_name].owner = client_name;
}

export function setRegionPrice(region_name: string, new_price: number): void {
    regions[region_name].price = new_price;
    setRegionPriceSql(region_name, new_price);
}

export function getRegionPrice(region_name: string): number {
    return regions[region_name].price;
}

export function isRegionSell(region_name: string): boolean {
    if(regions[region_name].price != 0) {
        return true;
    } else {
        return false;
    }
}

export function isCrossOtherRegion(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number, world_id: number): Region | null {
    const keys = Object.keys(regions);
    // SELECT * FROM AREAS
    //         WHERE Pos2X >= {minX} AND Pos1X <= {maxX}
    //         AND Pos2Y >= {minY} AND Pos1Y <= {maxY}
    //         AND Pos2Z >= {minZ} AND Pos1Z <= {maxZ}

    // $minX = min($pos1x, $pos2x);
    // $maxX = max($pos1x, $pos2x);

    // $minY = min($pos1y, $pos2y);
    // $maxY = max($pos1y, $pos2y);

    // $minZ = min($pos1z, $pos2z);
    // $maxZ = max($pos1z, $pos2z);

    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);

    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);

    const minZ = Math.min(z1, z2);
    const maxZ = Math.max(z1, z2);
    // rg.pos2x >= ? AND rg.pos1x <= ? AND rg.pos2y >= ? AND rg.pos1y <= ? AND rg.pos2z >= ? AND rg.pos1z <= ?

    for (let index = 0; index < keys.length; index++) {
        const region = regions[keys[index]];
        if(region.world_id === world_id, region.pos2x >= minX && region.pos1x <= maxX && region.pos2y >= minY && region.pos1y <= maxY && region.pos2z >= minZ && region.pos1z <= maxZ) {
            return region;
        }
    }
    return null;
}

export function getRegionAVGPosition(region_name: string): number[] {
    const pos: number[] = [
        Math.round((regions[region_name].pos1x + regions[region_name].pos2x)/2),
        Math.round((regions[region_name].pos1y + regions[region_name].pos2y)/2),
        Math.round((regions[region_name].pos1z + regions[region_name].pos2z)/2)
    ];
    return pos;
}

export function getPlayersForRegion(region_name: string,  client: Player): any[] {
    const data: any[] = [];
    const members = getRegionMembers(region_name, client.getName());
    if(client !== undefined) {
        for (let index = 0; index < maxplayers; index++) {
            for (let jindex = 0; jindex < members.length; jindex++) {
                if(members[jindex] === players[index].name) {
                    continue;
                } else {
                    if(players[index].object !== undefined && players[index].authorized === true && players[index].name !== client.getName() && players[index].name !== getRegionOwner(region_name)) {
                        data.push(players[index].name);
                    }
                }
            }
        }
    } else {
        for (let index = 0; index < maxplayers; index++) {
            for (let jindex = 0; jindex < members.length; jindex++) {
                if(members[jindex] === players[index].name) {
                    continue;
                } else {
                    if(players[index].object !== undefined && players[index].authorized === true && players[index].name !== getRegionOwner(region_name)) {
                        data.push(players[index].name);
                    }
                }
            }
        }
    }
    return data;
}

export function AllowPlayerBuildInRegion(client: Player, block: BlockPos, world_id: number): number {
    const client_name = client.getName();
    const keys = Object.keys(regions);
    for (let index = 0; index < keys.length; index++) {
        const region = regions[keys[index]];
        if(region.world_id === world_id) {
            if(blockInZone(block, region.pos1x, region.pos1y, region.pos1z, region.pos2x, region.pos2y, region.pos2z)) {
                if(region.name === "SPAWN" && getAdminLevel(client) !== 6) {
                    return 1;
                }

                if(region.owner === client_name || getAdminLevel(client) >= 5) {
                    return 2;
                }

                if(getRegionMemberRank(region.name, client_name) >= 1) {
                    return 3;
                }

                if(region.flags[1]['status'] === 'ON') {
                    return 4;
                }

                return 0;
            }
        }
    }
    return 5;
}

export function PlayerInRegion(client: Player, world_id: number): number | Region | null {
    const client_name = client.getName();
    const keys = Object.keys(regions);
    for (let index = 0; index < keys.length; index++) {
        const region = regions[keys[index]];
        if(region.world_id === world_id) {
            if(playerInZone(client, region.pos1x, region.pos1y, region.pos1z, region.pos2x, region.pos2y, region.pos2z)) {
                if(region.name === "SPAWN") {
                    return 1;
                }

                if(getRegionMemberRank(region.name, client_name) >= 1 || region.owner === client_name) {
                    return region;
                }

                if(region.flags[3]['status'] === 'ON') {
                    return region;
                }

                return 0;
            }
        }
    }
    return null;
}

export function AllowPlayerDropInRegion(client: Player, world_id: number): boolean | number {
    const client_name = client.getName();
    const keys = Object.keys(regions);
    for (let index = 0; index < keys.length; index++) {
        const region = regions[keys[index]];
        if(region.world_id === world_id) {
            if(playerInZone(client, region.pos1x, region.pos1y, region.pos1z, region.pos2x, region.pos2y, region.pos2z)) {
                if(region.name === "SPAWN") {
                    return 1;
                }

                if(getRegionMemberRank(region.name, client.getName()) >= 1 || region.owner === client_name) {
                    return true;
                }

                if(region.flags[5]['status'] === 'ON') {
                    return true;
                }

                return false;
            }
        }
    }
    return true;
}

export function AllowPlayerUseInRegion(client: Player, object: Vec3, world_id: number): boolean {
    const client_name = client.getName();
    const keys = Object.keys(regions);
    for (let index = 0; index < keys.length; index++) {
        const region = regions[keys[index]];
        if(region.world_id === world_id) {
            if(blockInZone(object, region.pos1x, region.pos1y, region.pos1z, region.pos2x, region.pos2y, region.pos2z)) {
                if(getRegionMemberRank(region.name, client_name) >= 1 || region.owner === client_name) {
                    return true;
                }

                if(region.flags[3]['status'] === 'ON') {
                    return true;
                }

                return false;
            }
        }
    }
    return true;
}

export function AllowPlayerPvpInRegion(client: Player, world_id: number): boolean | number {
    const client_name = client.getName();
    const keys = Object.keys(regions);
    for (let index = 0; index < keys.length; index++) {
        const region = regions[keys[index]];
        if(region.world_id === world_id) {
            if(playerInZone(client, region.pos1x, region.pos1y, region.pos1z, region.pos2x, region.pos2y, region.pos2z)) {
                if(region.name === "SPAWN") {
                    return 1;
                }

                if(getRegionMemberRank(region.name, client.getName()) >= 1 || region.owner === client_name) {
                    return true;
                }

                if(region.flags[0]['status'] === 'ON') {
                    return true;
                }

                return false;
            }
        }
    }
    return true;
}

export function getRegionWorldId(region_name: string): number {
    return regions[region_name].world_id;
}