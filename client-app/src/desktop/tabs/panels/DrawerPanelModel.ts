import {HoistModel, managed} from '@xh/hoist/core';
import {DrawerModel} from '@xh/hoist/desktop/cmp/drawer';
import {makeObservable} from '@xh/hoist/mobx';

export class DrawerPanelModel extends HoistModel {
    @managed
    leftDrawerModel = new DrawerModel({
        supportedModes: ['overlay', 'pinned', 'collapsed'],
        defaultMode: 'pinned',
        size: 200
    });

    @managed
    rightDrawerModel = new DrawerModel({
        supportedModes: ['overlay', 'pinned'],
        defaultMode: 'overlay',
        size: 280
    });

    constructor() {
        super();
        makeObservable(this);
    }
}
