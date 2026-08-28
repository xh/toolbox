import {clock} from '@xh/hoist/cmp/clock';
import {div, hframe, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {numberInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {TIME_FMT} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {ONE_SECOND} from '@xh/hoist/utils/datetime';
import {wrapper, wrapperOption} from '../../common';
import './ClockPanel.scss';

export const clockPanel = hoistCmp.factory({
    model: creates(() => ClockPanelModel),

    render({model}) {
        return wrapper({
            title: 'Clock',
            icon: Icon.clock(),
            description: [
                'A clock will display the current time, either for browser local time (the',
                'default) or for a configurable timezone. It fetches timezone offsets from the',
                'server to support any Java-style timezone ID.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/ClockPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/clock/Clock.ts', notes: 'Hoist component.'}
            ],
            options: [
                wrapperOption({
                    label: 'Format',
                    propName: 'ClockProps.format',
                    control: textInput({model, bind: 'format', width: 120, placeholder: TIME_FMT}),
                    info: 'A moment.js format string.'
                }),
                wrapperOption({
                    label: 'Interval (ms)',
                    propName: 'ClockProps.updateInterval',
                    control: numberInput({
                        model,
                        bind: 'updateInterval',
                        width: 90,
                        placeholder: `${ONE_SECOND}`
                    })
                }),
                wrapperOption({
                    label: 'Prefix',
                    propName: 'ClockProps.prefix',
                    control: textInput({model, bind: 'prefix', width: 120})
                }),
                wrapperOption({
                    label: 'Suffix',
                    propName: 'ClockProps.suffix',
                    control: textInput({model, bind: 'suffix', width: 120})
                })
            ],
            item: panel({
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
                })
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
    @bindable accessor format: string;
    @bindable accessor updateInterval: number;
    @bindable accessor prefix: string;
    @bindable accessor suffix: string;
}
