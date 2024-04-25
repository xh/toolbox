import {clock} from '@xh/hoist/cmp/clock';
import {div, hframe, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {numberInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {TIME_FMT} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {ONE_SECOND} from '@xh/hoist/utils/datetime';
import {wrapper} from '../../common';
import './ClockPanel.scss';

export const clockPanel = hoistCmp.factory({
    model: creates(() => ClockPanelModel),

    render({model}) {
        return wrapper({
            description: `
                    A clock will display the current time, either for browser local time (the default)
                    or for a configurable timezone. It fetches timezone offsets from the server to
                    support any Java-style timezone ID.`,
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/ClockPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/clock/Clock.ts', notes: 'Hoist component.'}
            ],
            item: panel({
                title: 'Other › Clock',
                icon: Icon.clock(),
                width: 700,
                item: hframe({
                    className: 'tb-clock-container',
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
                        clockCard({label: 'Bad Timezone', timezone: 'NoSuchZone'})
                    ]
                }),
                bbar: [
                    span('Format'),
                    textInput({
                        bind: 'format',
                        width: 100,
                        placeholder: TIME_FMT
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
                        width: 90
                    }),
                    toolbarSep(),
                    span('Suffix'),
                    textInput({
                        model,
                        bind: 'suffix',
                        width: 90
                    })
                ]
            })
        });
    }
});

const clockCard = hoistCmp.factory<ClockPanelModel>({
    className: 'tb-clock-card',
    render({label, timezone, model, ...rest}) {
        const {format, prefix, suffix, updateInterval} = model;
        return vbox({
            ...rest,
            items: [div(label), clock({timezone, format, prefix, suffix, updateInterval})]
        });
    }
});

class ClockPanelModel extends HoistModel {
    @bindable format: string;
    @bindable updateInterval: number;
    @bindable prefix: string;
    @bindable suffix: string;

    constructor() {
        super();
        makeObservable(this);
    }
}
