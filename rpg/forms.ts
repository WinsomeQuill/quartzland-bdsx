import { AttributeId } from "bdsx/bds/attribute";
import { FormButton, SimpleForm } from "bdsx/bds/form";
import { Player } from "bdsx/bds/player";
import { blue, getRpgAugmentation, getRpgEvolution, getRpgMod, getRpgMod2,
    gold, gray, red, white, yellow, sendMessage, error } from "../management";
import { rpgGetItems, RpgItem } from "./inventory";
import { Mod } from "./mods";

export function rpgMainMenu(client: Player): void {
    const form = new SimpleForm();
    form.setTitle(`RPG Меню`);
    form.addButton(new FormButton("Характеристики"));
    form.addButton(new FormButton("Список предметов"));
    form.addButton(new FormButton("Модификации"));
    form.addButton(new FormButton("Эволюция\nперсонажа"));
    form.addButton(new FormButton("Аугментация\nперсонажа"));
    form.addButton(new FormButton("Помощь"));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            // pass
        } else {
            switch (data.response) {
                case 0:
                    rpgStatsForm(client);
                    break;

                case 1:
                    rpgItemsForm(client);
                    break;

                case 2:
                    rpgModsForm(client);
                    break;

                case 3:

                    break;

                case 4:

                    break;

                case 5:
                    rpgHelpForm(client, 1);
                    break;
            }
        }
    });
}

export function rpgHelpForm(client: Player, page: number = 1): void {
    const form = new SimpleForm();
    form.setTitle(`RPG Помощь`);
    switch(page) {
        case 1:
            form.setContent(`${white}Приветствуем тебя ${yellow}${client.getName()}${white}!
Так-как Вы здесь первый раз, то расскажу, что к чему здесь.
${yellow}Основы${white}:
${gray}> ${blue}Предметы${white} - Они нужны для прокачки ${gold}Эволюции${white} и ${red}Аугментации${white}! Есть три типа предмета: ${blue}Обычный${white}, ${yellow}Редкий${white}, ${red}Легендарный${white}! Чем выше тип предмета, тем сложнее его найти!
${gray}> ${blue} Энергия${white} - Это самый важный параметр твоего персонажа, ведь от него зависит, сработает ли модификация во время боя или нет! Энергия пополняется с каждой успешной атакой по врагу, как только энергия будет полностью заполнена, то следующая успешная атака наложит на противиника модификацию!
${gray}> ${blue} Первая модификация${white} - Это способность твоего персонажа, она тоже играет важную роль в бою! Чем выше уровень модификации, тем сильнее будет эффект! Максимальный уровень 10!
${gray}> ${blue} Вторая модификация${white} - Это второстепенная способность, она открывается после 1 эволюции персонажа! Данная модификация не зависит от энергии персонажа, а срабатывает по шансу после успешной атаки! Модификация может быть заблокирована, если у противника имеется специальная модификация! Максимальный уровень 5!`);
            form.addButton(new FormButton("Далее"));
            break;

        case 2:
            form.setContent(`${gray}> ${blue} Эволюция${white} - От этого параметра зависят все характеристики персонажа, кроме модификаций! Чем выше эволюция, тем сильнее персонаж!
${gray}> ${blue} Аугментация - ${white}Это самый последний и сложный параметр персонажа, открывается после 2 эволюции персонажа! Чтобы прокачать агуметацию, Вам придется запастись терпением, ведь для нее нужный легендарные предметы! Улучшает все характеристики персонажа и повышает модификации на несколько уровеней!`);
            form.addButton(new FormButton("Далее"));
            form.addButton(new FormButton("Назад"));
            break;

        case 3:
            form.setContent(`${yellow}Внешний вид${white}:
В зависимости от характеристик Вашего персонажа, он будет выглядить по особенному. Таким образом Вы сможете узнать на какой стадии развития находится другой игрок.
После первый эволюции ник и прочее над головой будут оранжевого цвета.
После второй эволюции над головой у вас появится специальный символ, который будет означать, что Вы дошли уже до второй эволюции.
Когда Вы откроете аугментацию персонажа, то ник и прочее над головой будут красного цвета, а когда дойдете до последнего уровня аугментации, Вы получите специальный символ!`);
            form.addButton(new FormButton("Назад"));
            break;
    }
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            rpgMainMenu(client);
        } else {
            if(page < 3) {
                switch (data.response) {
                    case 0:
                        rpgHelpForm(client, page + 1);
                        break;

                    case 1:
                        rpgHelpForm(client, page - 1);
                        break;
                }
                return;
            } else {
                switch (data.response) {
                    case 0:
                        rpgHelpForm(client, page - 1);
                        break;
                }
                return;
            }
        }
    });
}

