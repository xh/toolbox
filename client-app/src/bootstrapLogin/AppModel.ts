import {HoistAppModel, XH} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';

export class AppModel extends HoistAppModel {
    static instance: AppModel;

    constructor() {
        super();
        wait(2000).then(() => this.navigateBasedOnDevice());
    }

    private navigateBasedOnDevice(): void {
        window.open(XH.isPhone ? '/mobile' : '/app', '_self');
    }
}
