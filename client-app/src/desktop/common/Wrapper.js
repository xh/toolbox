import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {box, a, br} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';

import './Wrapper.scss';

@HoistComponent
class Wrapper extends Component {
    render() {
        const {description, link, children, ...rest} = this.props,
            viewSource = link ?
                a({
                    href: link,
                    item: Icon.code(),
                    target: '_blank'
                }) :
                null;
        
        return box({
            className: 'toolbox-wrapper xh-tiled-bg',
            items: [
                panel({
                    className: 'toolbox-wrapper-description',
                    items: [
                        description,
                        br(),
                        viewSource
                    ],
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