import {box, hbox, vframe} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button, buttonGroup} from '@xh/hoist/desktop/cmp/button';
import {dateInput, numberInput, select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {fmtDateTime} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {HOURS, DAYS} from '@xh/hoist/utils/datetime';
import {isNil, omitBy} from 'lodash';
import {wrapper, wrapperOption} from '../../../common';
import {RelativeTimestampPanelModel} from './RelativeTimestampPanelModel';
import './RelativeTimestampPanel.scss';

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
                'renders the difference in a friendly, readable form.',
                '',
                'Pick a target moment below, then tune the display options to see how the output',
                'changes.'
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
                    label: 'Target',
                    propName: 'RelativeTimestampProps.timestamp',
                    control: dateInput({
                        model,
                        bind: 'timestamp',
                        width: 170,
                        timePrecision: 'second',
                        showActionsBar: true
                    }),
                    info: 'The moment rendered relative to now.'
                }),
                buttonGroup({
                    className: 'tb-rel-ts__presets',
                    items: [
                        button({text: '-1 day', onClick: () => model.setOffset(-DAYS)}),
                        button({text: '-1 hr', onClick: () => model.setOffset(-HOURS)}),
                        button({text: 'Now', onClick: () => model.setToNow()}),
                        button({text: '+1 hr', onClick: () => model.setOffset(HOURS)}),
                        button({text: '+1 day', onClick: () => model.setOffset(DAYS)})
                    ]
                }),
                wrapperOption({
                    label: 'Allow Future',
                    propName: 'RelativeTimestampOptions.allowFuture',
                    control: switchInput({model, bind: 'allowFuture'}),
                    info: 'Render future timestamps; otherwise they fall back to the empty result.'
                }),
                wrapperOption({
                    label: 'Short',
                    propName: 'RelativeTimestampOptions.short',
                    control: switchInput({model, bind: 'short'})
                }),
                wrapperOption({
                    label: 'Prefix',
                    propName: 'RelativeTimestampOptions.prefix',
                    control: textInput({model, bind: 'prefix', width: 140})
                }),
                wrapperOption({
                    label: 'Future Suffix',
                    propName: 'RelativeTimestampOptions.futureSuffix',
                    control: textInput({model, bind: 'futureSuffix', width: 140})
                }),
                wrapperOption({
                    label: 'Past Suffix',
                    propName: 'RelativeTimestampOptions.pastSuffix',
                    control: textInput({model, bind: 'pastSuffix', width: 140})
                }),
                wrapperOption({
                    label: 'Equal String',
                    propName: 'RelativeTimestampOptions.equalString',
                    control: textInput({model, bind: 'equalString', width: 140})
                }),
                wrapperOption({
                    label: 'Epsilon (secs)',
                    propName: 'RelativeTimestampOptions.epsilon',
                    control: numberInput({
                        model,
                        bind: 'epsilon',
                        displayWithCommas: true,
                        min: 0,
                        width: 90
                    }),
                    info: 'Differences within this many seconds render as the equal string.'
                }),
                wrapperOption({
                    label: 'Empty Result',
                    propName: 'RelativeTimestampOptions.emptyResult',
                    control: textInput({model, bind: 'emptyResult', width: 140})
                }),
                wrapperOption({
                    label: 'LocalDate Mode',
                    propName: 'RelativeTimestampOptions.localDateMode',
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
                    propName: 'RelativeTimestampOptions.relativeTo',
                    control: dateInput({
                        model,
                        bind: 'relativeTo',
                        width: 170,
                        timePrecision: 'second',
                        showActionsBar: true
                    }),
                    info: 'Compare against this moment instead of the present.'
                })
            ],
            item: panel({
                width: 600,
                item: vframe({
                    className: 'tb-rel-ts',
                    alignItems: 'center',
                    justifyContent: 'center',
                    items: [
                        box({
                            className: 'tb-rel-ts__value',
                            item: relativeTimestamp({bind: 'timestamp', ...rtProps})
                        }),
                        hbox({
                            className: 'tb-rel-ts__abs',
                            items: ['as of ', fmtDateTime(model.timestamp)]
                        })
                    ]
                })
            })
        });
    }
});
