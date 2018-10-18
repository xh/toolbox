import {App as HoistAdminApp} from '@xh/hoist/admin/App';

class AppClass extends HoistAdminApp {
    get enableLogout() {return true}
    loginMessage = 'Contact support@xh.io for information on Hoist\'s bundled Admin Console.';
}
export const App = new AppClass();
