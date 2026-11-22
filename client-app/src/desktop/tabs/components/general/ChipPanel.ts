import {badge} from '@xh/hoist/cmp/badge';
import type {ChipProps} from '@xh/hoist/cmp/chip';
import {chip} from '@xh/hoist/cmp/chip';
import {grid, GridModel} from '@xh/hoist/cmp/grid';
import {div, hbox, span} from '@xh/hoist/cmp/layout';
import type {Intent} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {
    iconPicker,
    intentInput,
    segmentedControl,
    switchInput,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, observableRef} from '@xh/hoist/mobx';
import {
    demoFrame,
    demoGrid,
    demoPanel,
    demoPlayground,
    demoSection,
    fmtDemoConfig,
    raw
} from '../../../common/Demo';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import './ChipPanel.scss';

type ChipStyle = 'filled' | 'minimal' | 'outlined';

const INTENTS: Intent[] = [null, 'primary', 'success', 'warning', 'danger'],
    STYLES: ChipStyle[] = ['filled', 'minimal', 'outlined'],
    COLORS = {purple: 'var(--xh-purple)', teal: 'var(--xh-green)'},
    FILES = ['q3-positions-final-reconciled.csv', 'risk-limits.xlsx', 'jane.smith', 'EOD snapshot'],
    FILTERS = ['Open', 'Filled', 'Cancelled', 'Mine', 'Today'],
    STATUS_INTENTS: Record<string, Intent> = {
        Settled: 'success',
        Pending: 'warning',
        Failed: 'danger',
        Booked: 'primary',
        Draft: null
    };

