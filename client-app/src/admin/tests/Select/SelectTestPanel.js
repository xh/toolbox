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
                    }),
                    example({
                        name: 'Select (with grouped options and object options)',
                        bind: 'groupedValue',
                        selectProps: {
                            options: [
                                {label: 'cookies', options: [
                                    {label: 'HTTP', value: {id: 'a3fWa', expires: 'Wed, 21 Oct 2015 07:28:00 GMT', secure: true}},
                                    'oatmeal',
                                    'chocolate chip',
                                    'peanut butter'
                                ]},
                                {label: 'cakes', options: [
                                    'red velvet', 'tres leches', 'German\'s chocolate', 'cheesecake',
                                    {label: 'yellowcake', value: {ingredients: 'uranium', edible: false}}
                                ]},
                                {label: 'ice cream', options: [
                                    'vanilla', 'chocolate', 'strawberry',
                                    {label: 'sundae', value: {flavor: 'coffee', syrup: 'chocolate', toppings: ['sprinkles', 'whipped cream']}}
                                ]}
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
        items: [
            box({
                item: opt.isActive ?
                    Icon.checkCircle({className: 'xh-green'}) :
                    Icon.x({className: 'xh-red'}),
                width: 32,
                paddingLeft: 8
            }),
            div(
                opt.company,
                div({
                    className: 'xh-text-color-muted xh-font-size-small',
                    item: `${opt.city} · ID: ${opt.id}`
                })
            )
        ],
        alignItems: 'center'
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