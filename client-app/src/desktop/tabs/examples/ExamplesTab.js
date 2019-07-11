/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {a, div, p, vframe} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from "@xh/hoist/icon";
import {panel} from "@xh/hoist/desktop/cmp/panel";

@HoistComponent
export class ExamplesTab extends Component {

    examples = [
        {
            title: 'News Example',
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
            title: 'Portfolio Example',
            path: '/portfolio',
            text: ['Portfolio explanation']
        },
        {
            title: 'Recalls Example',
            path: '/recalls',
            text: ['Recalls explanation']
        }
    ];

    renderTile(params) {
        // Maybe add thumbnail image somewhere?
        return panel({
            headerItems: [
                button({
                    icon: Icon.openExternal(),
                    onClick: () => window.open(params.path)
                })
            ],
            title: params.title,
            item: div({
                className: 'toolbox-panel-text-reader',
                items: params.text
            })
        })
    }

    render() {
        return vframe(
            this.examples.map((ex) => this.renderTile(ex))
        );
    }
}
