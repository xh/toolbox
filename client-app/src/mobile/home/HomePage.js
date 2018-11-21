import {Component} from 'react';
import {XH, HoistComponent, elemFactory} from '@xh/hoist/core';
import {div} from '@xh/hoist/cmp/layout';
import {page} from '@xh/hoist/mobile/cmp/page';
import {button} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {menuButton} from '@xh/hoist/mobile/cmp/button';
import {menu, MenuModel} from '@xh/hoist/mobile/cmp/menu';

import {gridPage} from '../grids/GridPage';
import {treeGridPage} from '../grids/TreeGridPage';
import {formPage} from '../form/FormPage';
import {containersPage} from '../containers/ContainersPage';
import {popupsPage} from '../popups/PopupsPage';
import {iconPage} from '../icons/IconPage';

@HoistComponent
export class HomePage extends Component {
    menuModel = null;

    constructor(props) {
        super(props);
    }

    render() {
        return page({
            className: 'toolbox-page',
            items: [
                this.renderSummaryCard({
                    title: 'Grids',
                    icon: Icon.gridPanel(),
                    summary: 'Grids are at the heart of many Hoist React projects, and Grid, GridModel, and related helper components are key elements of the framework.',
                    pageFactory: gridPage
                }),
                this.renderSummaryCard({
                    title: 'Tree Grids',
                    icon: Icon.grid(),
                    summary: 'Hoist\'s Grid supports the display of hierarchical tree data. Applications provide standard record data with children nodes containing their sub-records',
                    pageFactory: treeGridPage
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
            className: 'toolbox-card',
            items: [
                div({className: 'toolbox-card__title', item: title}),
                div({className: 'toolbox-card__body', item: summary}),
                button({
                    icon: icon,
                    text: `Go to ${title}`,
                    onClick: () => XH.appModel.navigate(title, pageFactory)
                })
            ]
        });
    }
}

export const homePage = elemFactory(HomePage);