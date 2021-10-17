import { FormButton, ModalForm, SimpleForm } from "bdsx/bds/form";
import { Player } from "bdsx/bds/player";
import { playerLog } from "../logs";
import { clearActiveJob, error, getJobExp, getJobLevel, getJobLimitExp,
    sendMessage, setJob, setJobExp, setJobLevel, success, white, yellow } from "../management";
import { clearActiveJobSql, getActiveJobSql, setActiveJobSql, setJobLevelAndExpSql } from "../sqlmanager";

export function mainForm(client: Player, job_name = ''): void {
    const form = new SimpleForm();
    form.setTitle('Работы');

    if(job_name === '') {
        form.setContent('Вы никем не работаете!');
    } else {
        switch (job_name) {
            case 'miner':
                form.setContent(`Вы работаете - Шахтером\nУровень: [ ${getJobLevel(client)} / 5 ]\nОпыт: [ ${getJobExp(client)} / ${getJobLimitExp(client)} ]`);
                break;

            case 'treecutter':
                form.setContent(`Вы работаете - Дровосеком\nУровень: [ ${getJobLevel(client)} / 5 ]\nОпыт: [ ${getJobExp(client)} / ${getJobLimitExp(client)} ]`);
                break;

            case 'builder':
                form.setContent(`Вы работаете - Строителем\nУровень: [ ${getJobLevel(client)} / 5 ]\nОпыт: [ ${getJobExp(client)} / ${getJobLimitExp(client)} ]`);
                break;

            case 'killer':
                form.setContent(`Вы работаете - Убийцей\nУровень: [ ${getJobLevel(client)} / 5 ]\nОпыт: [ ${getJobExp(client)} / ${getJobLimitExp(client)} ]`);
                break;

            case 'gardener':
                form.setContent(`Вы работаете - Садовником\nУровень: [ ${getJobLevel(client)} / 5 ]\nОпыт: [ ${getJobExp(client)} / ${getJobLimitExp(client)} ]`);
                break;
        }
    }

    form.addButton(new FormButton(`Список работ`));

    if(job_name !== '') {
        form.addButton(new FormButton(`Уйти с работы`));
    }

    form.addButton(new FormButton(`Выход`));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            // pass
        } else {
            if(job_name !== '') {
                switch (data.response) {
                    case 0:
                        jobListForm(client, job_name);
                        break;

                    case 1:
                        jobLeaveForm(client, job_name);
                        break;

                    case 2:
                        break;
                }
            } else {
                switch (data.response) {
                    case 0:
                        jobListForm(client);
                        break;

                    case 1:
                        break;
                }
            }
        }
    });
}

export function jobListForm(client: Player, job_name = ''): void {
    const form = new SimpleForm();
    form.setTitle('Список работ');
    form.addButton(new FormButton('Шахтер'));
    form.addButton(new FormButton('Дровосек'));
    form.addButton(new FormButton('Строитель'));
    form.addButton(new FormButton('Убийца'));
    form.addButton(new FormButton('Садовник'));
    form.addButton(new FormButton('Назад'));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            mainForm(client, job_name);
        } else {
            switch (data.response) {
                case 0:
                    jobDescriptionAndJoinForm(client, job_name, 'miner');
                    break;

                case 1:
                    jobDescriptionAndJoinForm(client, job_name, 'treecutter');
                    break;

                case 2:
                    jobDescriptionAndJoinForm(client, job_name, 'builder');
                    break;

                case 3:
                    jobDescriptionAndJoinForm(client, job_name, 'killer');
                    break;

                case 4:
                    jobDescriptionAndJoinForm(client, job_name, 'gardener');
                    break;

                case 5:
                    mainForm(client, job_name);
                    break;
            }
        }
    });
}

