import {Component} from 'react';
import {HoistComponent, elemFactory, XH} from '@xh/hoist/core';
import PT from 'prop-types';
import {box, a, code, div, p} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {castArray} from 'lodash';
import {DockContainerModel, dockContainer} from '@xh/hoist/cmp/dock';
import {managed} from '@xh/hoist/core/mixins';

import './Wrapper.scss';

@HoistComponent
class Wrapper extends Component {

    /**
     * Wrapper is current standard 'wrapper' for demoing hoist-react components. :)
     * It accepts:
     *      (optional) `description` for a quick summary of the component,
     *      (optional) `links` to source code on GitHub or external websites.
     *
     * Note that while `links` is optional and that Developers may choose to provide either
     * a single Object, or array of Objects, each Object requires a `.url` and `.text` prop:
     *
     * @param {string} link.url - can be a full URL (must include https://) or a string that starts with:
     *      '$TB' for toolbox files, such as '$TB/client-app/src/desktop/tabs/other/PopupsPanel.js', or
     *      '$HR' for hoist-react files, such as '$HR/desktop/cmp/button/Button.js'.
     * @param {string} link.text - text to be displayed in hyperlink.
     * @param {(string|Element)} [link.notes] - text to be displayed outside hyperlink.
     */
    
    static propTypes = {
        
        links: PT.oneOfType([PT.arrayOf(PT.object), PT.object])
    };
    
    
    @managed
    dockContainerModel = new DockContainerModel();
    
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
        const {dockContainerModel} = this;
        const {links} = this.props;
        
        if (!links) return null;
        
        dockContainerModel.addView({
            id: XH.genId(),
            icon: Icon.code(),
            title: code('Source Code'),
            allowDialog: false,
            allowClose: false,
            collapsed: true,
            content: panel({
                className: 'toolbox-wrapper-sourcecode',
                item: this.generateLinks()
            })
        });
        
        return dockContainer({
            model: dockContainerModel
        });
    }
    
    generateLinks() {
        const arrayLinks = castArray(this.props.links);
        
        return div(
            arrayLinks.map(linkObj => this.renderSingleLink(linkObj))
        );
    }
    
    renderSingleLink(linkObj) {
        return p(
            a({
                href: this.generateUrl(linkObj.url),
                item: linkObj.text,
                target: '_blank'
            }),
            this.hasNotes(linkObj)
        );
    }
    
    hasNotes(linkObj) {
        if (linkObj.notes) return [' | ', linkObj.notes];
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