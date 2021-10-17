import { Player } from "bdsx/bds/player";
import { events } from "bdsx/event";
import { getPlayerByName, sendMessage, setRegionPlayerPos1, setRegionPlayerPos2, error, success,
    getPlayerPosition, yellow, white, getDistancePositions, getRegionPlayerPos1, green, info,
    getVipLevel, getRegionPlayerPos2, clearRegionPlayerPos, pluginRun } from "../management/index";
import { cacheRegions, AllowPlayerBuildInRegion, AllowPlayerUseInRegion, AllowPlayerPvpInRegion,
    AllowPlayerDropInRegion, createRegion, getCountRegionsPlayer, isCrossOtherRegion, isRegionExists, getRegionFlagStatus, PlayerInRegion } from "./manager";
import { regionMainForm } from "./forms";
import { CANCEL } from "bdsx/common";
import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { Vec3 } from "bdsx/bds/blockpos";
import { DimensionId } from "bdsx/bds/actor";
import { playerLog } from "../logs";

let system: IVanillaServerSystem;

events.serverOpen.on(() => {
    system = server.registerSystem(0, 0);
    cacheRegions();
    pluginRun();
    console.log('[+] Regions enabled!');
});

events.serverClose.on(() => {
    console.log('[-] Regions disabled!');
});

events.blockDestroy.on((e) => {
    const client = e.player;
    const block = e.blockPos;
    const world_id = client.getDimensionId();
    const result = AllowPlayerBuildInRegion(client, block, world_id);
    if(result === 1) {
        return CANCEL;
    }

    if(result === 0) {
        sendMessage(client, `${error} Нельзя ломать/ставить блоки в чужом регионе!`);
        return CANCEL;
    }
});

events.blockPlace.on((e) => {
    const client = e.player;
    const block = e.blockPos;
    // system.getComponent(, 'minecraft:nameable');
    const world_id = client.getDimensionId();
    const result = AllowPlayerBuildInRegion(client, block, world_id);
    if(result === 1) {
        return CANCEL;
    }

    if(result === 0) {
        sendMessage(client, `${error} Нельзя ломать/ставить блоки в чужом регионе!`);
        return CANCEL;
    }
});

events.playerDropItem.on((e) => {
    const client = e.player;
    const world_id = client.getDimensionId();
    const result = AllowPlayerDropInRegion(client, world_id);
    if(result === 1) {
        // pass
    } else {
        if(!result) {
            sendMessage(client, `${error} Нельзя выбрасывать предметы в чужом регионе!`);
            return CANCEL;
        }
    }
});

events.packetBefore(MinecraftPacketIds.InventoryTransaction).on((pk, ni) => {
    const client = ni.getActor();
    if(client === null) return;
    if(pk.transaction.isItemUseTransaction()) {
        const [x, y, z] = getPlayerPosition(client);
        const world_id = client.getDimensionId();
        if(!AllowPlayerUseInRegion(client, Vec3.create(x, y, z), world_id)) {
            return CANCEL;
        }
    }
});

events.playerAttack.on((e) => {
    const client = e.player;
    const target = e.victim;
    if(client instanceof Player && target instanceof Player) {
        const world_id = client.getDimensionId();
        const result = AllowPlayerPvpInRegion(target, world_id);
        if(result === 1) {
            return CANCEL;
        }

        if(!result) {
            sendMessage(client, `${error} Нельзя драться в чужом регионе!`);
            return CANCEL;
        }
    }
});

