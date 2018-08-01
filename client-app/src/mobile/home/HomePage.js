/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';

import {HomePageModel} from './HomePageModel';

@HoistComponent()
export class HomePage extends Component {
    localModel = new HomePageModel();

    render() {
        // Todo: List of page summaries and buttons to visit each page
        return page(
            'Welcome to Toolbox'
        );
    }

}

export const homePage = elemFactory(HomePage);