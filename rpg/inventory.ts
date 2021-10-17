import { getRpgItemsSql, updateRpgItemSql } from "../sqlmanager";

export class RpgItem {
    private name: string;
    private description: string;
    private type: number;
    private price: number;
    private count: number;

    constructor(name: string, description: string, type: number, price: number, count: number) {
        this.name = name;
        this.description = description;
        this.type = type;
        this.price = price;
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
        this.count += count;
    }
}

export const rpg_inventory: { [client_name: string]: RpgItem[]; } = { };

export function rpgAddCountItem(client_name: string, item: RpgItem, count: number = 0): void {
    for (let index = 0; index < rpg_inventory[client_name].length; index++) {
        if(rpg_inventory[client_name][index].getName() === item.getName()) {
            rpg_inventory[client_name][index].addCount(count);
            updateRpgItemSql(client_name, item, rpg_inventory[client_name][index].getCount() + count);
            return;
        }
    }

    rpg_inventory[client_name].push(item);
}

export function rpgSetCountItem(client_name: string, item: RpgItem, count: number): void {
    for (let index = 0; index < rpg_inventory[client_name].length; index++) {
        if(rpg_inventory[client_name][index].getName() === item.getName()) {
            rpg_inventory[client_name][index].setCount(count);
            updateRpgItemSql(client_name, item, count);
            return;
        }
    }
}

export function rpgTakeCountItem(client_name: string, item: RpgItem, count: number): void {
    for (let index = 0; index < rpg_inventory[client_name].length; index++) {
        if(rpg_inventory[client_name][index].getName() === item.getName()) {
            if(rpg_inventory[client_name][index].getCount() < count) {
                rpgRemoveItem(client_name, item);
            } else {
                rpg_inventory[client_name][index].takeCount(count);
                updateRpgItemSql(client_name, item, rpg_inventory[client_name][index].getCount() - count);
            }
            return;
        }
    }
}

export function rpgRemoveItem(client_name: string, item: RpgItem): void {
    for (let index = 0; index < rpg_inventory[client_name].length; index++) {
        if(rpg_inventory[client_name][index].getName() === item.getName()) {
            if (index > -1) {
                rpg_inventory[client_name].splice(index, 1);
                updateRpgItemSql(client_name, item, 0);
                return;
            }
        }
    }
}

export function rpgGetItems(client_name: string): RpgItem[] {
    const items: RpgItem[] = [];
    for (let index = 0; index < rpg_inventory[client_name].length; index++) {
        items.push(rpg_inventory[client_name][index]);
    }

    return items;
}

export function rpgInitItems(client_name: string): void {
    getRpgItemsSql(client_name)
        .then((result) => {
            for (let index = 0; index < result.length; index++) {
                rpgAddCountItem(client_name, new RpgItem(result[index]['name'], result[index]['description'],
                    result[index]['type'], result[index]['price'], result[index]['count']));
            }
        })
        .catch((err) => {
            console.log(err);
        });

}

export function rpgIsExistsItemInInventory(client_name: string, item: RpgItem): boolean {
    for (let index = 0; index < rpg_inventory[client_name].length; index++) {
        if(rpg_inventory[client_name][index].getName() === item.getName()) {
                return true;
        }
    }

    return false;
}
