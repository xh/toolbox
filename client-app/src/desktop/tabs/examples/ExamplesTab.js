import React from 'react';
import {hoistComponent} from '@xh/hoist/core';
import {a, code, hbox, p, vframe} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';
import './ExamplesTab.scss';

export const ExamplesTab = hoistComponent(
    () => wrapper(
        hbox({
            className: 'example-tile-container',
            flexWrap: 'wrap',
            items: getExamples().map(e => panel({
                title: e.title,
                icon: e.icon,
                width: 300,
                height: 300,
                margin: 20,
                item: vframe({
                    className: 'example-tile-text',
                    items: e.text
                }),
                bbar: [
                    button({
                        text: 'Launch app',
                        icon: Icon.openExternal(),
                        onClick: () => window.open(e.path)
                    })
                ]
            }))
        })
    )
);


function getExamples() {
    return [
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
                    This example shows a simple, full-stack pattern for syncing files to a server.
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
}

function link(txt, url) { <a href={url} target="_blank">{txt}</a> }
