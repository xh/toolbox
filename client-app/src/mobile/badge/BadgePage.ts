import {badge} from '@xh/hoist/cmp/badge';
import {div, hbox, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {switchInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';
import './BadgePage.scss';

export const badgePage = hoistCmp.factory({
    model: creates(() => BadgePageModel),

    render() {
        return exampleScreen({
            title: 'Badges',
            icon: Icon.tag(),
            description: [
                '`Badge` renders a small, rounded count or status label - typically inline beside text',
                'or an icon to call out a quantity or state. It supports the standard Hoist `intent`',
                'colors and a `compact` variant for tighter contexts.'
            ],
            options: [
                exampleOption({
                    label: 'Compact',
                    control: switchInput({bind: 'compact'}),
                    info: 'Render the tighter, smaller variant.'
                })
            ],
            links: [
                {url: '$TB/client-app/src/mobile/badge/BadgePage.ts', notes: 'This example.'},
                {url: '$HR/cmp/badge/Badge.ts', text: 'Badge source'}
            ],
            item: panel({
                scrollable: true,
                className: 'tb-page tb-badge-page',
                items: [intentsCard(), contextCard()]
            })
        });
    }
});

const intentsCard = hoistCmp.factory<BadgePageModel>(({model}) => {
    const {compact} = model;
    return div({
        className: 'tb-card',
        items: [
            div({className: 'tb-card__title', item: 'Intents'}),
            hbox({
                className: 'tb-badge-page__row',
                items: [
                    badge({compact, item: 'Default'}),
                    badge({compact, intent: 'primary', item: 'Primary'}),
                    badge({compact, intent: 'success', item: 'Success'}),
                    badge({compact, intent: 'warning', item: 'Warning'}),
                    badge({compact, intent: 'danger', item: 'Danger'})
                ]
            })
        ]
    });
});

const contextCard = hoistCmp.factory<BadgePageModel>(({model}) => {
    const {compact} = model;
    return div({
        className: 'tb-card',
        items: [
            div({className: 'tb-card__title', item: 'In context'}),
            hbox({
                className: 'tb-badge-page__context',
                items: [
                    Icon.comment(),
                    span('Messages'),
                    badge({compact, intent: 'primary', item: '12'})
                ]
            }),
            hbox({
                className: 'tb-badge-page__context',
                items: [Icon.skull(), span('Errors'), badge({compact, intent: 'danger', item: '3'})]
            })
        ]
    });
});

class BadgePageModel extends HoistModel {
    @bindable compact: boolean = false;

    constructor() {
        super();
        makeObservable(this);
    }
}
