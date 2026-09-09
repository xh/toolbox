import {card, CardProps} from '@xh/hoist/cmp/card';
import {p, placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, Intent} from '@xh/hoist/core';
import {intentInput, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon, xhLogo} from '@xh/hoist/icon';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {
    demoGrid,
    demoPanel,
    demoPlayground,
    demoRow,
    demoSection,
    fmtDemoConfig,
    raw,
    wrapper,
    wrapperOption,
    wrapperOptionGroup
} from '../../common';

/** The four Hoist intents, in their conventional order. */
const INTENTS: Intent[] = ['primary', 'success', 'warning', 'danger'];

/** Icon paired with each intent in the Intents variant row. */
const INTENT_ICONS: Record<Intent, () => ReturnType<typeof Icon.infoCircle>> = {
    primary: Icon.infoCircle,
    success: Icon.checkCircle,
    warning: Icon.warning,
    danger: Icon.skull
};

export const cardPanel = hoistCmp.factory({
    displayName: 'CardPanel',
    model: creates(() => CardPanelModel),

    render({model}) {
        const {pgTitle, pgIcon, pgIntent, pgCollapsible, pgDefaultCollapsed} = model;
        return wrapper({
            title: 'Card',
            icon: Icon.addressCard(),
            description: [
                'A `Card` is a bordered container for grouping related content. It renders as a',
                'fieldset with a legend header, and arranges its children vertically by default.',
                '',
                'Cards support titles, icons, intent-based styling and collapsibility. Inner layout',
                'is customized through `contentBoxProps`, and collapse behavior through',
                '`modelConfig`.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/layout/CardPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/card/Card.ts', notes: 'Hoist Card component.'},
                {
                    url: '$HR/cmp/card/CardModel.ts',
                    notes: 'Holds collapse state and render mode.'
                }
            ],
            options: wrapperOptionGroup({
                label: 'Playground only',
                icon: Icon.experiment(),
                intent: 'primary',
                info: 'Drives the Playground instance.',
                items: [
                    wrapperOption({
                        label: 'Title',
                        propName: 'CardProps.title',
                        control: textInput({bind: 'pgTitle', width: 130, commitOnChange: true})
                    }),
                    wrapperOption({
                        label: 'Icon',
                        propName: 'CardProps.icon',
                        control: switchInput({bind: 'pgIcon'})
                    }),
                    wrapperOption({
                        label: 'Intent',
                        propName: 'CardProps.intent',
                        control: intentInput({bind: 'pgIntent', enableClear: true})
                    }),
                    wrapperOption({
                        label: 'Collapsible',
                        propName: 'CardConfig.collapsible',
                        info: 'Click the header to toggle.',
                        control: switchInput({bind: 'pgCollapsible'})
                    }),
                    wrapperOption({
                        label: 'Start collapsed',
                        propName: 'CardConfig.defaultCollapsed',
                        control: switchInput({
                            bind: 'pgDefaultCollapsed',
                            disabled: !pgCollapsible
                        })
                    })
                ]
            }),
            item: demoPanel({
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 360,
                            showValue: false,
                            caption: 'Toggling Collapsible re-creates the card.',
                            config: fmtDemoConfig<CardProps>('card', {
                                title: pgTitle || undefined,
                                icon: pgIcon ? raw('Icon.bookmark()') : undefined,
                                intent: pgIntent || undefined,
                                modelConfig: pgCollapsible
                                    ? raw(
                                          `{collapsible: true${pgDefaultCollapsed ? ', defaultCollapsed: true' : ''}}`
                                      )
                                    : undefined,
                                item: raw("p('...')")
                            }),
                            // Keyed on the collapse config, which CardModel reads once on
                            // construction - without this the card keeps its first setting.
                            item: card({
                                key: `${pgCollapsible}-${pgDefaultCollapsed}`,
                                title: pgTitle,
                                icon: pgIcon ? Icon.bookmark() : undefined,
                                intent: pgIntent,
                                modelConfig: {
                                    collapsible: pgCollapsible,
                                    defaultCollapsed: pgDefaultCollapsed
                                },
                                item: p('Grouped content sits inside the card body.')
                            })
                        })
                    }),
                    demoSection({
                        title: 'Variants',
                        note: 'Each sets its own props.',
                        items: [
                            demoGrid({
                                columns: 2,
                                items: [
                                    demoRow({
                                        label: 'Title and icon',
                                        info: 'The common case',
                                        item: card({
                                            title: 'Basic Card',
                                            icon: Icon.bookmark(),
                                            width: '100%',
                                            items: [
                                                p('A basic card with a title and icon.'),
                                                p('Children are arranged vertically by default.')
                                            ]
                                        })
                                    }),
                                    demoRow({
                                        label: 'Untitled, custom inner layout',
                                        info: 'No title; contentBoxProps sets a row layout and padding',
                                        item: card({
                                            width: '100%',
                                            contentBoxProps: {
                                                padding: 10,
                                                gap: 20,
                                                flexDirection: 'row',
                                                alignItems: 'center'
                                            },
                                            items: [
                                                xhLogo({width: 120}),
                                                p('Without a title the legend header is omitted.')
                                            ]
                                        })
                                    })
                                ]
                            }),
                            demoRow({
                                label: 'Intents',
                                info: 'intent colors the inline header and border',
                                item: demoGrid({
                                    columns: 4,
                                    items: INTENTS.map(intent =>
                                        card({
                                            key: intent,
                                            title: capitalize(intent),
                                            icon: INTENT_ICONS[intent](),
                                            intent,
                                            item: p(`${capitalize(intent)} intent.`)
                                        })
                                    )
                                })
                            }),
                            demoGrid({
                                columns: 2,
                                items: [
                                    demoRow({
                                        label: 'Collapsible',
                                        info: 'modelConfig: {collapsible: true}',
                                        item: card({
                                            title: 'Collapsible Card',
                                            width: '100%',
                                            modelConfig: {collapsible: true},
                                            item: p('Click the header to toggle this card.')
                                        })
                                    }),
                                    demoRow({
                                        label: 'Starts collapsed',
                                        info: 'modelConfig adds defaultCollapsed: true',
                                        item: card({
                                            title: 'Default Collapsed',
                                            width: '100%',
                                            modelConfig: {
                                                collapsible: true,
                                                defaultCollapsed: true
                                            },
                                            item: placeholder({
                                                minHeight: 80,
                                                items: [Icon.thumbsUp(), 'You expanded the card!']
                                            })
                                        })
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        });
    }
});

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

class CardPanelModel extends HoistModel {
    // Playground props
    @bindable pgTitle = 'Playground Card';
    @bindable pgIcon = true;
    @bindable pgIntent: Intent = null;
    @bindable pgCollapsible = false;
    @bindable pgDefaultCollapsed = false;

    constructor() {
        super();
        makeObservable(this);
    }
}
