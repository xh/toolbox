import classNames from 'classnames';
import {span} from '@xh/hoist/cmp/layout';
import type {PanelBannerSpec} from '@xh/hoist/desktop/cmp/panel';
import type {FaviconModel} from '../../FaviconModel';
import type {FaviconPreviewId} from '../../lib/Checks';

/**
 * Warning banners for the failed checks a preview flags - for that preview panel's `banner`, shown
 * along the bottom of the tile.
 *
 * Banners are compact and held to one line, so each has a fixed height that the tiles reserve
 * room for (see `Favicons.scss`) - toggling a warning must not move the previews grid. The
 * advice on how to fix it shows as the banner's tooltip.
 */
export function checkBanners(model: FaviconModel, preview: FaviconPreviewId): PanelBannerSpec[] {
    return model.failedChecksFor(preview).map(({warning, advice}) => ({
        message: span({title: `${warning}. ${advice}`, item: warning}),
        intent: 'warning',
        position: 'bottom',
        compact: true,
        wrap: false
    }));
}

/** Panel className for a preview tile, with a modifier while it shows check banners. */
export function tileCls(model: FaviconModel, preview: FaviconPreviewId, cls: string): string {
    return classNames(cls, {'tb-fav-tile--flagged': model.failedChecksFor(preview).length > 0});
}
