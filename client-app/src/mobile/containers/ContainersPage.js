import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {tabContainer} from '@xh/hoist/cmp/tab';

import {ContainersPageModel} from './ContainersPageModel';

@HoistComponent
export class ContainersPage extends Component {
    model = new ContainersPageModel();

    render() {
        const {tabContainerModel} = this.model;
        return page(
            tabContainer({model: tabContainerModel})
        );
    }

}

export const containersPage = elemFactory(ContainersPage);