import {box, div, filler, hframe, label, vbox, vframe, vspacer} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {switchInput, dateInput, numberInput, textInput, select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {isNil, omitBy} from 'lodash';
import {wrapper} from '../../../common';
import {RelativeTimestampPanelModel} from './RelativeTimestampPanelModel';
import {LocalDate} from '@xh/hoist/utils/datetime';

export const relativeTimestampPanel = hoistCmp.factory({
    model: creates(() => RelativeTimestampPanelModel),

    render({model}) {
        const options = omitBy(
            {
                allowFuture: model.allowFuture,
                short: model.short,
                futureSuffix: model.futureSuffix,
                pastSuffix: model.pastSuffix,
                equalString: model.equalString,
                epsilon: model.epsilon,
                emptyResult: model.emptyResult,
                prefix: model.prefix,
                relativeTo: model.relativeTo,
                localDateMode: model.localDateMode
            },
            it => isNil(it)
        );

        return wrapper({
            description: `
                A relative timestamp will display a given timestamp in terms of how far long ago / 
                in the future it is relative to the present moment. The component will update 
                itself on a regular interval to stay current, and displays the time difference
                in a friendly and readable manner. 
            `,
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/RelativeTimestampPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/relativetimestamp/RelativeTimestamp.ts', notes: 'Hoist component.'}
            ],
            item: panel({
                title: 'Other › Relative Timestamp',
                icon: Icon.clock(),
                width: 840,
                items: [
                    hframe({
                        items: [
                            panel({
                                item: vframe(
                                    box({
                                        style: {fontSize: '1.8em'},
                                        margin: '10 10 40 10',
                                        item: relativeTimestamp({
                                            ref: model.relativeTimestampRef,
                                            bind: 'timestamp',
                                            options
                                        })
                                    }),
                                    vbox({
                                        margin: '10 10 10 10',
                                        style: {opacity: 0.5},
                                        items: [
                                            label('Timestamp: '),
                                            new Date(model.timestamp).toString()
                                        ]
                                    })
                                ),
                                bbar: [
                                    filler(),
                                    dateInput({
                                        bind: 'pastTimestamp',
                                        placeholder: '< Set to past',
                                        maxDate: new Date(),
                                        timePrecision: 'second',
                                        showActionsBar: true,
                                        onChange: () => {
                                            model.currentTimestamp = model.futureTimestamp = null;
                                            model.setLastFocusedControl('pastDatePicker');
                                        }
                                    }),
                                    button({
                                        text: 'Set to now',
                                        intent: 'primary',
                                        icon: Icon.clock(),
                                        minimal: false,
                                        width: 130,
                                        onClick: () => model.setToNow()
                                    }),
                                    dateInput({
                                        bind: 'futureTimestamp',
                                        placeholder: 'Set to future >',
                                        minDate: LocalDate.today(),
                                        timePrecision: 'second',
                                        showActionsBar: true,
                                        onChange: () => {
                                            model.currentTimestamp = model.pastTimestamp = null;
                                            model.setLastFocusedControl('futureDatePicker');
                                        }
                                    }),
                                    filler()
                                ]
                            }),
                            panel({
                                title: 'Options',
                                icon: Icon.settings(),
                                className: 'tbox-display-opts',
                                compactHeader: true,
                                modelConfig: {side: 'right', defaultSize: 250, resizable: false},
                                item: div({
                                    className: 'tbox-display-opts__inner',
                                    items: [
                                        switchInput({
                                            label: 'Allow Future',
                                            labelSide: 'left',
                                            bind: 'allowFuture'
                                        }),
                                        switchInput({
                                            label: 'Short',
                                            labelSide: 'left',
                                            bind: 'short'
                                        }),
                                        vspacer(5),
                                        label('Future Suffix'),
                                        textInput({
                                            bind: 'futureSuffix'
                                        }),
                                        label('Past Suffix'),
                                        textInput({
                                            bind: 'pastSuffix'
                                        }),
                                        label('Equal String'),
                                        textInput({
                                            bind: 'equalString'
                                        }),
                                        label('Epsilon (in seconds)'),
                                        numberInput({
                                            bind: 'epsilon',
                                            displayWithCommas: true,
                                            min: 0
                                        }),
                                        label('Empty Result'),
                                        textInput({
                                            bind: 'emptyResult'
                                        }),
                                        label('Prefix'),
                                        textInput({
                                            bind: 'prefix'
                                        }),
                                        label('LocalDate Mode'),
                                        select({
                                            options: [
                                                'always',
                                                'useTimeForSameDay',
                                                'useTimeFor24Hr'
                                            ],
                                            placeholder: '',
                                            enableClear: true,
                                            bind: 'localDateMode'
                                        }),
                                        label('Relative To'),
                                        dateInput({
                                            bind: 'relativeTo',
                                            timePrecision: 'second',
                                            showActionsBar: true
                                        })
                                    ]
                                })
                            })
                        ]
                    })
                ]
            })
        });
    }
});
