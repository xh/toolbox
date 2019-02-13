import {Component} from 'react';
import {XH, HoistComponent, elemFactory} from '@xh/hoist/core';
import {div} from '@xh/hoist/cmp/layout';
import {page} from '@xh/hoist/mobile/cmp/page';
import {button} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';

@HoistComponent
export class HomePage extends Component {

    render() {
        return page({
            className: 'toolbox-page',
            items: [
                this.renderSummaryCard({
                    title: 'Grids',
                    icon: Icon.gridPanel(),
                    summary: 'Grids are at the heart of many Hoist React projects, and Grid, GridModel, and related helper components are key elements of the framework.',
                    route: 'grids'
                }),
                this.renderSummaryCard({
                    title: 'Tree Grids',
                    icon: Icon.grid(),
                    summary: 'Hoist\'s Grid supports the display of hierarchical tree data. Applications provide standard record data with children nodes containing their sub-records',
                    route: 'treegrids'
                }),
                this.renderSummaryCard({
                    title: 'Form',
                    icon: Icon.edit(),
                    summary: 'Form fields can be bound to a model.',
                    route: 'form'
                }),
                this.renderSummaryCard({
                    title: 'Containers',
                    icon: Icon.box(),
                    summary: 'Layout children in Tabs, or flexed horizontally or vertically.',
                    route: 'containers'
                }),
                this.renderSummaryCard({
                    title: 'Popups',
                    icon: Icon.comment(),
                    summary: 'Dialogs and Toasts.',
                    route: 'popups'
                }),
                this.renderSummaryCard({
                    title: 'Icons',
                    icon: Icon.rocket(),
                    summary: 'A collection of FontAwesome SVG icons, available in 3 variants.',
                    route: 'icons'
                })
            ]
        });
    }

    renderSummaryCard({title, icon, summary, route}) {
        return div({
            className: 'toolbox-card',
            items: [
                div({className: 'toolbox-card__title', item: title}),
                div({className: 'toolbox-card__body', item: summary}),
                button({
                    icon: icon,
                    text: `Go to ${title}`,
                    onClick: () => XH.appendRoute(route)
                })
            ]
        });
    }

}

export const homePage = elemFactory(HomePage);