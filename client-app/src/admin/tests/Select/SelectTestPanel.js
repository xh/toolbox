import {XH, hoistCmp, HoistModel} from '@xh/hoist/core';
import {restaurants} from '../../../core/data';
import {useLocalModel} from '@xh/hoist/core/hooks';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {numberInput, select} from '@xh/hoist/desktop/cmp/input';
import {box, div, fragment, hbox, label, p, vbox} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon/Icon';
import './SelectTestPanel.scss';
import {bindable} from '@xh/hoist/mobx';

export const SelectTestPanel = hoistCmp({

    render() {
        const model = useLocalModel(LocalModel);

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
                        select: select({...restaurantProps, bind: 'selectValue'}),
                        model
                    }),
                    example({
                        name: 'Select enableCreate=true',
                        bind: 'creatableValue',
                        select: select({...restaurantProps, bind: 'selectValue', creatable: true}),
                        model
                    }),
                    example({
                        name: 'Select enableAsync=true',
                        bind: 'asyncValue',
                        select: select({...customerProps, bind: 'asyncValue'}),
                        model
                    }),
                    example({
                        name: 'Select enableAsync=true creatable=true',
                        bind: 'asyncCreatableValue',
                        select: select({...customerProps, bind: 'asyncValue'}),
                        model
                    }),
                    example({
                        name: 'Select (with many options)',
                        bind: 'bigValue',
                        select: select({bind: 'bigValue', options: model.bigOptions, placeholder: 'Select a number...'}),
                        model
                    }),
                    hbox(
                        label('number of options: '),
                        numberInput({bind: 'numOptions', model})
                    )
                ),
                vbox(
                    example({
                        name: 'Select enableWindowed=true',
                        bind: 'windowedSelectValue',
                        select: select({...restaurantProps, bind: 'windowedSelectValue'}),
                        model
                    }),
                    example({
                        name: 'Select enableCreate=true enableWindowed=true',
                        bind: 'windowedCreatableValue',
                        select: select({...restaurantProps, bind: 'windowedCreatableValue', creatable: true}),
                        model
                    }),
                    example({
                        name: 'Select enableAsync=true enableWindowed=true',
                        bind: 'windowedAsyncValue',
                        select: select({...customerProps, bind: 'windowedAsyncValue'}),
                        model
                    }),
                    example({
                        name: 'Select enableAsync=true creatable=true enableWindowed=true',
                        bind: 'windowedAsyncCreatableValue',
                        select: select({...customerProps, bind: 'windowedAsyncCreatableValue'}),
                        model
                    }),
                    example({
                        name: 'Select enableWindowed=true (with many options)',
                        bind: 'windowedBigValue',
                        select: select({bind: 'windowedBigValue', options: model.windowedBigOptions, placeholder: 'Select a number...'}),
                        model
                    }),
                    hbox(
                        label('number of options: '),
                        numberInput({bind: 'windowedNumOptions', model})
                    )
                )
            )
        });
    }
});

const example = hoistCmp.factory({

    render({name, bind, select, model}) {
        return fragment(
            p(name),
            label('value: ' + model.bind),
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

@HoistModel
class LocalModel {
    @bindable
    selectValue;
    @bindable
    creatableValue;
    @bindable
    asyncValue;
    @bindable
    asyncCreatableValue;
    @bindable
    bigValue;
    @bindable
    numOptions = 1000;
    @bindable
    bigOptions;

    @bindable
    windowedSelectValue;
    @bindable
    windowedCreatableValue;
    @bindable
    windowedAsyncValue;
    @bindable
    windowedAsyncCreatableValue;
    @bindable
    windowedBigValue;
    @bindable
    windowedNumOptions = 1000;
    @bindable
    windowedBigOptions;

    constructor() {
        this.addReaction({
            track: () => this.numOptions,
            run: () => {
                let options = [];
                for (let i = 0; i < this.numOptions; i++) {
                    options.push(i);
                }
                this.setBigOptions(options);
            },
            fireImmediately: true
        });

        this.addReaction({
            track: () => this.windowedNumOptions,
            run: () => {
                let options = [];
                for (let i = 0; i < this.windowedNumOptions; i++) {
                    options.push(i);
                }
                this.setWindowedBigOptions(options);
            },
            fireImmediately: true
        });
    }

    queryCustomersAsync(query) {
        return XH.fetchJson({
            url: 'customer',
            params: {query}
        });
    }
}