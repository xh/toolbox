import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon/Icon';
import {button} from '@xh/hoist/mobile/cmp/button';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {filler} from '@xh/hoist/cmp/layout';
import {toolbar, toolbarSep} from '@xh/hoist/mobile/cmp/toolbar';
import './PanelsPage.scss';

export const panelPage = hoistCmp.factory({
    render() {
        return panel({
            title: 'Hoist Panel',
            icon: Icon.window(),
            className: 'tb-panels-standard-panel',
            headerItems: [relativeTimestamp({timestamp: Date.now(), prefix: 'Rendered'})],
            items: [
                'This is a Panel with a header (including a title, icon, and headerItem) as well as top and bottom toolbars.'
            ],
            tbar: toolbar(
                button({
                    icon: Icon.add(),
                    text: 'New'
                }),
                toolbarSep(),
                button({
                    icon: Icon.edit(),
                    text: 'Edit',
                    minimal: true
                })
            ),
            bbar: toolbar(
                filler(),
                button({
                    icon: Icon.questionCircle(),
                    text: 'Another Button',
                    minimal: true
                })
            )
        });
    }
});
