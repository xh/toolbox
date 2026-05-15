import {HoistAppModel, XH} from '@xh/hoist/core';
import {observable} from '@xh/hoist/mobx';

export class BaseAppModel extends HoistAppModel {
    /** Observable relay of appMenuButtonWithUserProfile preference. */
    @observable accessor renderWithUserProfile: boolean;

    /** Suppress version bar footer when app is running in an iframe (example app browser). */
    override get supportsVersionBar(): boolean {
        return window.self === window.top;
    }

    constructor() {
        super();
        this.renderWithUserProfile = XH.getPref('appMenuButtonWithUserProfile') ?? false;
    }
}
