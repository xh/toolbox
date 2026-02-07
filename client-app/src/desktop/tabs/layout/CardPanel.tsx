import {card} from '@xh/hoist/cmp/card';
import React from 'react';
import {hoistCmp} from '@xh/hoist/core';
import {code, hbox, p, placeholder, vbox} from '@xh/hoist/cmp/layout';
import {Icon, xhLogo} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common';

export const cardPanel = hoistCmp.factory(() =>
    wrapper({
        description: [
            <p>A Card is a bordered container for grouping related content.</p>,
            <p>
                Cards support titles, icons, intent-based styling, and collapsibility via{' '}
                <code>modelConfig</code>.
            </p>,
            <p>
                Children are arranged vertically by default, but this and other aspects of its inner
                layout can be customized via <code>contentBoxProps</code>.
            </p>
        ],
        links: [
            {
                url: '$TB/client-app/src/desktop/tabs/layout/CardPanel.tsx',
                notes: 'This example.'
            },
            {
                url: '$HR/cmp/card/Card.ts',
                notes: 'Hoist Card component.'
            },
            {
                url: '$HR/cmp/card/CardModel.ts',
                notes: 'Hoist CardModel.'
            }
        ],
        item: panel({
            title: 'Layout › Card',
            icon: Icon.addressCard(),
            height: 600,
            width: 800,
            item: vbox({
                flex: 1,
                overflow: 'auto',
                padding: 10,
                gap: 10,
                items: [
                    // Basic cards
                    card({
                        title: 'Basic Card',
                        icon: Icon.bookmark(),
                        items: [
                            p('This is a basic card with a title and icon.'),
                            p(
                                'Cards render as a fieldset with a legend header and arrange their children vertically by default.'
                            )
                        ]
                    }),
                    card({
                        contentBoxProps: {
                            padding: 10,
                            gap: 20,
                            flexDirection: 'row'
                        },
                        items: [
                            xhLogo({width: 150}),
                            p(
                                'This is an even more basic card, but we can use',
                                code('contentBoxProps'),
                                ' to customize its padding and internal layout.'
                            )
                        ]
                    }),

                    // Intent variants
                    hbox({
                        gap: 10,
                        items: [
                            card({
                                flex: 1,
                                title: 'Primary',
                                icon: Icon.infoCircle(),
                                intent: 'primary',
                                item: p('Primary intent.')
                            }),
                            card({
                                flex: 1,
                                title: 'Success',
                                icon: Icon.checkCircle(),
                                intent: 'success',
                                item: p('Success intent.')
                            }),
                            card({
                                flex: 1,
                                title: 'Warning',
                                icon: Icon.warning(),
                                intent: 'warning',
                                item: p('Warning intent.')
                            }),
                            card({
                                flex: 1,
                                title: 'Danger',
                                icon: Icon.skull(),
                                intent: 'danger',
                                item: p('Danger intent.')
                            })
                        ]
                    }),

                    // Collapsible card
                    card({
                        title: 'Collapsible Card',
                        modelConfig: {collapsible: true},
                        // contentBoxProps: {padding: 20},
                        items: [
                            p(
                                'This card is collapsible. Click the header to toggle its collapsed state.'
                            )
                        ]
                    }),

                    // Default collapsed card
                    card({
                        title: 'Default Collapsed',
                        modelConfig: {collapsible: true, defaultCollapsed: true},
                        item: placeholder({
                            minHeight: 100,
                            items: [Icon.thumbsUp(), 'You expanded the card!']
                        })
                    })
                ]
            })
        })
    })
);