export function jobDescriptionAndJoinForm(client: Player, job_name = '', select_job:string): void {
    const form = new SimpleForm();
    let msg_job = '';
    switch (select_job) {
        case 'miner':
            form.setTitle(`Шахтер`);
            msg_job = 'Шахтера';
            break;

        case 'treecutter':
            form.setTitle(`Дровосек`);
            msg_job = 'Дровосека';
            break;

        case 'builder':
            form.setTitle(`Строитель`);
            msg_job = 'Строителя';
            break;

        case 'killer':
            form.setTitle(`Убийца`);
            msg_job = 'Убийцей';
            break;

        case 'gardener':
            form.setTitle(`Садовник`);
            msg_job = 'Садовника';
            break;
    }

    form.addButton(new FormButton('Устроиться на работу'));
    form.addButton(new FormButton('Подробней о работе'));
    form.addButton(new FormButton('Назад'));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            jobListForm(client, job_name);
        } else {
            switch (data.response) {
                case 0:
                    if(job_name === select_job) {
                        sendMessage(client, `${error} Вы уже работаете на данной работе${white}!`);
                    } else {
                        if(job_name !== '') {
                            sendMessage(client, `${error} Вы уже работаете на другой работе${white}!`);
                        } else {
                            const client_name = client.getName();
                            const data = await getActiveJobSql(client_name);
                            playerLog(client_name, `Устроился на работу ${msg_job}!`);
                            setJobLevel(client, data[0]['level']);
                            setJobExp(client, data[0]['exp']);
                            sendMessage(client, `${success} Вы устроились на работу ${yellow}${msg_job}${white}!`);
                            setActiveJobSql(client_name, select_job);
                            setJob(client, select_job);
                        }
                    }
                    break;

                case 1:
                    jobDescriptionForm(client, job_name, select_job)
                    break;

                case 2:
                    jobListForm(client, job_name);
                    break;
            }
        }
    });
}

export function jobDescriptionForm(client: Player, job_name = '', select_job:string): void {
    const form = new SimpleForm();
    switch (select_job) {
        case 'miner':
            form.setTitle(`Описание работы - Шахтер`);
            form.setContent('§6Miner §7(Шахтер) §f– Ломайте §bруды§f, §bземлю§f, §bбулыжник§f, §bпесок §fи получайте за это деньги!');
            break;

        case 'treecutter':
            form.setTitle(`Описание работы - Дровосек`);
            form.setContent('§6TreeCutter §7(Дровосек) §f– Иногда на сервере идет дождь или снег, и чтобы согреться , стоит растопить печку. §bРубите дерево§f и зарабатывайте деньги');
            break;

        case 'builder':
            form.setTitle(`Описание работы - Строитель`);
            form.setContent('§6Builder §7(Строитель) §f– Скалы, горы, ямы... ну прям средневековье какое-то :). §bЗаймитесь архитектурой §bи зарабатывайте на этом!');
            break;

        case 'killer':
            form.setTitle(`Описание работы - Убийца`);
            form.setContent('§6Killer §7(Убийца) §f– Многие считают §bPvP §fгрифферством, но это не так. Быть убийцей - продуктивно. Убивай игроков, так еще и получай деньги!');
            break;

        case 'gardener':
            form.setTitle(`Описание работы - Садовник`);
            form.setContent('§6Gardener §7(Садовник) §f– Казалось, нет ничего проще, чем добывать листву. Однако растет она далеко не везде. Работа для кропотливых игроков!');
            break;
    }

    form.addButton(new FormButton('Назад'));
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            jobDescriptionAndJoinForm(client, job_name, select_job)
        } else {
            switch (data.response) {
                case 0:
                    jobDescriptionAndJoinForm(client, job_name, select_job)
                    break;
            }
        }
    });
}

export function jobLeaveForm(client: Player, job_name: string): void {
    const form = new ModalForm();
    form.setTitle('Подтверждение');
    form.setContent('Вы действительно хотите уйти с работы?')
    form.setButtonConfirm('Да');
    form.setButtonCancel('Нет');
    form.sendTo(client.getNetworkIdentifier(), async (data) => {
        if(data.response === null) {
            mainForm(client, job_name);
        } else {
            if(data.response === true) {
                const client_name = client.getName();
                setJobLevelAndExpSql(client_name, getJobLevel(client), getJobExp(client), job_name);
                clearActiveJobSql(client_name, job_name);
                clearActiveJob(client);
                switch (job_name) {
                    case 'miner':
                        playerLog(client_name, `Ушел с работы Шахтера!`);
                        sendMessage(client, `${success} Вы ушли с работы ${yellow}Шахтера${white}!`);
                        break;

                    case 'treecutter':
                        playerLog(client_name, `Ушел с работы Дровосека!`);
                        sendMessage(client, `${success} Вы ушли с работы ${yellow}Дровосека${white}!`);
                        break;

                    case 'builder':
                        playerLog(client_name, `Ушел с работы Строителя!`);
                        sendMessage(client, `${success} Вы ушли с работы ${yellow}Строителя${white}!`);
                        break;

                    case 'killer':
                        playerLog(client_name, `Ушел с работы Убийцы!`);
                        sendMessage(client, `${success} Вы ушли с работы ${yellow}Убийцы${white}!`);
                        break;

                    case 'gardener':
                        playerLog(client_name, `Ушел с работы Садовника!`);
                        sendMessage(client, `${success} Вы ушли с работы ${yellow}Садовника${white}!`);
                        break;
                }
            }
        }
    });
}