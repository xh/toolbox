import {vframe} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {appBar} from '@xh/hoist/desktop/cmp/appbar';
import {ContextMenuItem as CM} from '@xh/hoist/desktop/cmp/contextmenu';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import {fileManager} from './FileManager';
import '../../core/Toolbox.scss';

export const App = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return panel({
            contextMenu: [CM.reloadApp(), CM.about(), CM.logout()],
            tbar: appBar({
                icon: Icon.folder({size: '2x', prefix: 'fal'}),
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
