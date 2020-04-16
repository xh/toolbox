import {GridModel} from '@xh/hoist/cmp/grid';
import {fragment, label, vspacer} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {sample} from 'lodash';
import {agGridOptions} from './AgGridOptions';

export const gridOptions = hoistCmp.factory({
    model: uses(GridModel),

    render({model}) {
        return fragment({
            items: [
                agGridOptions({model: model.agGridModel}),
                vspacer(10),
                label('Empty text (quick-filter to test)'),
                textInput({bind: 'emptyText', width: null}),
                button({
                    text: 'Select random record',
                    icon: Icon.random(),
                    minimal: false,
                    onClick: () => {
                        const rec = sample(model.store.records);
                        if (rec) model.selModel.select(rec);
                    }
                }),
                button({
                    text: 'Scroll to selection',
                    icon: Icon.crosshairs(),
                    minimal: false,
                    onClick: () => model.ensureSelectionVisible()
                })
            ]
        });
    }
});