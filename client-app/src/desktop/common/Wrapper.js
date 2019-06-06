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
     * a single Object, or array of Objects, each Object requires a `url` and `text` prop:
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
    
    constructor(props) {
        super(props);
        
        if (!this.props.links) return;
        
        this.dockContainerModel.addView({
            id: XH.genId(),
            icon: Icon.code(),
            title: code('Source Code'),
            allowDialog: false,
            allowClose: false,
            collapsed: true,
            content: panel({
                className: 'toolbox-wrapper-sourcecode',
                item: this.createLinks()
            })
        });
    }
    
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
                dockContainer({model: this.dockContainerModel})
            ],
            ...rest
        });
    }
    
    createLinks() {
        const arrayLinks = castArray(this.props.links);

        return div(
            arrayLinks.map(linkObj => this.createSingleLink(linkObj))
        );
    }
    
    createSingleLink(linkObj) {
        return p(
            a({
                href: this.createUrl(linkObj.url),
                item: linkObj.text,
                target: '_wrapperLink'
            }),
            this.createNotes(linkObj)
        );
    }
    
    createNotes(linkObj) {
        if (linkObj.notes) return [' | ', linkObj.notes];
    }
    
    createUrl(url) {
        const sourceUrls = XH.getConf('sourceUrls');
        return (url
            .replace('$TB', sourceUrls.toolbox)
            .replace('$HR', sourceUrls.hoistReact)
        );
    }
}
export const wrapper = elemFactory(Wrapper);