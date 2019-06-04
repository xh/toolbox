import {Component} from 'react';
import {HoistComponent, elemFactory, XH} from '@xh/hoist/core';
import {box, a, br, code, div, p, span} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {castArray} from 'lodash';

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
                this.renderSourceCodePanel()
            ],
            ...rest
        });
    }
    
    renderSourceCodePanel() {
        const {links, link} = this.props;
        
        if (links || link) {
            return panel({
                item: this.generateLinks(),
                icon: Icon.code(),
                title: code('Source Code'),
                model: {
                    defaultSize: 100,
                    collapsible: true,
                    showSplitterCollapseButton: false,
                    side: 'bottom',
                    hide: true
                }
            });
        }
    }
    
    generateLinks() {
        const arrayLinks = this.props.links || castArray(this.props.link);
        
        return div(
            arrayLinks.map(linkObj => this.generateSingleLink(linkObj))
        );
        
    }
    
    generateSingleLink(linkObj) {
        return p(
            a({
                href: this.generateUrl(linkObj.url),
                item: code(linkObj.text),
                target: '_blank'
            }),
            ' ',
            linkObj.notes
        );
    }
    
    generateUrl(url) {
        const sourceUrls = XH.getConf('sourceUrls'),
            urlHead = url.slice(0, 3),
            urlTail = url.slice(3);
            
        switch (urlHead) {
            case '$TB':
                return sourceUrls.toolbox + urlTail;
            case '$HR':
                return sourceUrls.hoistReact + urlTail;
            default:
                return url;
        }
    }
}
export const wrapper = elemFactory(Wrapper);