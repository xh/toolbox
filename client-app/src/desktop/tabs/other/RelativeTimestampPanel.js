/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {action, observable} from '@xh/hoist/mobx';
import {box, filler} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {wrapper} from '../../common/Wrapper';

@HoistComponent()
export class RelativeTimestampPanel extends Component {

    @observable
    timestamp = new Date();

    render() {
        return wrapper({
            description: `
                A relative timestamp will display a given timestamp in terms of how far long ago / 
                in the future it is relative to the present moment. The component will update 
                itself on a regular interval to stay current, and displays the time difference
                in a friendly and readable manner. 
            `,
            item: panel({
                title: 'Other > Relative Timestamp',
                icon: Icon.clock(),
                width: 700,
                items: [
                    box({
                        margin: 10,
                        items: [
                            'Latest timestamp:',
                            relativeTimestamp({
                                timestamp: this.timestamp,
                                options: {allowFuture: true},
                                marginLeft: 10
                            })
                        ]
                    }),
                    box({
                        margin: 10,
                        style: {opacity: 0.5},
                        item: new Date(this.timestamp).toString()
                    })
                ],
                bbar: toolbar(
                    filler(),
                    button({
                        text: 'Set to past',
                        icon: Icon.angleLeft(),
                        onClick: this.setToPast
                    }),
                    button({
                        text: 'Set to now',
                        intent: 'primary',
                        icon: Icon.clock(),
                        onClick: this.setToNow
                    }),
                    button({
                        text: 'Set to future',
                        icon: Icon.angleRight(),
                        onClick: this.setToFuture
                    })
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

    @action
    setTimestamp(ts) {
        this.timestamp = ts;
    }

    randShift() {
        return Math.random() * 1000 * 60 * 60 * 24 * 4;
    }
}