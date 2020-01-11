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

        return panel({
            title: 'Select tests',
            className: 'select-test-panel xh-tiled-bg',
            item: vbox(
                exampleSelect(model),
                exampleCreatable(model),
                exampleAsync(model),
                exampleAsyncCreatable(model),
                exampleBig(model, true)
            )
        });
    }
});

function exampleSelect(model, enableWindowed) {
    const name = (enableWindowed ? 'Windowed' : '') + 'Select';
    return fragment(
        p(name),
        label('value: ' + model[name]),
        select({
            model,
            enableWindowed,
            bind: name,
            options: restaurants,
            enableClear: true,
            placeholder: 'Search restaurants...'
        })
    );
}

function exampleCreatable(model, enableWindowed) {
    const name = (enableWindowed ? 'Windowed' : '') + 'CreatableSelect';
    return fragment(
        p(name),
        label('value: ' + model[name]),
        select({
            model,
            enableWindowed,
            bind: name,
            options: restaurants,
            enableClear: true,
            enableCreate: true,
            selectOnFocus: true,
            placeholder: 'Search restaurants...'
        })
    );
}

function exampleAsync(model, enableWindowed) {
    const name = (enableWindowed ? 'Windowed' : '') + 'AsyncSelect';
    return fragment(
        p(name),
        label('value: ' + model[name]),
        select({
            model,
            enableWindowed,
            bind: name,
            valueField: 'id',
            labelField: 'company',
            enableClear: true,
            selectOnFocus: true,
            queryFn: (q) => model.queryCustomersAsync(q),
            optionRenderer: (opt) => customerOption({opt}),
            placeholder: 'Search customers...'
        })
    );
}

function exampleAsyncCreatable(model, enableWindowed) {
    const name = (enableWindowed ? 'Windowed' : '') + 'AsyncCreatableSelect';
    return fragment(
        p(name),
        label('value: ' + model[name]),
        select({
            model,
            enableWindowed,
            bind: name,
            valueField: 'id',
            labelField: 'company',
            enableClear: true,
            enableCreate: true,
            selectOnFocus: true,
            queryFn: (q) => model.queryCustomersAsync(q),
            optionRenderer: (opt) => customerOption({opt}),
            placeholder: 'Search customers...'
        })
    );
}

function exampleBig(model, enableWindowed) {
    const name = (enableWindowed ? 'Windowed' : '') + 'BigSelect';
    const numOptionsName = (enableWindowed ? 'Windowed' : '') + 'NumOptions';
    return fragment(
        p((enableWindowed ? 'Windowed' : '') + 'Select with many options'),
        label('value: ' + model[name]),
        select({
            model,
            enableWindowed,
            bind: name,
            options: function() {
                let options = [];
                for (let i = 0; i < model[numOptionsName]; i++) {
                    options.push(i);
                }
                return options;
            }(),
            enableClear: false,
            placeholder: 'Select a number...'
        }),
        hbox(
            label('Number of options: '),
            numberInput({
                model,
                bind: numOptionsName
            })
        )
    );
}

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
    Select;
    @bindable
    CreatableSelect;
    @bindable
    AsyncSelect;
    @bindable
    AsyncCreatableSelect;
    @bindable
    BigSelect;
    @bindable
    NumOptions = 1000;

    @bindable
    WindowedSelect;
    @bindable
    WindowedCreatableSelect;
    @bindable
    WindowedAsyncSelect;
    @bindable
    WindowedAsyncCreatableSelect;
    @bindable
    WindowedBigSelect;
    @bindable
    WindowedNumOptions = 1000;

    queryCustomersAsync(query) {
        return XH.fetchJson({
            url: 'customer',
            params: {query}
        });
    }
}