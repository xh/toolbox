import {hoistCmp, XH} from '@xh/hoist/core';
import {div} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {button} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';

export const homePage = hoistCmp.factory({
    render() {
        return panel({
            scrollable: true,
            className: 'toolbox-page xh-tiled-bg',
            items: [
                summaryCard({
                    title: 'Grids',
                    icon: Icon.gridPanel(),
                    summary:
                        'Grids are at the heart of many Hoist React projects, and Grid, GridModel, and related helper components are key elements of the framework.',
                    route: 'grids'
                }),
                summaryCard({
                    title: 'Tree Grids',
                    icon: Icon.grid(),
                    summary:
                        "Hoist's Grid supports the display of hierarchical tree data. Applications provide standard record data with children nodes containing their sub-records",
                    route: 'treegrids'
                }),
                summaryCard({
                    title: 'Zone Grids',
                    icon: Icon.gridLarge(),
                    summary:
                        'Zone Grids leverage an underlying Grid to render multi-line full-width rows.',
                    route: 'zoneGrid'
                }),
                summaryCard({
                    title: 'Dataview',
                    icon: Icon.addressCard(),
                    summary:
                        'The DataView component leverages an underlying Grid / GridModel instance to display individual component "cards" for each rendered item.',
                    route: 'dataview'
                }),
                summaryCard({
                    title: 'Form',
                    icon: Icon.edit(),
                    summary: 'Form fields can be bound to a model.',
                    route: 'form'
                }),
                summaryCard({
                    title: 'Charts',
                    icon: Icon.chartLine(),
                    summary: 'Customize interactive charts with dynamically updated data.',
                    route: 'charts'
                }),
                summaryCard({
                    title: 'Containers',
                    icon: Icon.box(),
                    summary: 'Layout children in Tabs, or flexed horizontally or vertically.',
                    route: 'containers'
                }),
                summaryCard({
                    title: 'Panels',
                    icon: Icon.window(),
                    summary: 'Core building block component with support for header and toolbars.',
                    route: 'panels'
                }),
                summaryCard({
                    title: 'Popovers',
                    icon: Icon.openExternal(),
                    summary: 'Popovers display floating content next to a target element.',
                    route: 'popovers'
                }),
                summaryCard({
                    title: 'Popups',
                    icon: Icon.comment(),
                    summary: 'Dialogs and Toasts.',
                    route: 'popups'
                }),
                summaryCard({
                    title: 'Buttons',
                    icon: Icon.pointerUp(),
                    summary: 'Buttons trigger actions when tapped.',
                    route: 'buttons'
                }),
                summaryCard({
                    title: 'Icons',
                    icon: Icon.rocket(),
                    summary: 'A collection of FontAwesome SVG icons, available in 3 variants.',
                    route: 'icons'
                }),
                summaryCard({
                    title: 'PinPad',
                    icon: Icon.unlock(),
                    summary:
                        'A specialized PIN input, used for lightweight authentication of users.',
                    route: 'pinPad'
                })
            ]
        });
    }
});

const summaryCard = hoistCmp.factory(({title, icon, summary, route}) =>
    div({
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
    })
);
