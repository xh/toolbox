import {isUndefined} from 'lodash';

import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {restaurants} from '../../../core/data';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {numberInput, select} from '@xh/hoist/desktop/cmp/input';
import {box, div, fragment, hbox, label, p} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon/Icon';

import {usStates} from '../../../core/data';
import {SelectTestModel} from './SelectTestModel';
import './SelectTestPanel.scss';

export const SelectTestPanel = hoistCmp({
    model: creates(SelectTestModel),

    render({model}) {
        return panel({
            title: 'Select tests',
            className: 'tb-select-test-panel xh-tiled-bg',
            item: hbox(
                div({
                    className: 'tb-select-test-panel__column',
                    items: [
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
                            name: 'Select queryFn & optionRenderer',
                            bind: 'asyncValue',
                            selectProps: customerProps
                        }),
                        example({
                            name: 'Select queryFn & enableCreate & optionRenderer & enableTooltips',
                            bind: 'asyncCreatableValue',
                            selectProps: {
                                ...customerProps,
                                enableCreate: true,
                                enableTooltips: true
                            }
                        }),
                        example({
                            name: 'Select (with grouped options)',
                            bind: 'groupedValue',
                            selectProps: {
                                options: desserts
                            }
                        }),
                        example({
                            name: 'Select (with Object options)',
                            bind: 'objectValue',
                            selectProps: {
                                options: recipes
                            }
                        })
                    ]
                }),
                div({
                    className: 'tb-select-test-panel__column',
                    items: [
                        example({
                            name: 'Select (with many options) enableWindowed & leftIcon',
                            bind: 'bigValue',
                            selectProps: {
                                leftIcon: Icon.search(),
                                options: model.bigOptions,
                                enableWindowed: true,
                                placeholder: 'Select a number...'
                            }
                        }),
                        hbox(label('number of options: '), numberInput({bind: 'numOptions'})),
                        example({
                            name: 'Select with leftIcon & object options & hideDropdownIndicator:true',
                            bind: 'objectValue2',
                            selectProps: {
                                leftIcon: Icon.search(),
                                hideDropdownIndicator: true,
                                options: recipes
                            }
                        }),
                        example({
                            name: 'Select with leftIcon & queryFn & enableCreate & optionRenderer',
                            bind: 'asyncCreatableValue2',
                            selectProps: {
                                ...customerProps,
                                leftIcon: Icon.office(),
                                enableCreate: true
                            }
                        }),
                        example({
                            name: 'Select with leftIcon & enableMulti',
                            bind: 'enableMultiLeftIcon',
                            selectProps: {
                                width: 350,
                                options: usStates,
                                leftIcon: Icon.globe(),
                                enableMulti: true,
                                placeholder: 'Select state(s)...'
                            }
                        }),
                        example({
                            name: 'Select with leftIcon & enableMulti & enableTooltips & enableClear & rsOptions: {hideSelectedOptions: false, closeMenuOnSelect: false}',
                            bind: 'enableMultiMenuOpen',
                            selectProps: {
                                width: 200,
                                options: usStates,
                                leftIcon: Icon.globe(),
                                enableMulti: true,
                                enableTooltips: true,
                                placeholder: 'Select state(s)...',
                                enableClear: true,
                                hideSelectedOptions: false,
                                closeMenuOnSelect: false
                            }
                        })
                    ]
                })
            )
        });
    }
});

const example = hoistCmp.factory<SelectTestModel>(({name, bind, selectProps, model}) =>
    fragment(
        p(name),
        label('value: ' + JSON.stringify(model[bind])),
        select({...selectProps, bind})
    )
);

// In addition to styling a customer option, this has some logic to handle a newly created option
// and the "Create XYZ" option that is offered when enableCreate:true
const customerOption = hoistCmp.factory(({opt}) =>
    hbox({
        className: 'xh-pad-half xh-border-bottom',
        items: [
            box({
                item: isUndefined(opt.isActive)
                    ? Icon.magic({className: 'xh-grey'})
                    : opt.isActive
                      ? Icon.checkCircle({className: 'xh-green'})
                      : Icon.x({className: 'xh-red'}),
                width: 32,
                justifyContent: 'center'
            }),
            div(
                opt.company || opt.label,
                div({
                    omit: !opt.city || !opt.id,
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
    queryFn: queryCustomersAsync,
    optionRenderer: opt => customerOption({opt}),
    placeholder: 'Search customers...'
};

async function queryCustomersAsync(query) {
    return XH.fetchJson({
        url: 'customer',
        params: {query}
    });
}

const recipes = [
    {
        label: 'Hot Tea',
        value: {ingredients: ['water', 'tea leaves'], warnings: ['hot'], price: 1.75}
    },
    {label: 'Iced Tea', value: {ingredients: ['water', 'tea leaves', 'ice', 'lemon'], price: 2.5}},
    {
        label: 'Coffee',
        value: {ingredients: ['coffee beans', 'water'], warnings: ['addictive', 'hot'], price: 3.25}
    },
    {label: 'Soda', value: {ingredients: 'unknown', warnings: ['sweet', 'acidic'], price: 1.5}},
    {
        label: 'Red Wine',
        value: {
            ingredients: ['grapes', 'water', 'yeast', 'time'],
            warnings: ['alcoholic', 'staining'],
            needId: true,
            price: 6.75
        }
    }
];

const desserts = [
    {label: 'cookies', options: ['oatmeal', 'chocolate chip', 'peanut butter']},
    {label: 'cakes', options: ['red velvet', 'tres leches', "German's chocolate", 'cheesecake']},
    {label: 'ice cream', options: ['vanilla', 'chocolate', 'strawberry']}
];
