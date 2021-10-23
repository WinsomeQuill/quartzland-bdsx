import { Player } from "bdsx/bds/player";
import { mods } from ".";
import { getRpgMod } from "../management";

// Mods

export class Mod {
    public name: string;
    public description: string;
    private level: number;

    constructor(level: number) {
        this.level = level;
    }

    getName(): string {
        return this.name;
    }

    getDescription(): string {
        return this.description;
    }

    getLevel(): number {
        return this.level;
    }

    setLevel(level: number) {
        this.level = level;
    }
}

export class RpgModShield extends Mod {
    name = "Щит";
    private percent_absorption: number = (7*this.getLevel()) - 3;
    description = `Понижает входящий урон на ${this.percent_absorption} процентов.`;

    getPercentAbsorption(): number {
        return this.percent_absorption;
    }

    setPercentAbsorption(percent: number) {
        this.percent_absorption = percent;
    }

    updatePercentAbsorption() {
        this.percent_absorption = (7*this.getLevel()) - 3;
    }
}

export class RpgModWar extends Mod {
    name = "Войня";
    private percent_damage: number = (8*this.getLevel()) - 7;
    description = `Увеличивает урон по противнику на ${this.percent_damage} процентов.`;

    getPercentDamage(): number {
        return this.percent_damage;
    }

    setPercentDamage(percent: number) {
        this.percent_damage = percent;
    }

    updatePercentDamage() {
        this.percent_damage = (8*this.getLevel()) - 7;
    }
}

export class RpgModThorns extends Mod {
    name = "Шипы";
    private percent_thorns: number = (5*this.getLevel()) - 3;
    description = `Отражает ${this.percent_thorns} процентов входящего урона обратно в противника.`;

    getPercentThorns(): number {
        return this.percent_thorns;
    }

    setPercentThorns(percent: number) {
        this.percent_thorns = percent;
    }

    updatePercentThorns() {
        this.percent_thorns = (5*this.getLevel()) - 3;
    }
}

export class RpgModLunge extends Mod {
    name = "Выпад";
    private percent_lunge: number = this.getLevel() + 1;
    description = `Отбрасывает противника на ${this.percent_lunge} метров назад.`;

    getValueLunge(): number {
        return this.percent_lunge;
    }

    setValueLunge(percent: number) {
        this.percent_lunge = percent;
    }

    updateValueLunge() {
        this.percent_lunge = this.getLevel() + 1;
    }
}

export class RpgModCorrosion extends Mod {
    name = "Коррозия";
    private percent_text2: number = this.getLevel() + 1;
    description = `Понижает энергию противника на ${this.percent_text2} процентов.`;

    getPercentCorrosion(): number {
        return this.percent_text2;
    }

    setPercentCorrosion(percent: number) {
        this.percent_text2 = percent;
    }

    updatePercentCorrosion() {
        this.percent_text2 = this.getLevel() + 1;
    }
}

export class RpgModShock extends Mod {
    name = "Шок";
    private time_shock: number = this.getLevel() * 0.5;
    description = `Вводит противника в шоковое состояние на ${this.time_shock} секунд. Во время шока, все атаки противника не будут наносить урона.`;

    getTimeShock(): number {
        return this.time_shock;
    }

    setTimeShock(time: number) {
        this.time_shock = time;
    }

    updateTimeShock() {
        this.time_shock = this.getLevel() + 1;
    }
}

export class RpgModLeakage extends Mod {
    name = "Утекание";
    private percent_leakage: number = this.getLevel() + 1;
    description = `Восстанавливает ${this.percent_leakage} процентов здоровья после успешной атаки.`;

    getPercentLeakage(): number {
        return this.percent_leakage;
    }

    setPercentLeakage(percent: number) {
        this.percent_leakage = percent;
    }

    updatePercentLeakage() {
        this.percent_leakage = this.getLevel() + 1;
    }
}

export class RpgModGiftOfLife extends Mod {
    name = "Дар Жизни";
    private percent_giftoflife: number = this.getLevel() + 1;
    description = `Увеличивает маскимальное здоровье на ${this.percent_giftoflife} процентов.`;

    getPercentGiftOfLife(): number {
        return this.percent_giftoflife;
    }

    setPercentGiftOfLife(percent: number) {
        this.percent_giftoflife = percent;
    }

    updatePercentGiftOfLife() {
        this.percent_giftoflife = this.getLevel() + 1;
    }
}

// Mods 2

export class RpgModResuscitation extends Mod {
    name = "Реанимация";
    private percent_resuscitation: number = this.getLevel() * 20;
    description = `Набирает ${this.percent_resuscitation} процентов энергии во время боя. Кд: 12 секунд.`;

    getPercentResuscitation(): number {
        return this.percent_resuscitation;
    }

    setPercentResuscitation(percent: number) {
        this.percent_resuscitation = percent;
    }

    updatePercentResuscitation() {
        this.percent_resuscitation = this.getLevel() + 1;
    }
}

// export class RpgModText1 extends Mod {
//     private percent_text2: number = this.getLevel() + 1;
//     description = `Отбрасывает противника на ${this.percent_text2} метров назад.`;

//     getPercentText1(): number {
//         return this.percent_text2;
//     }

//     setPercentText1(percent: number) {
//         this.percent_text2 = percent;
//     }

//     updatePercentText1() {
//         this.percent_text2 = this.getLevel() + 1;
//     }
// }

export function useMod(client: Player): number {
    const [mod, level] = getRpgMod(client);
    switch (mod) {
        case mods[0]: //Щит

        case mods[1]: //Войня
            return 2;
    }
    return 0;
}