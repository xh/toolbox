/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {elemFactory} from '@xh/hoist/core';
import {box} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';

import './Wrapper.scss';

class Wrapper extends Component {
    render() {
        const {description, children, ...rest} = this.props;

        return box({
            cls: 'toolbox-wrapper',
            items: [
                panel({
                    cls: 'toolbox-wrapper-description',
                    item: description,
                    width: 600,
                    marginBottom: 10,
                    omit: !description
                }),
                children
            ],
            ...rest
        });
    }
}
export const wrapper = elemFactory(Wrapper);