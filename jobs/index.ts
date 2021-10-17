import { addCommas, addJobLevelAndExp, addMoney, getJobName, getMoney, getPlayerByName,
    getVipLevel,
    green, info, Percent_Minus, randomBetweenTwoNumbers, red, sendMessage, sendPopup, sendTitle,
    takeMoney, white, yellow } from "../management/index";
import { AllowPlayerBuildInRegion } from "../regions/manager";
import { events } from "bdsx/event";
import { Player } from "bdsx/bds/player";
import { mainForm } from "./forms";
import { CANCEL } from "bdsx/common";
import { Vec3 } from "bdsx/bds/blockpos";
import { AttributeId } from "bdsx/bds/attribute";
import { playerLog } from "../logs";
import { MobEffectIds } from "bdsx/bds/effects";

const miner_blocks: number[] = [1, 2, 3, 12, 13];
const miner_blocks_2: number[] = [14, 15, 16, 56, 73, 129];
const builder_blocks: string[] = [
    'minecraft:stone',
    'minecraft:grass',
    'minecraft:dirt',
    'minecraft:cobblestone',
    'minecraft:planks',
    'minecraft:sandstone',
    'minecraft:wool',
    'minecraft:gold_block',
    'minecraft:iron_block',
    'minecraft:double_stone_slab',
    'minecraft:stone_slab',
    'minecraft:brick_block',
    'minecraft:monster_egg',
    'minecraft:stonebrick',
    'minecraft:brick_stairs',
    'minecraft:stone_brick_stairs',
    'minecraft:wooden_slab',
    'minecraft:stained_hardened_clay'
];

events.serverOpen.on(() => {
    console.log('[+] Jobs enabled!');
});

events.serverClose.on(() => {
    console.log('[-] Jobs disabled!');
});

events.command.on((cmd, origin, ctx) => {
    const label = ctx.command.split(' ');
    const client = getPlayerByName(origin);
    if(client instanceof Player) {
        if(label[0] === '/job') {
            const job_name = getJobName(client);
            if(job_name === null) {
                mainForm(client);
            } else {
                mainForm(client, job_name);
            }
        }
        return;
    }
});

events.blockDestroy.on((e) => {
    const client = e.player;
    const block = e.blockPos;
    const world_id = client.getDimensionId();

    if(client instanceof Player) {
        if(client.getGameType() === 0) {
            if(!AllowPlayerBuildInRegion(client, block, world_id)) {
                return;
            }

            switch (getJobName(client)) {
                case 'miner':
                    addJobLevelAndExp(client);
                    break;

                case 'treecutter':
                    addJobLevelAndExp(client);
                    break;

                case 'gardener':
                    addJobLevelAndExp(client);
                    break;
            }
        }
    }
});

events.blockPlace.on((e) => {
    const client = e.player;
    const block = e.block.getName();
    const block_pos = e.blockPos;
    const world_id = client.getDimensionId();

    if(client instanceof Player) {
        if(client.getGameType() === 0) {
            if(!AllowPlayerBuildInRegion(client, block_pos, world_id)) {
                return;
            }

            switch (getJobName(client)) {
                case 'builder':
                    for (let index = 0; index < builder_blocks.length; index++) {
                        if(block === builder_blocks[index]) {
                            addJobLevelAndExp(client);
                            break;
                        }
                    }
                    break;
            }
        }
    }
});

events.playerAttack.on((e) => {
    const client = e.victim;
    const attacker = e.player;

    if(attacker.getGameType() !== 0 && attacker.getGameType() !== 2) {
        return CANCEL;
    }

    if(client.getHealth() <= 0) {
        if(getJobName(attacker) === 'killer') {
            const money: number = randomBetweenTwoNumbers(500, 100);
            const client_name = client.getName();
            const attacker_name = attacker.getName();
            addMoney(attacker, money);
            sendPopup(attacker, `+${money}`);
            addJobLevelAndExp(attacker, true);
            playerLog(attacker_name, `Получил ${money} Поликов за убийство игрока ${client_name}!`);
            sendMessage(attacker, `${info} Вы получили ${green}${money}${white} Поликов за убийство игрока ${yellow}${client_name}${white}!`);
        }
    }
});

