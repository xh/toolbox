/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {div} from '@xh/hoist/cmp/layout';
import {page} from '@xh/hoist/mobile/cmp/page';
import {button} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';

import './HomePage.scss';
import {App} from '../App';
import {gridPage} from '../grids/GridPage';
import {containersPage} from '../containers/ContainersPage';
import {iconPage} from '../icons/IconPage';

@HoistComponent()
export class HomePage extends Component {

    render() {
        return page({
            className: 'home-page',
            items: [
                this.renderSummaryCard({
                    title: 'Grids',
                    icon: Icon.grid({prefix: 'fal'}),
                    summary: 'Show a collection of data bound to a store. Can specify 2 columns: leftColumn and rightColumn.',
                    pageFactory: gridPage
                }),
                this.renderSummaryCard({
                    title: 'Containers',
                    icon: Icon.box(),
                    summary: 'Layout children in Tabs, or flexed horizontally or vertically.',
                    pageFactory: containersPage
                }),
                this.renderSummaryCard({
                    title: 'Icons',
                    icon: Icon.edit(),
                    summary: 'A collection of FontAwesome SVG icons, available in 3 variants.',
                    pageFactory: iconPage
                })
            ]
        });
    }

    renderSummaryCard({title, icon, summary, pageFactory}) {
        return div({
            className: 'summary-card',
            items: [
                div({className: 'summary-card__title', item: title}),
                div({className: 'summary-card__body', item: summary}),
                button({
                    icon: icon,
                    text: `Go to ${title}`,
                    onClick: () => App.navigate(title, pageFactory)
                })
            ]
        });
    }

}

export const homePage = elemFactory(HomePage);