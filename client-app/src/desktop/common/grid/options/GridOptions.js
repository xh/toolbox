import {hoistCmp, uses} from '@xh/hoist/core';
import {textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {fragment, hbox, span} from '@xh/hoist/cmp/layout';
import {GridModel} from '@xh/hoist/cmp/grid';
import {button} from '@xh/hoist/desktop/cmp/button';
import {agGridOptions} from './AgGridOptions';

export const gridOptions = hoistCmp.factory({
    model: uses(GridModel),

    render({model}) {
        return fragment({
            items: [
                agGridOptions({model: model.agGridModel}),
                button({
                    icon: Icon.crosshairs(),
                    onClick: () => model.ensureSelectionVisible(),
                    text: 'Scroll to selection'
                }),
                hbox(
                    span('Empty Text'),
                    textInput({
                        placeholder: 'emptyText',
                        bind: 'emptyText'
                    })
                )
            ]
        });
    }
});