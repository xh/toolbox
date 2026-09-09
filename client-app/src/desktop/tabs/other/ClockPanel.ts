import {clock, ClockProps} from '@xh/hoist/cmp/clock';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {numberInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {TIME_FMT} from '@xh/hoist/format';
import {Icon} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {ONE_SECOND} from '@xh/hoist/utils/datetime';
import {
    demoGrid,
    demoPanel,
    demoPlayground,
    demoRow,
    demoSection,
    fmtDemoConfig,
    wrapper,
    wrapperOption,
    wrapperOptionGroup
} from '../../common';

/** The Clock props the rail drives. Named so both the instances and the snippet share one type. */
type ClockDisplayProps = Pick<ClockProps, 'format' | 'prefix' | 'suffix' | 'updateInterval'>;

/** The zones shown in the World Clocks section, plus one deliberate error case. */
const ZONES: Array<{label: string; timezone: string; info?: string}> = [
    {label: 'New York', timezone: 'America/New_York'},
    {label: 'Chicago', timezone: 'America/Chicago'},
    {label: 'Denver', timezone: 'America/Denver'},
    {label: 'Los Angeles', timezone: 'America/Los_Angeles'},
    {label: 'London', timezone: 'Europe/London'},
    {label: 'Stockholm', timezone: 'Europe/Stockholm'},
    {label: 'Hong Kong', timezone: 'Asia/Hong_Kong'},
    {label: 'Tokyo', timezone: 'Asia/Tokyo'},
    {label: 'Unknown zone', timezone: 'NoSuchZone', info: "errorString default, '???'"}
];

export const clockPanel = hoistCmp.factory({
    displayName: 'ClockPanel',
    model: creates(() => ClockPanelModel),

    render({model}) {
        const {clockProps} = model;
        return wrapper({
            title: 'Clock',
            icon: Icon.clock(),
            description: [
                'A clock displays the current time, either for browser local time (the default)',
                'or for a configurable timezone. It fetches timezone offsets from the server, so',
                'any Java-style timezone ID works.',
                '',
                'It updates itself on `updateInterval` and renders through a moment.js `format`',
                'string.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/ClockPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/clock/Clock.ts', notes: 'Hoist component.'}
            ],
            options: [
                wrapperOptionGroup({
                    label: 'All clocks on the page',
                    items: [
                        wrapperOption({
                            label: 'Format',
                            propName: 'ClockProps.format',
                            control: textInput({
                                bind: 'format',
                                width: 120,
                                placeholder: TIME_FMT,
                                commitOnChange: true
                            }),
                            info: 'A moment.js format string.'
                        }),
                        wrapperOption({
                            label: 'Interval (ms)',
                            propName: 'ClockProps.updateInterval',
                            control: numberInput({
                                bind: 'updateInterval',
                                width: 90,
                                placeholder: `${ONE_SECOND}`
                            })
                        }),
                        wrapperOption({
                            label: 'Prefix',
                            propName: 'ClockProps.prefix',
                            control: textInput({bind: 'prefix', width: 120, commitOnChange: true})
                        }),
                        wrapperOption({
                            label: 'Suffix',
                            propName: 'ClockProps.suffix',
                            control: textInput({bind: 'suffix', width: 120, commitOnChange: true})
                        })
                    ]
                })
            ],
            item: demoPanel({
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        note: 'Driven by the rail options, which apply to every clock below.',
                        item: demoPlayground({
                            instanceWidth: 200,
                            showValue: false,
                            caption: 'No timezone set, so browser local time.',
                            config: fmtDemoConfig<ClockProps>('clock', clockProps),
                            item: clock(clockProps)
                        })
                    }),
                    demoSection({
                        title: 'World Clocks',
                        note: 'One clock per timezone, each fetching its offset from the server.',
                        item: demoGrid({
                            columns: 5,
                            items: ZONES.map(({label, timezone, info}) =>
                                demoRow({
                                    key: label,
                                    label,
                                    info,
                                    item: clock({...clockProps, timezone})
                                })
                            )
                        })
                    })
                ]
            })
        });
    }
});

class ClockPanelModel extends HoistModel {
    @bindable format: string;
    @bindable updateInterval: number;
    @bindable prefix: string;
    @bindable suffix: string;

    /**
     * Props every clock on the page spreads, so the rail options reach it. An emptied rail field
     * resolves to undefined rather than an empty string, letting Clock fall back to its own
     * default - passing `format: ''` would render differently from the `clock()` the snippet shows.
     *
     * The Playground snippet reads this same getter, so the code shown cannot drift from the
     * instances rendered beside it.
     */
    get clockProps(): ClockDisplayProps {
        const {format, prefix, suffix, updateInterval} = this;
        return {
            format: format || undefined,
            prefix: prefix || undefined,
            suffix: suffix || undefined,
            updateInterval: updateInterval || undefined
        };
    }

    constructor() {
        super();
        makeObservable(this);
    }
}
