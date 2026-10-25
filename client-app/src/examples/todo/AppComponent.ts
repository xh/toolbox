import {vframe} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {appBar} from '@xh/hoist/desktop/cmp/appbar';
import {themeToggleButton} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import {todoPanel} from './TodoPanel';
import '../../core/Toolbox.scss';
import './App.scss';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        // A focused, fixed-width to-do card floating on the XH monogram tile (cf. the FileManager
        // example). The card carries its own compact app bar.
        return vframe({
            className: 'xh-tiled-bg',
            alignItems: 'center',
            justifyContent: 'center',
            item: panel({
                className: 'tbox-todoapp',
                // `flex: none` (inline, via prop) keeps the card at its managed size rather than
                // growing to fill the frame - so the width/height in App.scss are honored.
                flex: 'none',
                tbar: appBar({
                    icon: Icon.clipboard({size: '2x', prefix: 'fal'}),
                    hideAppMenuButton: true,
                    hideRefreshButton: true,
                    hideWhatsNewButton: true,
                    rightItems: [themeToggleButton()]
                }),
                item: todoPanel()
            })
        });
    }
});
