/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import {a} from '@xh/hoist/cmp/layout';
import {elemFactory, HoistComponent, XH} from '@xh/hoist/core';
import PT from 'prop-types';
import {Component} from 'react';

@HoistComponent
export class ToolboxLink extends Component {
    
    static propTypes = {
        
        /**
         * URL for the link.
         *
         * Can be a fully qualified URL for external/other links, or start with one of the following
         * tokens to support configurable roots for the Hoist-React and Toolbox Github repos.
         *
         *      `$TB` for toolbox files, e.g. '$TB/client-app/src/desktop/App.js'
         *          - or -
         *      `$HR` for hoist-react files, e.g. '$HR/desktop/cmp/button/Button.js'
         */
        url: PT.string.isRequired,
        
        /**
         * Custom text for the link itself. Defaults to the portion of the url following the
         * last slash - typically expected to be the relevant file name.
         */
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
            start = url.lastIndexOf('/'),
            end = url.includes('#') ? url.lastIndexOf('#') : url.length;

        return url.substring(start + 1, end);
    }
}
export const toolboxLink = elemFactory(ToolboxLink);
