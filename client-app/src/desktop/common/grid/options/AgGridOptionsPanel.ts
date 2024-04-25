import {div, vspacer} from '@xh/hoist/cmp/layout';
import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AgGridModel} from '@xh/hoist/cmp/ag-grid';
import {button} from '@xh/hoist/desktop/cmp/button';
import {agGridOptions} from './AgGridOptions';

export const agGridOptionsPanel = hoistCmp.factory<AgGridModel>({
    model: uses(AgGridModel),

    render({model}) {
        return panel({
            title: 'Display Options',
            icon: Icon.settings(),
            className: 'tbox-display-opts',
            compactHeader: true,
            modelConfig: {side: 'right', defaultSize: 250, resizable: false},
            item: div({
                className: 'tbox-display-opts__inner',
                item: [
                    agGridOptions(),
                    vspacer(10),
                    button({
                        text: 'Save grid state',
                        icon: Icon.save(),
                        minimal: false,
                        onClick: () => {
                            const state = model.getState();
                            XH.localStorageService.set('agGridWrapperState', state);
                        }
                    }),
                    button({
                        text: 'Load grid state',
                        icon: Icon.grid(),
                        minimal: false,
                        onClick: () => {
                            const state = XH.localStorageService.get('agGridWrapperState');
                            model.setState(state);
                        }
                    })
                ]
            })
        });
    }
});
