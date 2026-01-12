import {HoistAppModel, XH} from '@xh/hoist/core';
import {makeObservable, observable} from '@xh/hoist/mobx';

export class BaseAppModel extends HoistAppModel {
    /** Observable relay of appMenuButtonWithUserProfile preference. */
    @observable renderWithUserProfile: boolean;

    /** Suppress version bar footer when app is running in an iframe (example app browser). */
    override get supportsVersionBar(): boolean {
        return window.self === window.top;
    }

    constructor() {
        super();
        makeObservable(this);
        this.renderWithUserProfile = XH.getPref('appMenuButtonWithUserProfile') ?? false;
    }

    override async initAsync() {
        await super.initAsync();
        XH.fetchService.autoGenCorrelationIds = true;
    }
}
