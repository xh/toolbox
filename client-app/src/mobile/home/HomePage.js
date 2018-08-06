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

import {App} from '../App';
import {gridPage} from '../grids/GridPage';
import {formPage} from '../form/FormPage';
import {containersPage} from '../containers/ContainersPage';
import {popupsPage} from '../popups/PopupsPage';
import {iconPage} from '../icons/IconPage';

@HoistComponent()
export class HomePage extends Component {

    render() {
        return page({
            cls: 'toolbox-page',
            items: [
                this.renderSummaryCard({
                    title: 'Grids',
                    icon: Icon.grid({prefix: 'fal'}),
                    summary: 'Show a collection of data bound to a store. Can specify 2 columns: leftColumn and rightColumn.',
                    pageFactory: gridPage
                }),
                this.renderSummaryCard({
                    title: 'Form',
                    icon: Icon.edit(),
                    summary: 'Form fields can be bound to a model.',
                    pageFactory: formPage
                }),
                this.renderSummaryCard({
                    title: 'Containers',
                    icon: Icon.box(),
                    summary: 'Layout children in Tabs, or flexed horizontally or vertically.',
                    pageFactory: containersPage
                }),
                this.renderSummaryCard({
                    title: 'Popups',
                    icon: Icon.comment(),
                    summary: 'Dialogs and Toasts.',
                    pageFactory: popupsPage
                }),
                this.renderSummaryCard({
                    title: 'Icons',
                    icon: Icon.rocket(),
                    summary: 'A collection of FontAwesome SVG icons, available in 3 variants.',
                    pageFactory: iconPage
                })
            ]
        });
    }

    renderSummaryCard({title, icon, summary, pageFactory}) {
        return div({
            cls: 'toolbox-card',
            items: [
                div({cls: 'toolbox-card__title', item: title}),
                div({cls: 'toolbox-card__body', item: summary}),
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