import {div, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {select, switchInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {ReactElement, ReactNode} from 'react';
import {exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';
import './SelectPage.scss';
import {SelectPageModel} from './SelectPageModel';

export const selectPage = hoistCmp.factory({
    model: creates(SelectPageModel),

    render() {
        return exampleScreen({
            title: 'Select',
            icon: Icon.chevronDown(),
            description: [
                '`Select` is a flexible dropdown for choosing from a set of options. On mobile it can',
                'open as a full-screen picker, filter as you type, query options asynchronously from the',
                'server, and create ad-hoc values.',
                '',
                'Each card below shows a different mode; the Disabled option applies to all of them.'
            ],
            options: [
                exampleOption({
                    label: 'Disabled',
                    control: switchInput({bind: 'disabled'}),
                    info: 'Disable every select on the page.'
                })
            ],
            links: [
                {url: '$TB/client-app/src/mobile/select/SelectPage.ts', notes: 'This example.'},
                {
                    url: '$HR/mobile/cmp/input/Select.ts',
                    text: 'Select source',
                    notes: 'Mobile Select component and its props.'
                }
            ],
            item: panel({
                scrollable: true,
                className: 'tb-page tb-select-page',
                items: [basicCard(), filterCard(), asyncCard(), creatableCard()]
            })
        });
    }
});

const basicCard = hoistCmp.factory<SelectPageModel>(({model}) =>
    card('Basic', [
        demoRow({
            label: 'A simple list of options',
            control: select({
                model,
                bind: 'region',
                disabled: model.disabled,
                options: model.regionOptions
            })
        })
    ])
);

const filterCard = hoistCmp.factory<SelectPageModel>(({model}) =>
    card('Filtering', [
        demoRow({
            label: 'enableFilter',
            info: 'Type to narrow a long list (US states)',
            control: select({
                model,
                bind: 'state',
                disabled: model.disabled,
                enableFilter: true,
                placeholder: 'Select a state...',
                options: model.stateOptions
            })
        })
    ])
);

const asyncCard = hoistCmp.factory<SelectPageModel>(({model}) =>
    card('Async query', [
        demoRow({
            label: 'queryFn, enableFullscreen',
            info: 'Search customers on the server in a full-screen picker',
            control: select({
                model,
                bind: 'customer',
                disabled: model.disabled,
                enableFilter: true,
                enableFullscreen: true,
                placeholder: 'Search customers...',
                queryFn: q => model.queryCustomersAsync(q)
            })
        })
    ])
);

const creatableCard = hoistCmp.factory<SelectPageModel>(({model}) =>
    card('Creatable', [
        demoRow({
            label: 'enableCreate',
            info: 'Type a new value and add it on the fly',
            control: select({
                model,
                bind: 'tag',
                disabled: model.disabled,
                enableFilter: true,
                enableCreate: true,
                placeholder: 'Pick or create a tag...',
                options: model.tagOptions
            })
        })
    ])
);

//------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------
function card(title: ReactNode, items: ReactNode[]): ReactElement {
    return div({
        className: 'tb-card',
        items: [div({className: 'tb-card__title', item: title}), ...items]
    });
}

interface DemoRowSpec {
    label: ReactNode;
    info?: ReactNode;
    control: ReactElement;
}

function demoRow({label, info, control}: DemoRowSpec): ReactElement {
    return vbox({
        className: 'tb-select-page__row',
        items: [
            span({className: 'tb-select-page__label', item: label}),
            info ? span({className: 'tb-select-page__info', item: info}) : null,
            div({className: 'tb-select-page__control', item: control})
        ]
    });
}
