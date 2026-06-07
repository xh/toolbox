import {box, filler, label, vbox, vframe} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {switchInput, dateInput, numberInput, textInput, select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {isNil, omitBy} from 'lodash';
import {wrapper, wrapperOption} from '../../../common';
import {RelativeTimestampPanelModel} from './RelativeTimestampPanelModel';
import {LocalDate} from '@xh/hoist/utils/datetime';

export const relativeTimestampPanel = hoistCmp.factory({
    model: creates(() => RelativeTimestampPanelModel),

    render({model}) {
        const rtProps = omitBy(
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
            title: 'Relative Timestamp',
            icon: Icon.clock(),
            description: [
                '`RelativeTimestamp` displays a timestamp in terms of how long ago, or how far',
                'in the future, it falls relative to the present moment (for example, "5',
                'minutes ago"). It updates itself on a regular interval to stay current and',
                'renders the difference in a friendly, readable form.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/relativetimestamp/RelativeTimestampPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/relativetimestamp/RelativeTimestamp.ts', notes: 'Hoist component.'}
            ],
            options: [
                wrapperOption({
                    label: 'Allow Future',
                    control: switchInput({model, bind: 'allowFuture'})
                }),
                wrapperOption({label: 'Short', control: switchInput({model, bind: 'short'})}),
                wrapperOption({
                    label: 'Future Suffix',
                    control: textInput({model, bind: 'futureSuffix', width: 140})
                }),
                wrapperOption({
                    label: 'Past Suffix',
                    control: textInput({model, bind: 'pastSuffix', width: 140})
                }),
                wrapperOption({
                    label: 'Equal String',
                    control: textInput({model, bind: 'equalString', width: 140})
                }),
                wrapperOption({
                    label: 'Epsilon (secs)',
                    control: numberInput({
                        model,
                        bind: 'epsilon',
                        displayWithCommas: true,
                        min: 0,
                        width: 90
                    })
                }),
                wrapperOption({
                    label: 'Empty Result',
                    control: textInput({model, bind: 'emptyResult', width: 140})
                }),
                wrapperOption({
                    label: 'Prefix',
                    control: textInput({model, bind: 'prefix', width: 140})
                }),
                wrapperOption({
                    label: 'LocalDate Mode',
                    control: select({
                        model,
                        bind: 'localDateMode',
                        width: 150,
                        options: ['always', 'useTimeForSameDay', 'useTimeFor24Hr'],
                        placeholder: '',
                        enableClear: true
                    })
                }),
                wrapperOption({
                    label: 'Relative To',
                    control: dateInput({
                        model,
                        bind: 'relativeTo',
                        width: 150,
                        timePrecision: 'second',
                        showActionsBar: true
                    })
                })
            ],
            item: panel({
                width: 600,
                item: vframe(
                    box({
                        style: {fontSize: '1.8em'},
                        margin: '10 10 40 10',
                        item: relativeTimestamp({bind: 'timestamp', ...rtProps})
                    }),
                    vbox({
                        margin: '10 10 10 10',
                        style: {opacity: 0.5},
                        items: [label('Timestamp: '), new Date(model.timestamp).toString()]
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
                            model.lastFocusedControl = 'pastDatePicker';
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
                            model.lastFocusedControl = 'futureDatePicker';
                        }
                    }),
                    filler()
                ]
            })
        });
    }
});
