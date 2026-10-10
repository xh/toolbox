import {grid, gridCountLabel, GridModel} from '@xh/hoist/cmp/grid';
import {div, filler, hbox, p, placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import type {LoadSpec} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {numberInput, slider, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel, PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import type {CSSProperties} from 'react';
import {companyCol} from '../../../../core/columns/Demographics';
import {profitLossCol} from '../../../../core/columns/Trades';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import './PanelStylingPanel.scss';

export const panelStylingPanel = hoistCmp.factory({
    model: creates(() => PanelStylingModel),

    render({model}) {
        return wrapper({
            title: 'Panel Styling',
            icon: Icon.magic(),
            description: [
                'Panels are styled via Hoist CSS variables, each with an un-prefixed hook for',
                'apps to set - e.g. `--panel-bg`, `--panel-border-width`, and',
                '`--panel-border-radius`.',
                '',
                'A border radius suits panels laid out with gaps between them or floating on a',
                'background - tiles in a gapped grid or flex layout, or cards on a page. Most',
                'panels fill their space flush against siblings, splitters, and tabs, where',
                'rounded corners would leave notches - so the radius defaults to `0`.',
                '',
                'Set the hook on a container class to round only the panels within it, as these',
                'tiles do. The panel clips its header, toolbars, banners, content, and masks to the',
                'rounded corners, and insets its splitter and loading indicator to clear them.',
                'Scoped hooks stop at each panel, so panels nested flush inside a tile stay square.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/layout/panels/PanelStylingPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/panel/README.md#styling',
                    text: 'Panel docs',
                    notes: 'Panel CSS variables and when to round corners.'
                },
                {url: '$HR/styles/vars.scss', notes: 'Hoist CSS variable definitions.'},
                {url: '$HR/desktop/cmp/panel/Panel.scss', notes: 'Hoist panel styles.'}
            ],
            options: wrapperOptionGroup({
                label: 'Tiles only',
                icon: Icon.experiment(),
                intent: 'primary',
                info: 'Drives the gapped panel tiles at right.',
                items: [
                    wrapperOption({
                        label: 'Border Radius',
                        propName: '--panel-border-radius',
                        control: slider({
                            bind: 'borderRadius',
                            min: 0,
                            max: 24,
                            labelStepSize: 12,
                            width: 190
                        }),
                        info: 'For gapped or floating panels - set via the --panel-border-radius CSS var on a container.'
                    }),
                    wrapperOption({
                        label: 'Border Width',
                        propName: '--panel-border-width',
                        control: numberInput({bind: 'borderWidth', min: 0, max: 4, width: 70}),
                        info: 'An outline that traces the rounded corners.'
                    }),
                    wrapperOption({
                        label: 'Compact Header',
                        propName: 'PanelProps.compactHeader',
                        control: switchInput({bind: 'compactHeader'})
                    }),
                    wrapperOption({
                        label: 'Mask',
                        control: switchInput({bind: 'showMask'}),
                        info: 'Masks clip to the rounded corners, and the loading indicator insets from them.'
                    })
                ]
            }),
            item: tiles()
        });
    }
});

const tiles = hoistCmp.factory<PanelStylingModel>({
    render({model}) {
        const {borderRadius, borderWidth, compactHeader, showMask} = model;
        return div({
            className: 'tb-panel-styling',
            // The hooks are scoped to this container, so only the panels within it are rounded.
            style: {
                '--panel-border-radius': borderRadius,
                '--panel-border-width': borderWidth
            } as CSSProperties,
            items: [
                hbox({
                    className: 'tb-panel-styling__row',
                    items: [
                        panel({
                            title: 'Header + Toolbars',
                            flex: 1,
                            icon: Icon.window(),
                            compactHeader,
                            headerItems: [
                                button({
                                    icon: Icon.gear(),
                                    onClick: () => XH.toast({message: 'Header item clicked.'})
                                })
                            ],
                            tbar: [
                                button({text: 'New', icon: Icon.add(), intent: 'success'}),
                                filler(),
                                button({icon: Icon.edit()})
                            ],
                            contentBoxProps: {className: 'tb-panel-styling__content'},
                            item: placeholder('Content with a contrasting background.'),
                            bbar: [filler(), button({text: 'Save', intent: 'primary'})]
                        }),
                        panel({
                            title: 'Banners + Mask',
                            flex: 1,
                            icon: Icon.flag(),
                            compactHeader,
                            banner: [
                                {message: 'Top banner', intent: 'warning', compact: true},
                                {
                                    message: 'Bottom banner',
                                    intent: 'danger',
                                    position: 'bottom',
                                    compact: true
                                }
                            ],
                            mask: showMask,
                            item: placeholder(Icon.flag(), 'Toggle the mask in Options.')
                        }),
                        panel({
                            flex: 1,
                            loadingIndicator: showMask,
                            contentBoxProps: {className: 'tb-panel-styling__content'},
                            items: [
                                p({
                                    className: 'xh-pad',
                                    item: 'No header or toolbars - the content area itself meets the rounded corners. Its loading indicator shows with the mask.'
                                })
                            ],
                            bbar: [filler(), 'Bottom toolbar only']
                        })
                    ]
                }),
                hbox({
                    className: 'tb-panel-styling__row',
                    items: [
                        panel({
                            title: 'Collapsible',
                            icon: Icon.arrowToLeft(),
                            compactHeader,
                            model: model.sidePanelModel,
                            item: p({className: 'xh-pad', item: 'Resize or collapse me.'})
                        }),
                        panel({
                            title: 'Grid',
                            flex: 1,
                            icon: Icon.gridPanel(),
                            compactHeader,
                            mask: showMask,
                            item: hbox({
                                flex: 1,
                                items: [
                                    grid(),
                                    // Nested flush within the tile - Hoist keeps it square.
                                    panel({
                                        title: 'Nested',
                                        compactHeader: true,
                                        model: model.nestedPanelModel,
                                        item: p({
                                            className: 'xh-pad',
                                            item: 'A flush, nested panel.'
                                        })
                                    })
                                ]
                            }),
                            bbar: [filler(), gridCountLabel({unit: 'trade'})]
                        })
                    ]
                })
            ]
        });
    }
});

class PanelStylingModel extends HoistModel {
    @bindable accessor borderRadius = 8;
    @bindable accessor borderWidth = 1;
    @bindable accessor compactHeader = false;
    @bindable accessor showMask = false;

    @managed sidePanelModel = new PanelModel({side: 'left', defaultSize: 200, minSize: 120});

    @managed nestedPanelModel = new PanelModel({side: 'right', defaultSize: 160});

    @managed gridModel = new GridModel({
        sortBy: 'profit_loss|desc|abs',
        columns: [{field: 'id', hidden: true}, {...companyCol}, {...profitLossCol}]
    });

    override async doLoadAsync(loadSpec: LoadSpec) {
        const {trades} = await XH.fetchJson({url: 'trade'}, {loadSpec});
        this.gridModel.loadData(trades);
    }
}
