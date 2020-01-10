import {XH, hoistCmp, HoistModel} from '@xh/hoist/core';
import {restaurants} from '../../../core/data';
import {useLocalModel} from '@xh/hoist/core/hooks';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {select} from '@xh/hoist/desktop/cmp/input';
import {box, div, hbox, label, p} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon/Icon';
import './SelectTestPanel.scss';
import {bindable} from '@xh/hoist/mobx';

export const SelectTestPanel = hoistCmp({

    render() {
        const model = useLocalModel(LocalModel);

        return panel({
            title: 'Select tests',
            className: 'select-test-panel xh-tiled-bg',
            item: [
                p('Select'),
                label('value: ' + model.select1),
                select({
                    model,
                    bind: 'select1',
                    options: restaurants,
                    enableClear: true,
                    placeholder: 'Search restaurants...'
                }),
                p('Creatable'),
                label('value: ' + model.select2),
                select({
                    model,
                    bind: 'select2',
                    options: restaurants,
                    enableClear: true,
                    enableCreate: true,
                    selectOnFocus: true,
                    placeholder: 'Search restaurants...'
                }),
                p('Async'),
                label('value: ' + model.select3),
                select({
                    model,
                    bind: 'select3',
                    valueField: 'id',
                    labelField: 'company',
                    enableClear: true,
                    selectOnFocus: true,
                    queryFn: (q) => model.queryCustomersAsync(q),
                    optionRenderer: (opt) => customerOption({opt}),
                    placeholder: 'Search customers...'
                }),
                p('AsyncCreatable'),
                label('value: ' + model.select4),
                select({
                    model,
                    bind: 'select4',
                    valueField: 'id',
                    labelField: 'company',
                    enableClear: true,
                    enableCreate: true,
                    selectOnFocus: true,
                    queryFn: (q) => model.queryCustomersAsync(q),
                    optionRenderer: (opt) => customerOption({opt}),
                    placeholder: 'Search customers...'
                }),
                p('Normal with 10,000 options'),
                label('value: ' + model.select5),
                select({
                    model,
                    options: function() {
                        let options = [];
                        for (let i = 0; i < 10000; i++) {
                            options.push(i);
                        }
                        return options;
                    }(),
                    enableClear: false,
                    placeholder: 'Select a number...'
                })
            ]
        });
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
    select1;
    @bindable
    select2;
    @bindable
    select3;
    @bindable
    select4;
    @bindable
    select5;

    queryCustomersAsync(query) {
        return XH.fetchJson({
            url: 'customer',
            params: {query}
        });
    }
}