export const chipPanel = hoistCmp.factory({
    displayName: 'ChipPanel',
    model: creates(() => ChipPanelModel),

    render({model}) {
        return wrapper({
            title: 'Chip',
            icon: Icon.tag(),
            description: [
                'A `Chip` labels an item with a status, a category or a value - alone, in a row',
                'of chips, or in a grid cell. It can be clicked, toggled with `active`, and',
                'removed. It takes no model and works on desktop and mobile.',
                '',
                'For a count attached to a title or a button, use a `Badge`. A chip can hold one.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/components/general/ChipPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/chip/README.md', text: 'Chip docs'},
                {url: '$HR/cmp/chip/Chip.ts', notes: 'Hoist component.'},
                {url: '$HR/cmp/chip/Chip.scss', notes: 'Styles.'},
                {url: '$HR/styles/vars.scss', notes: 'CSS variables, in the Chips block.'}
            ],
            options: [
                wrapperOptionGroup({
                    label: 'Playground',
                    info: 'Drives the Playground chip.',
                    icon: Icon.experiment(),
                    intent: 'primary',
                    children: [
                        wrapperOption({
                            label: 'Intent',
                            propName: 'ChipProps.intent',
                            info: 'Clear for a neutral chip.',
                            control: intentInput({bind: 'intent', enableClear: true})
                        }),
                        wrapperOption({
                            label: 'Color',
                            propName: 'ChipProps.color',
                            info: 'Any CSS color. Wins over intent.',
                            control: segmentedControl({
                                bind: 'colorName',
                                fill: false,
                                compact: true,
                                options: [
                                    {value: null, label: 'None'},
                                    {value: 'purple', label: 'Purple'},
                                    {value: 'teal', label: 'Green'}
                                ]
                            })
                        }),
                        wrapperOption({
                            label: 'Style',
                            info: 'minimal / outlined',
                            control: segmentedControl({
                                bind: 'chipStyle',
                                fill: false,
                                compact: true,
                                options: STYLES
                            })
                        }),
                        wrapperOption({
                            label: 'Size',
                            propName: 'ChipProps.size',
                            control: segmentedControl({
                                bind: 'size',
                                fill: false,
                                compact: true,
                                options: ['compact', 'standard', 'large']
                            })
                        }),
                        wrapperOption({
                            label: 'Icon',
                            propName: 'ChipProps.icon',
                            control: iconPicker({
                                bind: 'iconName',
                                valueField: 'name',
                                enableClear: true,
                                width: 120
                            })
                        }),
                        wrapperOption({
                            label: 'Text',
                            propName: 'ChipProps.children',
                            control: textInput({bind: 'text', width: 160, commitOnChange: true})
                        }),
                        wrapperOption({
                            label: 'Round',
                            propName: 'ChipProps.round',
                            control: switchInput({bind: 'round'})
                        }),
                        wrapperOption({
                            label: 'Clickable',
                            propName: 'ChipProps.onClick',
                            info: 'Toggles active on click.',
                            control: switchInput({bind: 'clickable'})
                        }),
                        wrapperOption({
                            label: 'Removable',
                            propName: 'ChipProps.onRemove',
                            control: switchInput({bind: 'removable'})
                        }),
                        wrapperOption({
                            label: 'Disabled',
                            propName: 'ChipProps.disabled',
                            control: switchInput({bind: 'disabled'})
                        })
                    ]
                })
            ],
            children: demoPanel({
                children: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        children: demoPlayground({
                            value: model.lastEvent,
                            caption: 'Click the chip, its remove button, or press Backspace.',
                            config: fmtDemoConfig<ChipProps>('chip', model.chipConfig),
                            children: chip(model.chipProps)
                        })
                    }),
                    demoSection({
                        title: 'Styles and Intents',
                        note: 'Filled, minimal and outlined, for each intent and a custom color.',
                        children: demoFrame({
                            children: div({
                                className: 'tb-chip-panel__matrix',
                                children: [
                                    span(),
                                    ...[...INTENTS.map(it => it ?? 'none'), 'color'].map(h =>
                                        span({
                                            key: h,
                                            className: 'tb-chip-panel__head',
                                            children: h
                                        })
                                    ),
                                    ...STYLES.flatMap(style => [
                                        span({
                                            key: style,
                                            className: 'tb-chip-panel__head',
                                            children: style
                                        }),
                                        ...INTENTS.map(intent =>
                                            chip({
                                                key: `${style}-${intent}`,
                                                intent,
                                                ...styleProps(style),
                                                children: intent ?? 'Draft'
                                            })
                                        ),
                                        chip({
                                            key: `${style}-color`,
                                            color: COLORS.purple,
                                            ...styleProps(style),
                                            children: 'Preset'
                                        })
                                    ])
                                ]
                            })
                        })
                    }),
                    demoSection({
                        title: 'Variants',
                        children: demoGrid({
                            columns: 2,
                            children: [
                                demoFrame({
                                    label: 'Sizes',
                                    info: "size: 'compact' | 'standard' | 'large', and round",
                                    children: hbox({
                                        className: 'tb-chip-panel__row',
                                        children: [
                                            ...(['compact', 'standard', 'large'] as const).map(
                                                size =>
                                                    chip({
                                                        key: size,
                                                        size,
                                                        intent: 'primary',
                                                        minimal: true,
                                                        icon: Icon.circle({prefix: 'fas'}),
                                                        children: size
                                                    })
                                            ),
                                            ...(['compact', 'standard', 'large'] as const).map(
                                                size =>
                                                    chip({
                                                        key: `${size}-round`,
                                                        size,
                                                        round: true,
                                                        outlined: true,
                                                        intent: 'success',
                                                        children: size
                                                    })
                                            )
                                        ]
                                    })
                                }),
                                demoFrame({
                                    label: 'Toggle',
                                    info: 'active + onClick - a row of filter chips',
                                    children: hbox({
                                        className: 'tb-chip-panel__row',
                                        children: FILTERS.map(f => {
                                            const active = model.activeFilters.includes(f);
                                            return chip({
                                                key: f,
                                                outlined: true,
                                                round: true,
                                                intent: 'primary',
                                                active,
                                                icon: active ? Icon.check() : null,
                                                onClick: () => model.toggleFilter(f),
                                                children: f
                                            });
                                        })
                                    })
                                }),
                                demoFrame({
                                    label: 'Removable',
                                    info: 'onRemove - click x, or focus and press Backspace',
                                    chip: span({
                                        className: 'tb-chip-panel__reset',
                                        onClick: () => model.resetFiles(),
                                        children: 'Reset'
                                    }),
                                    children: hbox({
                                        className: 'tb-chip-panel__row',
                                        children: model.files.length
                                            ? model.files.map(f =>
                                                  chip({
                                                      key: f,
                                                      outlined: true,
                                                      icon: Icon.file(),
                                                      maxWidth: 180,
                                                      title: f,
                                                      onRemove: () => model.removeFile(f),
                                                      children: f
                                                  })
                                              )
                                            : span('All removed.')
                                    })
                                }),
                                demoFrame({
                                    label: 'States',
                                    info: 'disabled, truncated at maxWidth: 140, rightIcon, a badge',
                                    children: hbox({
                                        className: 'tb-chip-panel__row',
                                        children: [
                                            chip({
                                                intent: 'primary',
                                                disabled: true,
                                                children: 'Disabled'
                                            }),
                                            chip({
                                                minimal: true,
                                                disabled: true,
                                                onRemove: () => {},
                                                children: 'Disabled'
                                            }),
                                            chip({
                                                minimal: true,
                                                intent: 'primary',
                                                maxWidth: 140,
                                                title: 'Global Macro - Rates Relative Value (EMEA)',
                                                children:
                                                    'Global Macro - Rates Relative Value (EMEA)'
                                            }),
                                            chip({
                                                outlined: true,
                                                rightIcon: Icon.database(),
                                                children: 'Sources'
                                            }),
                                            chip({
                                                minimal: true,
                                                intent: 'danger',
                                                icon: Icon.warning(),
                                                children: [
                                                    'Errors ',
                                                    badge({intent: 'danger', children: 3})
                                                ]
                                            })
                                        ]
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'In Context',
                        note: 'An inspector, a toolbar filter, and a status column in a grid.',
                        children: demoGrid({
                            columns: 2,
                            children: [inspector(), statusGrid()]
                        })
                    })
                ]
            })
        });
    }
});

const inspector = hoistCmp.factory<ChipPanelModel>({
    displayName: 'ChipInspector',
    render({model}) {
        const rows: [string, [string, Partial<ChipProps>][]][] = [
            [
                'Reads',
                [
                    ['positions', {intent: 'primary'}],
                    ['asOfDate', {intent: 'primary'}],
                    ['fundStore', {intent: 'success'}]
                ]
            ],
            [
                'Read by',
                [
                    ['pnlChart', {intent: 'warning'}],
                    ['summaryCard', {intent: 'warning'}]
                ]
            ],
            ['Preset', [['compactDense', {color: COLORS.purple}]]],
            ['Element', [['grid', {}]]]
        ];
        return demoFrame({
            label: 'Inspector',
            info: 'compact, minimal, mono, clickable',
            children: div({
                className: 'tb-chip-panel__kv',
                children: rows.flatMap(([label, chips]) => [
                    span({key: label, className: 'tb-chip-panel__kv-label', children: label}),
                    hbox({
                        key: `${label}-chips`,
                        className: 'tb-chip-panel__row tb-chip-panel__row--tight',
                        children: chips.map(([name, props]) =>
                            chip({
                                key: name,
                                className: 'xh-font-family-mono',
                                size: 'compact',
                                minimal: true,
                                onClick: () => (model.lastEvent = `Selected ${name}`),
                                ...props,
                                children: name
                            })
                        )
                    })
                ])
            })
        });
    }
});

const statusGrid = hoistCmp.factory<ChipPanelModel>({
    displayName: 'ChipStatusGrid',
    render({model}) {
        return demoFrame({
            label: 'Trades',
            info: 'chip in a renderer; toggle chips in a toolbar',
            children: div({
                className: 'tb-chip-panel__grid',
                children: [
                    toolbar({
                        compact: true,
                        children: [
                            span({className: 'tb-chip-panel__kv-label', children: 'Show'}),
                            ...['Equities', 'Rates', 'FX', 'Credit'].map(desk =>
                                chip({
                                    key: desk,
                                    size: 'compact',
                                    round: true,
                                    minimal: true,
                                    active: model.activeFilters.includes(desk),
                                    onClick: () => model.toggleFilter(desk),
                                    children: desk
                                })
                            )
                        ]
                    }),
                    grid({model: model.gridModel})
                ]
            })
        });
    }
});

function styleProps(style: ChipStyle): Partial<ChipProps> {
    return {minimal: style === 'minimal', outlined: style === 'outlined'};
}

class ChipPanelModel extends HoistModel {
    @bindable accessor intent: Intent = 'primary';
    @bindable accessor colorName: keyof typeof COLORS = null;
    @bindable accessor chipStyle: ChipStyle = 'minimal';
    @bindable accessor size: ChipProps['size'] = 'standard';
    @bindable accessor iconName: string = 'tag';
    @bindable accessor text = 'Rates desk';
    @bindable accessor round = false;
    @bindable accessor clickable = true;
    @bindable accessor active = false;
    @bindable accessor removable = false;
    @bindable accessor disabled = false;
    @bindable accessor lastEvent: string = null;

    @observableRef accessor activeFilters: string[] = ['Open', 'Mine', 'Equities', 'FX'];
    @observableRef accessor files: string[] = [...FILES];

    @managed gridModel = new GridModel({
        store: {idSpec: 'trade'},
        columns: [
            {field: 'trade', width: 90},
            {
                field: 'status',
                width: 100,
                renderer: v =>
                    chip({intent: STATUS_INTENTS[v], minimal: true, size: 'compact', children: v})
            },
            {field: {name: 'qty', type: 'number'}, headerName: 'Qty', flex: 1, align: 'right'}
        ]
    });

    constructor() {
        super();
        this.gridModel.loadData([
            {trade: 'T-40213', status: 'Settled', qty: 25000},
            {trade: 'T-40214', status: 'Pending', qty: -3195},
            {trade: 'T-40217', status: 'Failed', qty: 12500},
            {trade: 'T-40218', status: 'Booked', qty: 880},
            {trade: 'T-40220', status: 'Draft', qty: 1200}
        ]);
    }

    @action
    toggleFilter(f: string) {
        const {activeFilters} = this;
        this.activeFilters = activeFilters.includes(f)
            ? activeFilters.filter(it => it !== f)
            : [...activeFilters, f];
    }

    @action
    removeFile(f: string) {
        this.files = this.files.filter(it => it !== f);
    }

    @action
    resetFiles() {
        this.files = [...FILES];
    }

    /** Props for the Playground snippet. Options at their default resolve to undefined. */
    get chipConfig() {
        const {intent, colorName, chipStyle, size, iconName, text, round} = this,
            {clickable, active, removable, disabled} = this;
        return {
            intent: !colorName && intent ? intent : undefined,
            color: colorName ? COLORS[colorName] : undefined,
            minimal: chipStyle === 'minimal' || undefined,
            outlined: chipStyle === 'outlined' || undefined,
            size: size !== 'standard' ? size : undefined,
            round: round || undefined,
            icon: iconName ? raw(`Icon.${iconName}()`) : undefined,
            onClick: clickable ? raw('() => model.toggle()') : undefined,
            active: clickable ? active : undefined,
            onRemove: removable ? raw('() => model.remove()') : undefined,
            disabled: disabled || undefined,
            children: text
        };
    }

    /** Props for the Playground chip. */
    get chipProps(): ChipProps {
        const {intent, colorName, chipStyle, size, iconName, text, round} = this,
            {clickable, active, removable, disabled} = this;
        return {
            intent,
            color: colorName ? COLORS[colorName] : null,
            ...styleProps(chipStyle),
            size,
            round,
            icon: iconName ? Icon.get(iconName) : null,
            active: clickable ? active : null,
            onClick: clickable
                ? () => {
                      this.active = !active;
                      this.lastEvent = `onClick - active: ${!active}`;
                  }
                : null,
            onRemove: removable ? e => (this.lastEvent = `onRemove (${e.type})`) : null,
            disabled,
            children: text
        };
    }
}
