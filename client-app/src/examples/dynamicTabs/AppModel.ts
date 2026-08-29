import {BaseAppModel} from '../../BaseAppModel';

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    override getRoutes() {
        return [
            {
                name: 'default',
                path: '/dynamicTabs',
                children: [
                    {name: 'home', path: '/home'},
                    {name: 'settings', path: '/settings'},
                    {name: 'about', path: '/about'},
                    {name: 'item', path: '/item/:id'}
                ]
            }
        ];
    }
}
