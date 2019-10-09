import React from 'react';
import {vbox, div, hframe, span} from '@xh/hoist/cmp/layout';
import {clock} from '@xh/hoist/cmp/clock';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {textInput, numberInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {bindable} from '@xh/hoist/mobx';
import {ONE_SECOND} from '@xh/hoist/utils/datetime';
import {wrapper} from '../../common/Wrapper';

import './ClockPanel.scss';

export const ClockPanel = hoistCmp({
    model: creates(() => new Model()),

    render({model}) {
        return wrapper({
            description: [
                <p>A clock will display the current time for a given timezone.</p>
            ],
            links: [
                {url: '$TB/client-app/src/desktop/tabs/other/ClockPanel.js', notes: 'This example.'},
                {url: '$HR/cmp/clock/Clock.js', notes: 'Hoist component.'}
            ],
            item: panel({
                title: 'Other › Clock',
                icon: Icon.clock(),
                width: 700,
                item: hframe({
                    className: 'clock-container',
                    items: [
                        clockCard({label: 'Local', timezone: null}),
                        clockCard({label: 'New York', timezone: 'America/New_York'}),
                        clockCard({label: 'Denver', timezone: 'America/Denver'}),
                        clockCard({label: 'Chicago', timezone: 'America/Chicago'}),
                        clockCard({label: 'Los Angeles', timezone: 'America/Los_Angeles'}),
                        clockCard({label: 'London', timezone: 'Europe/London'}),
                        clockCard({label: 'Stockholm', timezone: 'Europe/Stockholm'}),
                        clockCard({label: 'Hong Kong', timezone: 'Asia/Hong_Kong'}),
                        clockCard({label: 'Tokyo', timezone: 'Asia/Tokyo'}),
                        clockCard({label: 'Auckland', timezone: 'Pacific/Auckland'})
                    ]
                }),
                bbar: [
                    span('Format'),
                    textInput({
                        model,
                        bind: 'format',
                        width: 120,
                        placeholder: 'h:mm:ss a'
                    }),
                    toolbarSep(),
                    span('Update Interval (ms)'),
                    numberInput({
                        model,
                        bind: 'updateInterval',
                        width: 60,
                        placeholder: `${ONE_SECOND}`
                    }),
                    toolbarSep(),
                    span('Prefix'),
                    textInput({
                        model,
                        bind: 'prefix',
                        width: 100
                    }),
                    toolbarSep(),
                    span('Suffix'),
                    textInput({
                        model,
                        bind: 'suffix',
                        width: 100
                    })
                ]
            })
        });
    }
});

const clockCard = hoistCmp.factory({
    className: 'clock-card',
    render({label, timezone, model, ...rest}) {
        const {format, prefix, suffix, updateInterval} = model;
        return vbox({
            ...rest,
            items: [
                div(label),
                clock({timezone, format, prefix, suffix, updateInterval})
            ]
        });
    }
});

@HoistModel
class Model {
    @bindable format;
    @bindable updateInterval;
    @bindable prefix;
    @bindable suffix;
}