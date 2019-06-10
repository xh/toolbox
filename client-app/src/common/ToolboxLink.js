/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent, elemFactory, XH} from '@xh/hoist/core';
import PT from 'prop-types';
import {a} from '@xh/hoist/cmp/layout';

@HoistComponent
class ToolboxLink extends Component {
    
    static propTypes = {
        
        /**
         * URL for the link, can be a full URL (must include https://) or a string that starts with:
         *      '$TB' for toolbox files, such as '$TB/client-app/src/desktop/tabs/other/PopupsPanel.js', or
         *      '$HR' for hoist-react files, such as '$HR/desktop/cmp/button/Button.js'.
         */
        url: PT.string.isRequired,
        
        /* text to be displayed in the hyperlink.  Defaults to the text after the last `/` */
        text: PT.string
    };
    
    render() {
        return a({
            href: this.createUrl(),
            item: this.props.text || this.createDefaultText(),
            target: '_blank'
        });
    }
    
    createUrl() {
        const sourceUrls = XH.getConf('sourceUrls');
        
        return (this.props.url
            .replace('$TB', sourceUrls.toolbox)
            .replace('$HR', sourceUrls.hoistReact)
        );
    }
    
    createDefaultText() {
        const {url} = this.props,
            posAfterLastSlash = url.lastIndexOf('/') + 1,
            posLastOctothorpe = url.lastIndexOf('#') === -1 ? url.length : url.lastIndexOf('#');
            // .lastIndexOf() returns -1 if char not found
        
        return url.substring(posAfterLastSlash, posLastOctothorpe);
    }
}
export const toolboxLink = elemFactory(ToolboxLink);
