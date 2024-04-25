import {BaseAppModel} from '../../BaseAppModel';

export const PERSIST_APP = {localStorageKey: 'recallsAppState'};

export class AppModel extends BaseAppModel {
    static instance: AppModel;
}
