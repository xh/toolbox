import {hoistCmp} from '@xh/hoist/core';
import {restaurants} from '../../../core/data';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {numberInput, select} from '@xh/hoist/desktop/cmp/input';
import {box, div, fragment, hbox, label, p, vbox} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon/Icon';
import {SelectTestModel} from './SelectTestModel.js';
import './SelectTestPanel.scss';
import {creates, uses} from '@xh/hoist/core/modelspec';

export const SelectTestPanel = hoistCmp({

    model: creates(SelectTestModel),

    render({model}) {

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
            queryFn: (q) => model.queryCustomersAsync(q),
            optionRenderer: (opt) => customerOption({opt}),
            placeholder: 'Search customers...'
        };

        return panel({
            title: 'Select tests',
            className: 'select-test-panel xh-tiled-bg',
            item: hbox(
                vbox(
                    example({
                        name: 'Select',
                        bind: 'selectValue',
                        select: select({...restaurantProps, bind: 'selectValue'})
                    }),
                    example({
                        name: 'Select enableCreate',
                        bind: 'creatableValue',
                        select: select({...restaurantProps, bind: 'creatableValue', creatable: true})
                    }),
                    example({
                        name: 'Select queryFn',
                        bind: 'asyncValue',
                        select: select({...customerProps, bind: 'asyncValue'})
                    }),
                    example({
                        name: 'Select queryFn enableCreate',
                        bind: 'asyncCreatableValue',
                        select: select({...customerProps, bind: 'asyncCreatableValue'})
                    }),
                    example({
                        name: 'Select (with grouped options)',
                        bind: 'groupedValue',
                        select: select({
                            bind: 'groupedValue',
                            options: [
                                {label: 'shapes', options: ['square', 'circle', 'triangle', 'rectangle', 'line', 'decagon']},
                                {label: 'colors', options: ['red', 'orange', 'yellow', 'green', 'blue', 'purple']},
                                {label: 'flavors', options: ['vanilla', 'chocolate', 'strawberry']}
                            ]
                        })
                    }),
                    example({
                        name: 'Select (with many options) enableWindowed',
                        bind: 'bigValue',
                        select: select({
                            bind: 'bigValue',
                            options: model.bigOptions,
                            enableWindowed: true,
                            placeholder: 'Select a number...'
                        })
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

const example = hoistCmp.factory({

    model: uses(SelectTestModel),

    render({name, bind, select, model}) {
        return fragment(
            p(name),
            label('value: ' + model[bind]),
            select
        );
    }
});

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
