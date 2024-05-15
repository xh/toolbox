import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {panelSizingPanel} from './PanelSizingPanel';
import {basicPanel} from './BasicPanel';
import {toolbarPanel} from './ToolbarPanel';
import {loadingIndicatorPanel} from './LoadingIndicatorPanel';
import {maskPanel} from './MaskPanel';
import './PanelsTab.scss';

export const panelsTab = hoistCmp.factory(() =>
    tabContainer({
        modelConfig: {
            route: 'default.panels',
            switcher: {orientation: 'left'},
            tabs: [
                {id: 'intro', content: basicPanel},
                {id: 'toolbars', content: toolbarPanel},
                {id: 'sizing', content: panelSizingPanel},
                {id: 'mask', content: maskPanel},
                {id: 'loadingIndicator', content: loadingIndicatorPanel}
            ]
        },
        className: 'tb-tab'
    })
);
