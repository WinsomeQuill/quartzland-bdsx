import { addRpgItemSql, getRpgItemSql, getRpgItemsSql, updateRpgItemSql } from "../sqlmanager";
import { convertRpgItemSqlToClass, RpgItem } from "./items";

export const rpg_inventory: { [client_name: string]: RpgItem[]; } = { };

export function rpgAddItem(client_name: string, item: RpgItem): void {
    getRpgItemSql(client_name, item)
        .then((result) => {
            if(result[0] !== undefined && result[0] !== null) {
                addRpgItemSql(client_name, item, item.getCount());
            }

            for (let index = 0; index < rpg_inventory[client_name].length; index++) {
                if(rpg_inventory[client_name][index].getName() === item.getName()) {
                    updateRpgItemSql(client_name, item.getName(), rpg_inventory[client_name][index].getCount() + item.getCount());
                    return;
                }
            }
        })
        .catch((err) => {
            console.error(err);
        });
    rpg_inventory[client_name].push(item);
}

export function rpgSetCountItem(client_name: string, item_name: string, count: number): void {
    for (let index = 0; index < rpg_inventory[client_name].length; index++) {
        if(rpg_inventory[client_name][index].getName() === item_name) {
            rpg_inventory[client_name][index].setCount(count);
            updateRpgItemSql(client_name, item_name, count);
            return;
        }
    }
}

export function rpgTakeCountItem(client_name: string, item_name: string, count: number): void {
    for (let index = 0; index < rpg_inventory[client_name].length; index++) {
        if(rpg_inventory[client_name][index].getName() === item_name) {
            if(rpg_inventory[client_name][index].getCount() < count) {
                rpgRemoveItem(client_name, item_name);
            } else {
                rpg_inventory[client_name][index].takeCount(count);
                updateRpgItemSql(client_name, item_name, rpg_inventory[client_name][index].getCount() - count);
            }
            return;
        }
    }
}

export function rpgRemoveItem(client_name: string, item_name: string): void {
    for (let index = 0; index < rpg_inventory[client_name].length; index++) {
        if(rpg_inventory[client_name][index].getName() === item_name) {
            if (index > -1) {
                rpg_inventory[client_name].splice(index, 1);
                updateRpgItemSql(client_name, item_name, 0);
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
    rpg_inventory[client_name] = [];
    getRpgItemsSql(client_name)
        .then((result) => {
            for (let index = 0; index < result.length; index++) {
                const convert = convertRpgItemSqlToClass(result[index]['name'], result[index]['count']);
                if(convert !== null) {
                    const item: RpgItem = convert;
                    rpg_inventory[client_name].push(item);
                } else {
                    console.error(`rpgInitItems return NULL! Client - ${client_name}`);
                }
            }
        })
        .catch((err) => {
            console.log(err);
        });
}

export function rpgIsExistsItemInInventory(client_name: string, item_name: string): boolean {
    for (let index = 0; index < rpg_inventory[client_name].length; index++) {
        if(rpg_inventory[client_name][index].getName() === item_name) {
            return true;
        }
    }

    return false;
}

export function rpgIsExistsItemForMod(client_name: string, item_name: string, item_count: number): boolean {
    for (let index = 0; index < rpg_inventory[client_name].length; index++) {
        if(rpg_inventory[client_name][index].getName() === item_name &&
            rpg_inventory[client_name][index].getCount() >= item_count) {
            return true;
        }
    }

    return false;
}