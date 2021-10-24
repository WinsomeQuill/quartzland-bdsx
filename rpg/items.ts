import { items } from ".";

export class RpgItem {
    protected name: string;
    protected description: string;
    protected type: number;
    protected price: number;
    private count: number;

    constructor(count: number) {
        this.count = count;
    }

    getName(): string {
        return this.name;
    }

    getDescription(): string {
        return this.description;
    }

    getType(): number {
        return this.type;
    }

    getPrice(): number {
        return this.price;
    }

    getCount(): number {
        return this.count;
    }

    setCount(count: number): void {
        this.count = count;
    }

    addCount(count: number): void {
        this.count += count;
    }

    takeCount(count: number): void {
        this.count -= count;
    }
}

export class RpgItemCopper extends RpgItem {
    name = "Медь";
    description = "Обычная руда. Можно найти ломая камень.";
    type = 1;
    price = 70;
}

export class RpgItemEssenceOfIce extends RpgItem {
    name = "Эссенция Льда";
    description = "Можно найти ломая лёд.";
    type = 1;
    price = 80;
}

export class RpgItemSoulStone extends RpgItem {
    name = "Камень Душ";
    description = "Магический камень в котором заточена душа.";
    type = 2;
    price = 2620;
}

export class RpgItemMagicPollen extends RpgItem {
    name = "Магическая Пыльца";
    description = "Можно найти в листве деревьев.";
    type = 2;
    price = 1610;
}

export class RpgItemBlueCrystal extends RpgItem {
    name = "Синий Кристалл";
    description = "Кристалл которым пользовались много лет назад. Можно найти в алмазах.";
    type = 3;
    price = 8712;
}

export class RpgItemSealOfTheDamned extends RpgItem {
    name = "Печать Проклятых";
    description = "Раньше использовали для упокаивания метрвых душ.";
    type = 3;
    price = 7395;
}

// export class RpgItemText extends RpgItem {
//     name = "Медь";
//     description = "Обычная руда. Можно найти ломая камень.";
//     type = 1;
//     price = 70;
// }

export function convertRpgItemSqlToClass(item_name: string, item_count: number): RpgItem | null {
    switch (item_name) {
        case items[0]:
            return new RpgItemCopper(item_count);
        case items[1]:
            return new RpgItemEssenceOfIce(item_count);
        case items[2]:
            return new RpgItemSoulStone(item_count);
        case items[3]:
            return new RpgItemMagicPollen(item_count);
        case items[4]:
            return new RpgItemBlueCrystal(item_count);
        case items[5]:
            return new RpgItemSealOfTheDamned(item_count);
    }

    return null;
}