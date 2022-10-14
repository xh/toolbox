import {box, filler} from '@xh/hoist/cmp/layout';
import {relativeTimestamp} from '@xh/hoist/cmp/relativetimestamp';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {button, buttonGroup} from '@xh/hoist/desktop/cmp/button';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {action, observable, bindable, makeObservable} from '@xh/hoist/mobx';
import {random, sample} from 'lodash';
import moment from 'moment';
import {wrapper} from '../../common';

export const relativeTimestampPanel = hoistCmp.factory({
    model: creates(() => RelativeTimestampPanelModel),

    render({model}) {
        return wrapper({
            description: `
                A relative timestamp will display a given timestamp in terms of how far long ago / 
                in the future it is relative to the present moment. The component will update 
                itself on a regular interval to stay current, and displays the time difference
                in a friendly and readable manner. 
            `,
            links: [
                {url: '$TB/client-app/src/desktop/tabs/other/RelativeTimestampPanel.js', notes: 'This example.'},
                {url: '$HR/cmp/relativetimestamp/RelativeTimestamp.js', notes: 'Hoist component.'}
            ],
            item: panel({
                title: 'Other › Relative Timestamp',
                icon: Icon.clock(),
                width: 700,
                items: [
                    box({
                        style: {fontSize: '1.8em'},
                        margin: 10,
                        item: relativeTimestamp({
                            bind: 'timestamp',
                            options: {
                                allowFuture: true,
                                prefix: model.prefix,
                                short: model.useShortFmt
                            }
                        })
                    }),
                    box({
                        margin: '10 10 40 10',
                        style: {opacity: 0.5},
                        item: new Date(model.timestamp).toString()
                    })
                ],
                bbar: [
                    switchInput({
                        label: 'Short',
                        labelSide: 'left',
                        bind: 'useShortFmt'
                    }),
                    filler(),
                    buttonGroup(
                        button({
                            text: 'Set to past',
                            icon: Icon.angleLeft(),
                            minimal: false,
                            width: 130,
                            onClick: () => model.setToPast()
                        }),
                        button({
                            text: 'Set to now',
                            intent: 'primary',
                            icon: Icon.clock(),
                            minimal: false,
                            width: 130,
                            onClick: () => model.setToNow()
                        }),
                        button({
                            text: 'Set to future',
                            rightIcon: Icon.angleRight(),
                            minimal: false,
                            width: 130,
                            onClick: () => model.setToFuture()
                        })
                    )
                ]
            })
        });
    }
});


class RelativeTimestampPanelModel extends HoistModel {
    @observable prefix = 'Refreshed';
    @observable timestamp = Date.now();
    @bindable useShortFmt = false;

    constructor() {
        super();
        makeObservable(this);
    }

    @action
    setToNow() {
        this.timestamp = Date.now();
    }

    @action
    setToPast() {
        this.prefix = 'Refreshed';
        this.timestamp = moment().subtract(randVal(), randUnit()).valueOf();
    }

    @action
    setToFuture() {
        this.prefix = 'Scheduled';
        this.timestamp = moment().add(randVal(), randUnit()).valueOf();
    }
}

const randUnit = () => sample(['y', 'M', 'd', 'h', 'm', 's', 'ms']);
const randVal = () => random(1, 10);
