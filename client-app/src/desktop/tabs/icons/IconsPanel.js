/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent} from 'hoist/core/index';
import {div, hbox, vbox} from 'hoist/cmp/layout';
import {panel} from 'hoist/cmp/panel';
import {wrapperPanel} from '../impl/WrapperPanel';
import {Icon} from 'hoist/icon';

import './IconsPanel.scss';

@HoistComponent()
export class IconsPanel extends Component {

    render() {
        return wrapperPanel(
            panel({
                title: 'Available Icons',
                width: 500,
                height: '80%',
                cls: 'xh-toolbox-icons-panel',
                item: this.renderExample()
            })
        );
    }

    renderExample() {
        const header = (...labels) => hbox({ cls: 'header', items: labels.map(label => div(label))}),
            row = icon => hbox({cls: 'row', items: [div(icon.name), ...this.renderIconTiles(icon)]});

        return vbox({
            cls: 'xh-toolbox-example-container',
            items: [
                header('name', 'regular', 'solid', 'light'),
                vbox({
                    overflow: 'auto',
                    items: this.getAllIcons().map(icon => row(icon))
                })
            ]
        });
    }

    getAllIcons() {
        return Object.keys(Icon).map(key => ({
            regular: Icon[key]({size: '2x'}),
            solid: Icon[key]({prefix: 'fas', size: '2x'}),
            light: Icon[key]({prefix: 'fal', size: '2x'}),
            name: key
        }));
    }

    renderIconTiles(icon) {
        return [
            div(icon.regular),
            div(icon.solid),
            div(icon.light)
        ];
    }
}
