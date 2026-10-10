import type {InitContext} from '@xh/hoist/core';
import {managed, XH} from '@xh/hoist/core';
import {BaseAppModel} from '../../BaseAppModel';
import {FaviconModel} from './FaviconModel';
import {loadFaLibraryAsync} from './lib/FaPacks';

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    /** Created once the full FA library has loaded, so it can rely on every glyph being present. */
    @managed faviconModel: FaviconModel;

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);
        await loadFaLibraryAsync().linkTo({
            observer: XH.appLoadObserver,
            message: 'Loading Font Awesome icons...'
        });
        this.faviconModel = new FaviconModel();
    }
}
