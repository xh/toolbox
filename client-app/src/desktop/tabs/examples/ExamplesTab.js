/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {FileManager} from './filemanager/FileManager';
import {HoistComponent, XH} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

import {NewsPanel} from './news/NewsPanel';
import {PortfolioPanel} from './portfolio/PortfolioPanel';
import {RecallsPanel} from './recalls/RecallsPanel';

@HoistComponent
export class ExamplesTab extends Component {

    render() {
        return tabContainer({
            model: {
                route: 'default.examples',
                switcherPosition: 'left',
                tabs: [
                    {id: 'portfolio', content: PortfolioPanel},
                    {id: 'news', content: NewsPanel},
                    {id: 'recalls', content: RecallsPanel},
                    {id: 'fileManager', content: FileManager, omit: !XH.getUser().isHoistAdmin}
                ]
            },
            className: 'toolbox-tab'
        });
    }
}
