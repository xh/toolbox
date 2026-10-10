import {hframe} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {button, themeToggleButton} from '@xh/hoist/desktop/cmp/button';
import {clipboardButton} from '@xh/hoist/desktop/cmp/clipboard';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import {controlsPanel} from './cmp/ControlsPanel';
import {previewsPanel} from './cmp/PreviewsPanel';
import '../../core/Toolbox.scss';
import './Favicons.scss';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render({model}) {
        const {faviconModel} = model;
        return panel({
            className: 'tb-favicons',
            tbar: appBar({
                icon: Icon.magic({size: '2x'}),
                hideAppMenuButton: true,
                hideRefreshButton: true,
                hideWhatsNewButton: true,
                rightItems: [
                    clipboardButton({
                        text: 'Copy link',
                        icon: Icon.link(),
                        tooltip: 'Copy a link that reopens this exact design',
                        getCopyText: () => faviconModel.shareUrl,
                        successMessage: 'Design link copied to clipboard.'
                    }),
                    button({
                        text: 'Download .zip',
                        icon: Icon.download(),
                        intent: 'primary',
                        outlined: true,
                        onClick: () => faviconModel.downloadAsync()
                    }),
                    appBarSeparator(),
                    themeToggleButton()
                ]
            }),
            mask: faviconModel.downloadTask,
            item: hframe(controlsPanel({model: faviconModel}), previewsPanel({model: faviconModel}))
        });
    }
});
