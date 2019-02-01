/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {FileManager} from './filemanager/FileManager';
import {HoistComponent, XH} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/desktop/cmp/tab';

import {NewsPanel} from './news/NewsPanel';
import {PortfolioPanel} from './portfolio/PortfolioPanel';

@HoistComponent
export class ExamplesTab extends Component {

    render() {
        return tabContainer({
            model: {
                route: 'default.examples',
                tabs: [
                    {id: 'portfolio', content: PortfolioPanel},
                    {id: 'news', content: NewsPanel},
                    {id: 'fileManager', content: FileManager, omit: !XH.getUser().isHoistAdmin}
                ]
            },
            switcherPosition: 'left',
            className: 'toolbox-tab'
        });
    }
}
