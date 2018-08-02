/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {tabContainer} from '@xh/hoist/mobile/cmp/tab';

import {ContainersPageModel} from './ContainersPageModel';

@HoistComponent()
export class ContainersPage extends Component {
    localModel = new ContainersPageModel();

    render() {
        const {tabContainerModel} = this.model;
        return page(
            tabContainer({model: tabContainerModel})
        );
    }

}

export const containersPage = elemFactory(ContainersPage);