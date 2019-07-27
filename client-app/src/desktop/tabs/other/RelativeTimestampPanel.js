import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {box, filler} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button, buttonGroup} from '@xh/hoist/desktop/cmp/button';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../common/Wrapper';

@HoistComponent
export class RelativeTimestampPanel extends Component {

    @bindable
    timestamp = new Date();

    @bindable
    useShortFmt = false;

    render() {
        return wrapper({
            description: `
                A relative timestamp will display a given timestamp in terms of how far long ago / 
                in the future it is relative to the present moment. The component will update 
                itself on a regular interval to stay current, and displays the time difference
                in a friendly and readable manner. 
            `,
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/RelativeTimestampPanel.js',
                    notes: 'This example.'
                },
                {
                    url: '$HR/cmp/relativetimestamp/RelativeTimestamp.js',
                    notes: 'Hoist component.'
                }
            ],
            item: panel({
                title: 'Other › Relative Timestamp',
                icon: Icon.clock(),
                width: 700,
                items: [
                    box({
                        margin: 10,
                        item: relativeTimestamp({
                            timestamp: this.timestamp,
                            options: {allowFuture: true, prefix: 'Latest timestamp:', short: this.useShortFmt},
                            marginLeft: 10
                        })
                    }),
                    box({
                        margin: 10,
                        style: {opacity: 0.5},
                        item: new Date(this.timestamp).toString()
                    })
                ],
                bbar: toolbar(
                    filler(),
                    buttonGroup({
                        items: [
                            button({
                                text: 'Set to past',
                                icon: Icon.angleLeft(),
                                minimal: false,
                                width: 130,
                                onClick: this.setToPast
                            }),
                            button({
                                text: 'Set to now',
                                intent: 'primary',
                                icon: Icon.clock(),
                                minimal: false,
                                width: 130,
                                onClick: this.setToNow
                            }),
                            button({
                                text: 'Set to future',
                                rightIcon: Icon.angleRight(),
                                minimal: false,
                                width: 130,
                                onClick: this.setToFuture
                            })
                        ]
                    }),
                    filler(),
                    switchInput({
                        label: 'Short',
                        labelAlign: 'left',
                        model: this,
                        bind: 'useShortFmt'
                    }),
                )
            })
        });
    }

    setToNow = () => {
        this.setTimestamp(Date.now());
    }

    setToPast = () => {
        this.setTimestamp(Date.now() - this.randShift());
    }

    setToFuture = () => {
        this.setTimestamp(Date.now() + this.randShift());
    }

    randShift() {
        return Math.random() * 1000 * 60 * 60 * 24 * 4;
    }
}