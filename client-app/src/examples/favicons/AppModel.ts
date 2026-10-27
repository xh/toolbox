import type {InitContext} from '@xh/hoist/core';
import {managed, XH} from '@xh/hoist/core';
import {BaseAppModel} from '../../BaseAppModel';
import {FaviconModel} from './FaviconModel';
import {GlyphService} from './svc/GlyphService';

export class AppModel extends BaseAppModel {
    static instance: AppModel;

    /** Created once `GlyphService` is installed, so it can rely on every glyph being present. */
    @managed faviconModel: FaviconModel;

    override async initAsync(ctx: InitContext) {
        await super.initAsync(ctx);
        await XH.installServicesAsync([GlyphService], ctx);
        this.faviconModel = new FaviconModel();
    }
}
