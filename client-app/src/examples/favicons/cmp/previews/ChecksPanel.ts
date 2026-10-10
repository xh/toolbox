import {filler, hbox, span, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {uniq} from 'lodash';
import {FaviconModel} from '../../FaviconModel';
import {PREVIEW_TITLES} from '../../lib/Checks';

/**
 * Design checks - contrast and stroke weight - each with its measured value. A failed check is
 * flagged with a warning banner on the preview that shows the problem, so this panel stays a calm
 * summary that names where to look: every check is always listed, keeping its layout stable.
 */
export const checksPanel = hoistCmp.factory({
    displayName: 'ChecksPanel',
    model: uses(FaviconModel),

    render({model}) {
        const {checks} = model,
            failed = checks.filter(it => it.warning),
            failCount = failed.length,
            flaggedOn = uniq(failed.map(it => PREVIEW_TITLES[it.preview])).join(' and ');

        return panel({
            title: 'Checks',
            icon: failCount ? Icon.warning({intent: 'warning'}) : Icon.checkCircle(),
            compactHeader: true,
            className: 'tb-fav-checks',
            items: [
                span({
                    className: 'tb-fav-checks__summary',
                    item: failCount
                        ? `${failCount === 1 ? 'One check needs' : `${failCount} checks need`} a look - flagged on ${flaggedOn}.`
                        : 'Looking sharp - good contrast, and solid strokes at every size.'
                }),
                vbox({
                    className: 'tb-fav-checks__list',
                    items: checks.map(({label, value, warning, advice}) =>
                        hbox({
                            key: label,
                            className: 'tb-fav-checks__item',
                            title: warning ? `${warning}. ${advice}` : null,
                            items: [
                                warning
                                    ? Icon.warning({intent: 'warning'})
                                    : Icon.checkCircle({intent: 'success'}),
                                span(label),
                                filler(),
                                span({className: 'tb-fav-chip', item: value})
                            ]
                        })
                    )
                })
            ]
        });
    }
});
