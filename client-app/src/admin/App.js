import {App as HoistAdminApp} from '@xh/hoist/admin/App';

class AppClass extends HoistAdminApp {
    get enableLogout() {return true}
}
export const App = new AppClass();
