import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

import {PanelSizingPanel} from './PanelSizingPanel';
import { BasicPanel } from './BasicPanel';
import {ToolbarPanel} from './ToolbarPanel';
import {LoadingIndicatorPanel} from './LoadingIndicatorPanel';
import {MaskPanel} from './MaskPanel';

import './PanelsTab.scss';

@HoistComponent
export class PanelsTab extends Component {
    render() {
        return tabContainer({
            model: {
                route: 'default.panels',
                switcherPosition: 'left',
                tabs: [
                    {id: 'panel', content: BasicPanel},
                    {id: 'toolbar', content: ToolbarPanel},
                    {id: 'panelSizing', title: 'Panel Sizing', content: PanelSizingPanel},
                    {id: 'mask', title: 'Mask', content: MaskPanel},
                    {id: 'loadingIndicator', title: 'Loading Indicator', content: LoadingIndicatorPanel}
                ]
            },
            className: 'toolbox-tab'
        });
    }
}