events.command.on((cmd, origin, ctx) => {
    const label = ctx.command.split(' ');
    const client = getPlayerByName(origin);

    if(client instanceof Player) {
        if(label[0] === '/rg') {
            if(label.length < 2) {
                sendMessage(client, `${error} Используйте /rg menu!`);
                return;
            }

            if(label[1] === 'pos1') {
                setRegionPlayerPos1(client);
                const [x, y, z] = getPlayerPosition(client);
                // bedrockServer.executeCommand(`particle minecraft:dragon_destroy_block ${x} ${y} ${z}`);
                sendMessage(client, `${success} Первая точка установлена на координатах X:${x} Y:${y} Z:${z}!`);
                return;
            }

            const vip_lvl = getVipLevel(client);
            if(label[1] === 'pos2') {
                const [x1, y1, z1] = getPlayerPosition(client);
                const [x2, y2, z2] = getRegionPlayerPos1(client);
                const dist = getDistancePositions(x1, y1, z1, x2, y2, z2);

                if(dist > (vip_lvl + 1) * 40) {
                    sendMessage(client, `${error} Вы выбрали слишком большую зону для региона, пожалуйста, сократите размер региона!`);
                    return;
                }

                setRegionPlayerPos2(client);
                // bedrockServer.executeCommand(`particle minecraft:dragon_destroy_block ${x1} ${y1} ${z1}`);
                sendMessage(client, `${success} Вторая точка установлена на координатах X:${x1} Y:${y1} Z:${z1}!\n${info} Дистация между двумя точками - ${green}${dist}${white}!`);
                return;
            }

            if(label[1] === 'create') {
                if(label[2] === undefined) {
                    sendMessage(client, `${error} Используйте /rg create [название]`);
                    return;
                }

                if(isRegionExists(label[2])) {
                    sendMessage(client, `${error} Регион с таким названием уже существует!`);
                    return;
                }

                if(label[2].length > 30) {
                    sendMessage(client, `${error} Слишком длинное название региона! Максимум 30 символов!`);
                    return;
                }


                const limit = (vip_lvl + 1) * 3;
                if(getCountRegionsPlayer(client) >= limit) {
                    sendMessage(client, `${error} Вы достигли лимита по количеству регионов! Ваш лимит: ${yellow}${limit}${white} регионов!`);
                    return;
                }

                const [pos1x, pos1y, pos1z] = getRegionPlayerPos1(client);
                const [pos2x, pos2y, pos2z] = getRegionPlayerPos2(client);

                if(pos1x === 0 || pos1y === 0 || pos1z === 0 || pos2x === 0 || pos2y === 0 || pos2z === 0) {
                    sendMessage(client, `${error} Не удалось создать регион! Возможно Вы не указали коориднаты! Используйте ${yellow}/rg pos1${white} и ${yellow}/rg pos2${white}!`);
                    return;
                }

                const world_id = client.getDimensionId();
                if(world_id === DimensionId.TheEnd) {
                    sendMessage(client, `${error} Нельзя создать регион в измерении "Край"!`);
                    return;
                }

                const region = isCrossOtherRegion(pos1x, pos1y, pos1z, pos2x, pos2y, pos2z, world_id);
                if(region !== null) {
                    const region_name = region.name;
                    if(getRegionFlagStatus(region_name, "info") === "OFF") {
                        sendMessage(client, `${error} Ваш регион пересикается с другим регионом!`);
                        return;
                    } else {
                        sendMessage(client, `${error} Ваш регион пересикается с регионом под названием ${yellow}${region_name}${white}!`);
                        return;
                    }
                }

                createRegion(label[2], client, 'Описание еще не добавлено!', pos1x, pos1y, pos1z, pos2x, pos2y, pos2z, world_id);
                playerLog(client.getName(), `Создал регион под названием "${label[2]}". 1 позиция: X: ${pos1x} Y: ${pos1y} Z: ${pos1z}. 2 позиция: X: ${pos2x} Y: ${pos2y} Z: ${pos2z}. Мир: ${world_id}`);
                sendMessage(client, `${success} Регион создан и назван как ${yellow}${label[2]}${white}!`);
                clearRegionPlayerPos(client);
                return;
            }

            if(label[1] === 'menu') {
                regionMainForm(client);
                return;
            }

            if(label[1] === 'info') {
                const world_id = client.getDimensionId();
                const region = PlayerInRegion(client, world_id);
                if(region === null) {
                    sendMessage(client, `${error} Вы не находитесь на территории региона!`);
                    return;
                }

                if(region === 1) {
                    sendMessage(client, `${info} Здесь территория спавна!`);
                    return;
                }

                if(region === 0) {
                    sendMessage(client, `${error} Владелец региона предпочел скрыть информацию!`);
                    return;
                }

                if(typeof(region) !== 'number') {
                    sendMessage(client, `${info} Регион: ${yellow}${region.name}${white}\nВладелец: ${yellow}${region.owner}${white}\nОписание: ${yellow}${region.description}${white}`)
                    return;
                }
                return;
            }
            return;
        }
        return;
    }
});