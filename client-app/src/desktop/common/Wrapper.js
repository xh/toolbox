import {Component} from 'react';
import {HoistComponent, elemFactory, XH} from '@xh/hoist/core';
import PT from 'prop-types';
import {a, box, code, div, li, ul} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {castArray} from 'lodash';
import {DockContainerModel, dockContainer} from '@xh/hoist/cmp/dock';
import {managed} from '@xh/hoist/core/mixins';

import './Wrapper.scss';

@HoistComponent
class Wrapper extends Component {
    
    static propTypes = {
        
        /* quick summary of the component */
        description: PT.oneOfType([PT.element, PT.string]),
        
        /* links to source code on GitHub or external websites */
        links: PT.oneOfType([
            PT.instanceOf(WrapperLink),
            PT.object,
            PT.arrayOf(PT.instanceOf(WrapperLink)),
            PT.arrayOf(PT.object)
        ])
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
        
        return div(ul(
            arrayLinks.map(linkObj => this.makeWrapperLink(linkObj))
        ));
    }
    
    makeWrapperLink(linkObj) {
        if (linkObj instanceof WrapperLink) return linkObj.createLink();
        
        return new WrapperLink(linkObj).createLink();
    }
}
export const wrapper = elemFactory(Wrapper);


export class WrapperLink {
    
    static propTypes = {
        
        /**
         * URL for the link, can be a full URL (must include https://) or a string that starts with:
         *      '$TB' for toolbox files, such as '$TB/client-app/src/desktop/tabs/other/PopupsPanel.js', or
         *      '$HR' for hoist-react files, such as '$HR/desktop/cmp/button/Button.js'.
         */
        url: PT.string.isRequired,
        
        /* text to be displayed in the hyperlink */
        text: PT.string.isRequired,
        
        /* text or Element to be displayed outside the hyperlink */
        notes: PT.oneOfType([PT.string, PT.element])
    };
    
    constructor({url, text, notes}) {
        this.url = url;
        this.text = text;
        this.notes = notes;
    }
    
    createLink() {
        return li(
            a({
                href: this.createUrl(),
                item: this.text,
                target: '_wrapperLink'
            }),
            this.createNotes()
        );
    }
    
    createUrl() {
        const sourceUrls = XH.getConf('sourceUrls');
        
        return (this.url
            .replace('$TB', sourceUrls.toolbox)
            .replace('$HR', sourceUrls.hoistReact)
        );
    }
    
    createNotes() {
        if (this.notes) return [' -- ', this.notes];
    }
}