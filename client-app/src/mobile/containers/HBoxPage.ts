import {box, hbox} from '@xh/hoist/cmp/layout';
import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {exampleScreen} from '../cmp/example/ExampleScreen';

export const hboxPage = hoistCmp.factory({
    render() {
        const defaults = {padding: 10, className: 'tb-containers-box'};

        return exampleScreen({
            title: 'HBox',
            icon: Icon.box(),
            description: [
                '`HBox` lays out its children in a horizontal row - a thin wrapper over `Box`',
                '(`flexDirection: row`) that exposes flexbox and Hoist layout props such as `flex`,',
                '`width`, and `gap` directly as component props, as shown by the mix of flexed and',
                'fixed-width boxes below.'
            ],
            links: [
                {url: '$TB/client-app/src/mobile/containers/HBoxPage.ts', notes: 'This example.'},
                {
                    url: '$HR/cmp/layout/README.md#core-components',
                    text: 'Layout docs',
                    notes: 'Layout containers guide.'
                },
                {url: '$HR/cmp/layout/Box.ts', notes: 'The Box component and its layout props.'}
            ],
            item: panel({
                className: 'tb-containers-page',
                item: hbox(
                    box({...defaults, flex: 1, item: 'flex: 1'}),
                    box({...defaults, width: 80, item: 'width: 80'}),
                    box({...defaults, flex: 2, item: 'flex: 2'})
                )
            })
        });
    }
});
