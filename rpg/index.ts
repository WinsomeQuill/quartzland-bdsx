import { ActorDamageCause } from "bdsx/bds/actor";
import { AttributeId } from "bdsx/bds/attribute";
import { Player } from "bdsx/bds/player";
import { CANCEL } from "bdsx/common";
import { events } from "bdsx/event";
import { bold, getInfoBarStatus, gold, red, sendPopup, white } from "../management/index";

export enum mods {
    'Щит',
    'Войня',
    'Шипы',
    'Выпад',
    'Коррозия',
    'Шок',
    'Утекание',
    'Дар жизни',
}

export enum mods2 {
    'Реанимация',
}

export enum items {
    'Медь',
    'Эссенция Льда',
    'Камень Душ',
    'Магическая Пыльца',
    'Синий Кристалл',
    'Печать Проклятых',
}

events.serverOpen.on(()=>{
    console.log('[+] RPG Enabled!');
});

events.serverClose.on(()=>{
    console.log('[-] RPG Disabled!');
});

events.entityHurt.on((e)=>{
    const damage = e.damage;
    const client = e.entity;
    const damageCause = e.damageSource.cause;
    if(client instanceof Player) {
        if(getInfoBarStatus(client) === "ON") {
            if(damageCause === ActorDamageCause.BlockExplosion || damageCause === ActorDamageCause.Fall ||
                damageCause === ActorDamageCause.FlyIntoWall || damageCause === ActorDamageCause.Void ||
                damageCause === ActorDamageCause.Wither || damageCause === ActorDamageCause.FallingBlock ||
                damageCause === ActorDamageCause.Anvil || damageCause === ActorDamageCause.EntityAttack) {
                sendPopup(client, `${bold}${white}Получено ${red}${damage}${white} урона!`);
            }
        }
    }
});

events.playerAttack.on((e) => {
    const attacker = e.player;
    const target = e.victim;
    if(attacker.getGameType() !== 0 && attacker.getGameType() !== 2) {
        return CANCEL;
    }

    if(target instanceof Player && attacker instanceof Player) {
        if(target.getHealth() <= 0) {
            if(getInfoBarStatus(target) === "ON") {
                sendPopup(target, `${bold}${white}Получен смертельный урон от ${red}${attacker.getName()}${white}!`);
            }

            if(getInfoBarStatus(attacker) === "ON") {
                sendPopup(attacker, `${bold}${white}Вы нанесли смертельный урон игроку ${red}${target.getName()}${white}!`);
            }
        } else {
            const target_damage = target.getAttribute(AttributeId.AttackDamage);
            const attacker_damage = target.getAttribute(AttributeId.AttackDamage);
            console.log(target_damage, attacker_damage);
        }
    }
});

events.playerCrit.on((e)=>{
    const client = e.player;
    if(getInfoBarStatus(client) === "ON") {
        sendPopup(client, `${bold}${gold}Вы нанесли критический урон!`)
    }
});