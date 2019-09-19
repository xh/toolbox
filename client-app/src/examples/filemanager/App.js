import {hoistCmp, uses} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {vframe} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {appBar} from '@xh/hoist/desktop/cmp/appbar';
import {ContextMenuItem as CM} from '@xh/hoist/desktop/cmp/contextmenu';
import {fileManager} from './FileManager';
import {AppModel} from './AppModel';

export const App = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return panel({
            contextMenu: [CM.reloadApp(), CM.about(), CM.logout()],
            tbar: appBar({
                icon: Icon.folder({size: '2x', prefix: 'fal'}),
                title: 'File Manager',
                hideRefreshButton: true
            }),
            item: vframe({
                className: 'xh-tiled-bg',
                justifyContent: 'center',
                alignItems: 'center',
                item: fileManager()
            })
        });
    }
});
