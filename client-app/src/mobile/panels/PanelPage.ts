import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon/Icon';
import {button} from '@xh/hoist/mobile/cmp/button';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {filler} from '@xh/hoist/cmp/layout';
import {toolbar, toolbarSep} from '@xh/hoist/mobile/cmp/toolbar';
import {exampleScreen} from '../cmp/example/ExampleScreen';
import './PanelsPage.scss';

export const panelPage = hoistCmp.factory({
    render() {
        return exampleScreen({
            title: 'Panels',
            icon: Icon.window(),
            description: [
                '`Panel` is a core building block for layouts in Hoist. It supports an optional header',
                'bar with an icon, title, and custom header items, props for top and bottom toolbars,',
                'and an optional model to manage its sizing.',
                '',
                'See the Scrollable tab for built-in handling of overflowing content.'
            ],
            links: [
                {url: '$TB/client-app/src/mobile/panels/PanelPage.ts', notes: 'This example.'},
                {url: '$HR/mobile/cmp/panel/Panel.ts', text: 'Panel source'}
            ],
            item: panel({
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
            })
        });
    }
});
