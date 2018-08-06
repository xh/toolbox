/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {table, tbody, tr, th, td} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';

import './IconPage.scss';

@HoistComponent()
export class IconPage extends Component {

    render() {
        return page({
            className: 'icon-page',
            item: table(
                tbody({
                    items: [
                        this.renderHeaderRow(),
                        ...this.getAllIcons().map(icon => this.renderRow(icon))
                    ]
                })
            )
        });
    }

    renderHeaderRow() {
        return tr(
            th('name'),
            th('regular'),
            th('solid'),
            th('light')
        );
    }

    renderRow(icon) {
        return tr(
            td(icon.name),
            td(icon.regular),
            td(icon.solid),
            td(icon.light)
        );
    }

    getAllIcons() {
        return Object.keys(Icon).map(key => ({
            name: key,
            regular: Icon[key]({size: '2x'}),
            solid: Icon[key]({prefix: 'fas', size: '2x'}),
            light: Icon[key]({prefix: 'fal', size: '2x'})
        }));
    }

}

export const iconPage = elemFactory(IconPage);