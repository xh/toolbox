import {hoistCmp, uses} from '@xh/hoist/core';
import {appBar} from '@xh/hoist/desktop/cmp/appbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {a} from '@xh/hoist/cmp/layout';
import {AppModel} from './AppModel';
import {directoryPanel} from './DirectoryPanel';
import '../../../core/Toolbox.scss';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return panel({
            tbar: appBar({
                icon: Icon.contact({size: '2x', prefix: 'fal'}),
                leftItems: [
                    a({
                        item: 'View contacts for mobile',
                        href: 'http://localhost:3000/contactMobile',
                        target: '_blank'
                    })
                ],
                appMenuButtonProps: {hideLogoutItem: false}
            }),
            item: directoryPanel()
        });
    }
});
