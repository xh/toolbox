import {AppModel as HoistAdminAppModel} from '@xh/hoist/admin';

export class AppModel extends HoistAdminAppModel {

    get enableLogout() {return true}

}