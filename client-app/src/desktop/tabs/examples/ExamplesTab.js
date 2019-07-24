/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {a, hbox, p, vframe, code} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';
import './ExamplesTab.scss';

@HoistComponent
export class ExamplesTab extends Component {


    examples = [
        {
            title: 'Portfolio',
            icon: Icon.portfolio(),
            path: '/portfolio',
            text: [
                <p>
                    This example shows a synthetic portfolio analysis tool.  Includes examples of large data-set grids,
                    master-detail grids, charting, and dimensional analysis.
                </p>
            ]
        },
        {
            title: 'News',
            icon: Icon.news(),
            path: '/news',
            text: [
                <p>
                    This example demonstrates Hoist support for loading and caching data on the server from
                    a {link('Remote API', 'https://newsapi.org/')}. Refresh rate, news sources, and API key can
                    be modified in the Admin Config tab.
                </p>,
                <p>
                    On the client side, we use a {link(code('DataView'), '../app/grids/dataview')} grid
                    to support custom filtering logic and rich component rendering.
                </p>
            ]
        },
        {
            title: 'FDA Recalls',
            icon: Icon.health(),
            path: '/recalls',
            text: [
                <p>
                    This applet uses the openFDA drug enforcement reports API, which provides information on drug recall
                    events since 2004. Provides examples of filtering and searching data from an external API.
                </p>,
                <p>
                    For more information, see {link('here', 'https://open.fda.gov/apis/drug/enforcement/')}.
                </p>
            ]
        },
        {
            title: 'File Manager',
            icon: Icon.fileArchive(),
            path: '/fileManager',
            text: [
                <p>
                    This example shows a simple, full-stack pattern for uploading and storing files on a server.
                </p>,
                <p>
                    On the client side this app uses the {link(code('FileChooser'), '/app/other/fileChooser')}.
                    The server-side controller and service provide examples of how uploads can
                    be extracted from the request and processed within Grails.
                </p>,
                <p>
                    <strong>This example is visible only to admins</strong> to avoid
                    arbitrary file uploads to our server.
                    Please {link('contact us', 'https://xh.io/contact/')} for access.
                </p>
            ]
        }
    ];

    render() {
        return wrapper(
            hbox({
                className: 'example-tile-container',
                flexWrap: 'wrap',
                items: this.examples.map((ex) => this.renderTile(ex))
            })
        );
    }

    renderTile({title, icon, path, text}) {
        return panel({
            title,
            icon,
            width: 300,
            height: 300,
            margin: 20,
            item: vframe({
                className: 'example-tile-text',
                items: text
            }),
            bbar: toolbar(
                button({
                    text: 'Launch app',
                    icon: Icon.openExternal(),
                    onClick: () => window.open(path)
                })
            )
        });
    }
}

const link = (txt, url) => <a href={url} target="_blank">{txt}</a>;
