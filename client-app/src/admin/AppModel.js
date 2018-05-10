import {AppModel as HoistAdminAppModel} from 'hoist/admin';

export class AppModel extends HoistAdminAppModel {

    get enableLogout() {return true}

}