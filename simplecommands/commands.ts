import { CommandRawText } from "bdsx/bds/command";
import { command } from "bdsx/command";
// import { Permissions } from 'bdsx/permissions';

export async function regCmd(): Promise<void> {
    command.register('id', 'Информация о игроке по ID').overload(() => {
        // pass
    }, { target: CommandRawText });

    command.register('coords', 'Узнать свои координаты').overload(() => {
        // pass
    }, { });

    command.register('report', 'Отправить жалобу администрации сервера').overload(() => {
        // pass
    }, { message: CommandRawText });

    command.register('spawn', 'Вернутся на спавн').overload(() => {
        // pass
    }, { });

    command.register('menu', 'Открыть статистику').overload(() => {
        // pass
    }, { });

    command.register('rg menu', 'Управление регионами').overload(() => {
        // pass
    }, { });

    command.register('rg pos1', 'Установить первую точку региона').overload(() => {
        // pass
    }, { });

    command.register('rg pos2', 'Установить вторую точку региона').overload(() => {
        // pass
    }, { });

    command.register('rg create', 'Создать регион').overload(() => {
        // pass
    }, { name: CommandRawText });

    command.register('clan', 'Управление кланом').overload(() => {
        // pass
    }, { });

    command.register('c', 'Написать в чат клана').overload(() => {
        // pass
    }, { message: CommandRawText });

    command.register('money', 'Меню вашего бюджета').overload(() => {
        // pass
    }, { });

    command.register('job', 'Меню работ').overload(() => {
        // pass
    }, { });

    // command.register('time', 'Узнать время сервера').overload(() => {
    //     // pass
    // }, { });

    command.register('donate', 'Донат меню').overload(() => {
        // pass
    }, { });

    command.register('sethome', 'Установить точку дома').overload(() => {
        // pass
    }, { });

    command.register('home', 'Телепортироваться домой').overload(() => {
        // pass
    }, { });

    // const commandPerm = Permissions.registerPermission("command", "Minecraft commands", Permissions.registerPermission("minecraft", "Minecraft data", null, false), false);
    // Permissions.registerPermission("me", "Vanilla me command", commandPerm, false);
}