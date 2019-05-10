/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {wrapper} from '../../common';
import {p} from '@xh/hoist/cmp/layout';


@HoistComponent
export class PopupsPanel extends Component {

    render() {
        return wrapper('hi');
    }
}