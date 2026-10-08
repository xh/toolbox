import {HoistAppModel, XH} from '@xh/hoist/core';

export class BaseAppModel extends HoistAppModel {
    /** True to render the app menu button with the user's profile pic. Observable via its pref. */
    get renderWithUserProfile(): boolean {
        return XH.getPref('appMenuButtonWithUserProfile') ?? false;
    }

    /** Suppress version bar footer when app is running in an iframe (example app browser). */
    override get supportsVersionBar(): boolean {
        return window.self === window.top;
    }
}
