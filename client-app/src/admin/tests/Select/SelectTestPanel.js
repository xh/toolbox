import {hoistCmp, XH} from '@xh/hoist/core';
import {restaurants} from '../../../core/data';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {numberInput, select} from '@xh/hoist/desktop/cmp/input';
import {box, div, fragment, hbox, label, p, vbox} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon/Icon';
import {SelectTestModel} from './SelectTestModel.js';
import './SelectTestPanel.scss';
import {creates} from '@xh/hoist/core/modelspec';

export const SelectTestPanel = hoistCmp({

    model: creates(SelectTestModel),

    render({model}) {

        return panel({
            title: 'Select tests',
            className: 'select-test-panel xh-tiled-bg',
            item: hbox(
                vbox(
                    example({
                        name: 'Select',
                        bind: 'selectValue',
                        selectProps: restaurantProps
                    }),
                    example({
                        name: 'Select enableCreate',
                        bind: 'creatableValue',
                        selectProps: {...restaurantProps, enableCreate: true}
                    }),
                    example({
                        name: 'Select queryFn',
                        bind: 'asyncValue',
                        selectProps: customerProps
                    }),
                    example({
                        name: 'Select queryFn enableCreate',
                        bind: 'asyncCreatableValue',
                        selectProps: {...customerProps, enableCreate: true}
                    })
                ),
                vbox(
                    example({
                        name: 'Select (with grouped options)',
                        bind: 'groupedValue',
                        selectProps: {
                            options: [
                                {label: 'cookies', options: [
                                    'oatmeal',
                                    'chocolate chip',
                                    'peanut butter'
                                ]},
                                {label: 'cakes', options: [
                                    'red velvet', 'tres leches', 'German\'s chocolate', 'cheesecake'
                                ]},
                                {label: 'ice cream', options: [
                                    'vanilla', 'chocolate', 'strawberry'
                                ]}
                            ]
                        }
                    }),
                    example({
                        name: 'Select (with Object options)',
                        bind: 'objectValue',
                        selectProps: {
                            options: [
                                {label: 'Hot Tea', value: {ingredients: ['water', 'tea leaves'], warnings: ['hot'], price: 1.75}},
                                {label: 'Iced Tea', value: {ingredients: ['water', 'tea leaves', 'ice', 'lemon'], price: 2.50}},
                                {label: 'Coffee', value: {ingredients: ['coffee beans', 'water'], warnings: ['addictive', 'hot'], price: 3.25}},
                                {label: 'Soda', value: {ingredients: 'unknown', warnings: ['sweet', 'acidic'], price: 1.50}},
                                {label: 'Red Wine', value: {ingredients: ['grapes', 'water', 'yeast', 'time'], warnings: ['alcoholic', 'staining'], needId: true, price: 6.75}}
                            ]
                        }
                    }),
                    example({
                        name: 'Select (with many options) enableWindowed',
                        bind: 'bigValue',
                        selectProps: {
                            options: model.bigOptions,
                            enableWindowed: true,
                            placeholder: 'Select a number...'
                        }
                    }),
                    hbox(
                        label('number of options: '),
                        numberInput({bind: 'numOptions'})
                    )
                )
            )
        });
    }
});

const example = hoistCmp.factory(
    ({name, bind, selectProps, model}) => fragment(
        p(name),
        label('value: ' + JSON.stringify(model[bind])),
        select({...selectProps, bind})
    )
);

const customerOption = hoistCmp.factory(
    ({opt}) => hbox({
        className: 'xh-pad-half xh-border-bottom',
        items: [
            box({
                item: opt.isActive ?
                    Icon.checkCircle({className: 'xh-green'}) :
                    Icon.x({className: 'xh-red'}),
                width: 32,
                justifyContent: 'center'
            }),
            div(
                opt.company,
                div({
                    className: 'xh-text-color-muted xh-font-size-small',
                    item: `${opt.city} · ID: ${opt.id}`
                })
            )
        ],
        alignItems: 'center',
        paddingLeft: 0
    })
);

const restaurantProps = {
    options: restaurants,
    enableClear: true,
    placeholder: 'Search restaurants...'
};

const customerProps = {
    valueField: 'id',
    labelField: 'company',
    enableClear: true,
    selectOnFocus: true,
    queryFn: (q) => queryCustomersAsync(q),
    optionRenderer: (opt) => customerOption({opt}),
    placeholder: 'Search customers...'
};

function queryCustomersAsync(query) {
    return XH.fetchJson({
        url: 'customer',
        params: {query}
    });
}
