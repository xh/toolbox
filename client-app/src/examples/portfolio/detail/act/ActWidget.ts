import {form} from '@xh/hoist/cmp/form';
import {div, frame, hframe, vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {popover} from '@xh/hoist/kit/blueprint';
import {ActModel} from './ActModel';
import {tickerSelector} from './TickerSelector';
import './ActWidget.scss';

export const actWidget = hoistCmp.factory({
    model: creates(ActModel),

    render({model}) {
        return panel({
            items: [
                frame({
                    className: 'xh-margin xh-border',
                    item: model.selectedTickers.join(', ')
                })
            ],
            bbar: [configPopover()]
        });
    }
});

const configPopover = hoistCmp.factory<ActModel>({
    render({model}) {
        return popover({
            item: button({
                text: 'Chart Options',
                icon: Icon.settings(),
                outlined: true
            }),
            content: panel({
                // title: 'Chart Options',
                // icon: Icon.settings(),
                compactHeader: true,
                className: 'act-config-popover',
                height: 500,
                width: 600,
                item: hframe({
                    padding: 10,
                    gap: 10,
                    items: [
                        tickerSelector({
                            flex: 1,
                            className: 'xh-border'
                        }),
                        panel({
                            title: 'Transforms',
                            icon: Icon.diff(),
                            compactHeader: true,
                            flex: 1,
                            className: 'xh-border',
                            item: form({
                                fieldDefaults: {inline: true},
                                item: div({
                                    className: 'xh-pad',
                                    items: [
                                        formField({
                                            field: 'avgPeers',
                                            label: null,
                                            item: switchInput({
                                                label: 'Show peers as average'
                                            })
                                        }),
                                        formField({
                                            field: 'rebase',
                                            label: null,
                                            item: switchInput({
                                                label: 'Rebase to 100%'
                                            })
                                        }),
                                        formField({
                                            field: 'rebaseStartDate',
                                            disabled: !model.configFormModel.values.rebase,
                                            item: select({
                                                options: model.selectableDates.map(it => ({
                                                    leftIcon: Icon.calendar(),
                                                    enableFilter: false,
                                                    value: it,
                                                    label: it.toString()
                                                }))
                                            })
                                        })
                                    ]
                                })
                            })
                        })
                    ]
                })
            }),
            popoverClassName: 'xh-popup--framed',
            isOpen: true
        });
    }
});
