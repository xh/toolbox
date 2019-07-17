/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {a, hbox, p, vframe} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from "@xh/hoist/icon";
import {panel} from "@xh/hoist/desktop/cmp/panel";
import {wrapper} from "../../common";
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
                    This example demonstrates Hoist support for loading and caching data on the server from a <a href="https://newsapi.org/" target="_blank">Remote API</a>.
                    Refresh rate, news sources, and API key can be modified in the Admin Config tab.
                </p>,
                <p>
                    On the client side, we use a <a href="../app/grids/dataview" target="_blank">DataView</a> grid
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
                    For more information, see <a href="https://open.fda.gov/apis/drug/enforcement/">here</a>.
                </p>
            ]
        }
    ];

    render() {
        return wrapper(
            hbox({
                className: 'example-tile-container',
                items: this.examples.map((ex) => this.renderTile(ex))
            })
        )
    }

    renderTile({title, icon, path, text}) {
        // Maybe add thumbnail image somewhere?
        return panel({
            title,
            icon,
            width: 250,
            height: 250,
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
        })
    }
}
