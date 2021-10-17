import { Player } from "bdsx/bds/player";
import { CustomForm, FormLabel } from "bdsx/bds/form";
import { bold, networkkick, red, white, yellow, blue } from "../management";

export function muteForm(client: Player, admin: string, mute_gived: string, mute_end: string, mute_expirece: number, mute_reason: string): void {
    const form = new CustomForm();
    form.setTitle(`${bold}Quartz${blue}Land`);
    form.addComponent(new FormLabel(`${red}Вы получили блокировку чата!${white}`));
    form.addComponent(new FormLabel(`Выдал: ${yellow}${admin}${white}`));
    form.addComponent(new FormLabel(`Дата выдачи: ${yellow}${mute_gived}${white}`));
    form.addComponent(new FormLabel(`Дата снятия: ${yellow}${mute_end}${white}`));
    form.addComponent(new FormLabel(`Истекает через: ${yellow}${mute_expirece}${white} минут`));
    form.addComponent(new FormLabel(`Причина: ${yellow}${mute_reason}${white}`));
    form.addComponent(new FormLabel(`Если Вы не согласны с наказание, то создайте жалобу на нашем форуме!`));
    form.addComponent(new FormLabel(`Наш форум - Forum.quartzland.ru`));
    form.sendTo(client.getNetworkIdentifier(), async () => {
        // pass
    });
}

export function warnForm(client: Player, admin: string, warn_gived: string, warn_end: string, warn_expirece: number, warn_reason: string, warn_count: number): void {
    const form = new CustomForm();
    form.setTitle(`${bold}Quartz${blue}Land`);
    form.addComponent(new FormLabel(`${red}Вы получили предупреждение!${white}`));
    form.addComponent(new FormLabel(`Предупреждения: ${yellow}${warn_count} / 3${white}`));
    form.addComponent(new FormLabel(`Выдал: ${yellow}${admin}${white}`));
    form.addComponent(new FormLabel(`Дата выдачи: ${yellow}${warn_gived}${white}`));
    form.addComponent(new FormLabel(`Дата снятия: ${yellow}${warn_end}${white}`));
    form.addComponent(new FormLabel(`Истекает через: ${yellow}${warn_expirece}${white} дней`));
    form.addComponent(new FormLabel(`Причина: ${yellow}${warn_reason}${white}`));
    form.addComponent(new FormLabel(`${yellow}Если Вы получите 3 предупреждения, то Ваш аккаунт будет временно заблокирован!${white}`));
    form.addComponent(new FormLabel(`Если Вы не согласны с наказание, то создайте жалобу на нашем форуме!`));
    form.addComponent(new FormLabel(`Наш форум - Forum.quartzland.ru`));
    form.sendTo(client.getNetworkIdentifier(), async () => {
        // pass
    });

    setTimeout(() => {
        networkkick(client.getNetworkIdentifier(), '');
    }, 300);
}

export function banForm(client: Player, admin: string, ban_gived: string, ban_end: string, ban_expirece: number, ban_reason: string): void {
    const form = new CustomForm();
    form.setTitle(`${bold}Quartz${blue}Land`);
    form.addComponent(new FormLabel(`${red}Вы получили блокировку аккаунта!${white}`));
    form.addComponent(new FormLabel(`Выдал: ${yellow}${admin}${white}`));
    form.addComponent(new FormLabel(`Дата выдачи: ${yellow}${ban_gived}${white}`));
    form.addComponent(new FormLabel(`Дата снятия: ${yellow}${ban_end}${white}`));
    form.addComponent(new FormLabel(`Истекает через: ${yellow}${ban_expirece}${white} дней`));
    form.addComponent(new FormLabel(`Причина: ${yellow}${ban_reason}${white}`));
    form.addComponent(new FormLabel(`Если Вы не согласны с наказание, то создайте жалобу на нашем форуме!`));
    form.addComponent(new FormLabel(`Наш форум - Forum.quartzland.ru`));
    form.sendTo(client.getNetworkIdentifier(), async () => {
        // pass
    });

    setTimeout(() => {
        networkkick(client.getNetworkIdentifier(), '');
    }, 300);
}

export function kickForm(client: Player, admin: string, kick_gived: string, kick_reason: string): void {
    const form = new CustomForm();
    form.setTitle(`${bold}Quartz${blue}Land`);
    form.addComponent(new FormLabel(`${red}Вы были кикнуты с сервера!${white}`));
    form.addComponent(new FormLabel(`${yellow}Пожалуйста, перезайдите!${white}`));
    form.addComponent(new FormLabel(`Выдал: ${yellow}${admin}${white}`));
    form.addComponent(new FormLabel(`Дата выдачи: ${yellow}${kick_gived}${white}`));
    form.addComponent(new FormLabel(`Причина: ${yellow}${kick_reason}${white}`));
    form.addComponent(new FormLabel(`Если Вы не согласны с наказание, то создайте жалобу на нашем форуме!`));
    form.addComponent(new FormLabel(`Наш форум - Forum.quartzland.ru`));
    form.sendTo(client.getNetworkIdentifier(), async () => {
        // pass
    });

    setTimeout(() => {
        networkkick(client.getNetworkIdentifier(), '');
    }, 300);
}