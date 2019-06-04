import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {box, a, br, code, div, p, span} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';

import './Wrapper.scss';

@HoistComponent
class Wrapper extends Component {
    
    render() {
        const {description, children, ...rest} = this.props;
        
        return box({
            className: 'toolbox-wrapper xh-tiled-bg',
            items: [
                panel({
                    className: 'toolbox-wrapper-description',
                    item: description,
                    width: 700,
                    marginBottom: 10,
                    omit: !description
                }),
                children,
                panel({
                    item: this.generateLinks(),
                    icon: Icon.code(),
                    title: 'Source Code',
                    model: {
                        defaultSize: 100,
                        collapsible: true,
                        showSplitterCollapseButton: false,
                        side: 'bottom',
                        hide: true
                    }
                })
            ],
            ...rest
        });
    }
    
    generateLinks() {
        const {links, link} = this.props;
        if (Array.isArray(links)) {
            return div(
                links.map(this.generateSingleLink)
            );
        } else if (link) {
            return this.generateSingleLink(link);
        }
        return null;
    }
    
    generateSingleLink(linkObj) {
        return p(
            a({
                href: linkObj.url,
                item: code(linkObj.text),
                target: '_blank'
            }),
            ' ',
            linkObj.notes
        );
    }
    
}
export const wrapper = elemFactory(Wrapper);