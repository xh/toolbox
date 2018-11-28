import {Component} from 'react';
import {elemFactory} from '@xh/hoist/core';
import {box} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';

import './Wrapper.scss';

class Wrapper extends Component {
    render() {
        const {description, children, ...rest} = this.props;

        return box({
            className: 'toolbox-wrapper',
            items: [
                panel({
                    className: 'toolbox-wrapper-description',
                    item: description,
                    width: 700,
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