export function rpgStatsForm(client: Player): void {
    const damage = client.getAttribute(AttributeId.AttackDamage);
    const health = client.getAttribute(AttributeId.Health);
    const [mod] = getRpgMod(client);
    const [mod2] = getRpgMod2(client);
    const evolution = getRpgEvolution(client);
    const augmentation = getRpgAugmentation(client);
    let msg: string = `${white}Характеристики персонажа ${yellow}${client.getName()}${white}:
Урон: ${damage}
Здоровье: ${health}
Первая модификация: ${(mod as Mod).getName()} (уровень ${(mod as Mod).getLevel()} / 10)\n`;
    if((mod2 as Mod) === null || (mod2 as Mod).getLevel() === 0) {
        msg += 'Вторая модификация: Нету\n';
    } else {
        msg += `Вторая модификация: ${(mod2 as Mod).getName()} (уровень ${(mod2 as Mod).getLevel()} / 5)\n`;
    }

    if(evolution === 0) {
        msg += 'Эволюция: Нету\n';
    } else {
        msg += `Эволюция: Есть (уровень ${evolution} / 2)`;
    }

    if(augmentation === 0) {
        msg += 'Аугментация: Нету\n';
    } else {
        msg += `Аугментация: Есть (уровень ${augmentation} / 50)`;
    }


    const form = new SimpleForm();
    form.setTitle(`RPG Характеристики`);
    form.setContent(msg);
    form.addButton(new FormButton("Назад"));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {

        } else {
            switch (data.response) {
                case 0:
                    rpgMainMenu(client);
                    break;
            }
        }
    });
}

export function rpgItemsForm(client: Player): void {
    const items = rpgGetItems(client.getName());
    const form = new SimpleForm();
    form.setTitle(`RPG Предметы`);
    form.setContent(`Список предметов для улучшения персонажа.`);
    for (let index = 0; index < items.length; index++) {
        form.addButton(new FormButton(`${items[index].getName()}\n${items[index].getCount()} шт.`));
    }
    form.addButton(new FormButton("Назад"));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {

        } else {
            if(data.response === items.length) {
                rpgMainMenu(client);
            } else {
                rpgItemDescriptionForm(client, items[data.response]);
            }
        }
    });
}

export function rpgItemDescriptionForm(client: Player, item: RpgItem): void {
    let type;
    switch(item.getType()) {
        case 1:
            type = `${blue}Обычный${white}`;
            break;

        case 2:
            type = `${yellow}Редкий${white}`;
            break;

        case 3:
            type = `${gold}Легендарный${white}`;
            break;
    }
    const form = new SimpleForm();
    form.setTitle(`RPG Предмет ${item.getName()}`);
    form.setContent(`Предмет: ${item.getName()}\nРедкость: ${type}\nОписание: ${item.getDescription()}`);
    form.addButton(new FormButton("Назад"));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {

        } else {
            rpgItemsForm(client);
        }
    });
}

export function rpgModsForm(client: Player): void {
    let msg = '';
    const [mod] = getRpgMod(client);
    const [mod2] = getRpgMod2(client);
    if((mod2 as Mod) === null || (mod2 as Mod).getLevel() === 0) {
        msg += 'Вторая модификация: Нету\n';
    } else {
        msg += `Вторая модификация: ${(mod2 as Mod).getName()} (уровень ${(mod2 as Mod).getLevel()} / 5)\nОписание: ${(mod2 as Mod).getDescription()}`;
    }
    const form = new SimpleForm();
    form.setTitle(`RPG Модификации`);
    form.setContent(`Первая модификация: ${(mod as Mod).getName()} (уровень ${(mod as Mod).getLevel()} / 10)
Описание: ${(mod as Mod).getDescription()}\n${msg}`);
    form.addButton(new FormButton("Сменить первую\nмодификацию"));
    form.addButton(new FormButton("Сменить вторую\nмодификацию"));
    form.addButton(new FormButton("Назад"));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {

        } else {
            switch (data.response) {
                case 0:
                    break;

                case 1:
                    if(getRpgEvolution(client) <= 0) {
                        sendMessage(client, `${error} Вы не можете установить вторую модификацию из-за низкого уровня ${gold}Эволюции${white}!`);
                        break;
                    }

                    break;

                case 2:
                    break;
            }
        }
    });
}