import {box, vbox} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {exampleScreen} from '../cmp/example/ExampleScreen';

export const vboxPage = hoistCmp.factory({
    render() {
        const defaults = {padding: 10, className: 'tb-containers-box'};

        return exampleScreen({
            title: 'VBox',
            icon: Icon.box(),
            description: [
                '`VBox` lays out its children in a vertical column - a thin wrapper over `Box`',
                '(`flexDirection: column`) that exposes flexbox and Hoist layout props such as `flex`,',
                '`height`, and `gap` directly as component props, as shown by the mix of flexed and',
                'fixed-height boxes below.'
            ],
            links: [
                {url: '$TB/client-app/src/mobile/containers/VBoxPage.ts', notes: 'This example.'},
                {
                    url: '$HR/cmp/layout/README.md#core-components',
                    text: 'Layout docs',
                    notes: 'Layout containers guide.'
                },
                {url: '$HR/cmp/layout/Box.ts', notes: 'The Box component and its layout props.'}
            ],
            item: panel({
                className: 'tb-containers-page',
                item: vbox(
                    box({...defaults, flex: 1, item: 'flex: 1'}),
                    box({...defaults, height: 80, item: 'height: 80'}),
                    box({...defaults, flex: 2, item: 'flex: 2'})
                )
            })
        });
    }
});