events.entityHurt.on((e) => {
    const client = e.entity;
    if(client instanceof Player) {

        if(client.getGameType() !== 0 && client.getGameType() !== 2) {
            return CANCEL;
        }

        if(e.damage >= client.getHealth()) {
            const client_name = client.getName();
            client.setGameType(3);
            const sum = getMoney(client);
            client.setAttribute(AttributeId.Health, 1);
            const vip_lvl = getVipLevel(client);
            client.removeEffect(MobEffectIds.Absorption);
            client.removeEffect(MobEffectIds.BadOmen);
            client.removeEffect(MobEffectIds.Blindness);
            client.removeEffect(MobEffectIds.ConduitPower);
            client.removeEffect(MobEffectIds.Empty);
            client.removeEffect(MobEffectIds.FatalPoison);
            client.removeEffect(MobEffectIds.FireResistant);
            client.removeEffect(MobEffectIds.Haste);
            client.removeEffect(MobEffectIds.HealthBoost);
            client.removeEffect(MobEffectIds.HeroOfTheVillage);
            client.removeEffect(MobEffectIds.Hunger);
            client.removeEffect(MobEffectIds.InstantDamage);
            client.removeEffect(MobEffectIds.InstantHealth);
            client.removeEffect(MobEffectIds.Invisibility);
            client.removeEffect(MobEffectIds.JumpBoost);
            client.removeEffect(MobEffectIds.Levitation);
            client.removeEffect(MobEffectIds.MiningFatigue);
            client.removeEffect(MobEffectIds.Nausea);
            client.removeEffect(MobEffectIds.NightVision);
            client.removeEffect(MobEffectIds.Poison);
            client.removeEffect(MobEffectIds.Regeneration);
            client.removeEffect(MobEffectIds.Resistance);
            client.removeEffect(MobEffectIds.Saturation);
            client.removeEffect(MobEffectIds.SlowFalling);
            client.removeEffect(MobEffectIds.Slowness);
            client.removeEffect(MobEffectIds.Speed);
            client.removeEffect(MobEffectIds.Strength);
            client.removeEffect(MobEffectIds.WaterBreathing);
            client.removeEffect(MobEffectIds.Weakness);
            client.removeEffect(MobEffectIds.Wither);

            sendTitle(client, `${red}WASTED`);
            if(sum >= 5) {
                const new_sum = randomBetweenTwoNumbers(Percent_Minus(sum, 35 - 5 * vip_lvl), 1);
                takeMoney(client, new_sum);
                playerLog(client_name, `Потерял ${addCommas(new_sum.toString())} Поликов! Причина: Смерть!`);
                sendMessage(client, `${info} ${red}Вы погибли ${white}и потеряли ${green}${addCommas(new_sum.toString())}${white} Поликов!${white}\n${info} В следующий раз будьте внимательны!`);
                sendMessage(client, `${info} Положите Полики в банк и тогда Вы их не потеряете в случае смерти! Используйте ${yellow}/money${white}!`);
            } else {
                sendMessage(client, `${info} ${red}Вы погибли!${white}\n${info} В следующий раз будьте внимательны!`);
            }

            setTimeout(() => {
                client.teleport(Vec3.create(318, 189, 315))
                client.setAttribute(AttributeId.PlayerHunger, 20);
                client.setGameType(0);

                if(getMoney(client) > 100) {
                    takeMoney(client, 100);
                    client.setAttribute(AttributeId.Health, 20);
                    playerLog(client_name, `Потерял 100 Поликов! Причина: Лечение после возрождения!`);
                    sendMessage(client, `${info} С вас взяли ${green}100${white} Поликов за лечение!`);
                } else {
                    sendMessage(client, `${info} Лечение отменено из-за недостатка Поликов (Нужно ${green}100${white} Поликов)!`);
                }
            }, 5000);

            return CANCEL;
        }
    }
});