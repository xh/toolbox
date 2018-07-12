/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {elemFactory} from '@xh/hoist/core';
import {div, box} from '@xh/hoist/cmp/layout';

class WrapperPanel extends Component {


    render() {
        const {description, children, ...rest} = this.props,
            width = (children.props.layoutConfig && parseInt(children.props.layoutConfig.width) || 100);

        return div({
            cls: 'xh-toolbox-wrapper-panel',
            items: [children, description ? box({
                cls: 'xh-toolbox-wrapper-description',
                item: description,
                width
            }) : null],
            ...rest
        });
    }
}

export const wrapperPanel = elemFactory(WrapperPanel);