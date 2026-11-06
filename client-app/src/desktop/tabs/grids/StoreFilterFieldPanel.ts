import type {GridModel} from '@xh/hoist/cmp/grid';
import type {StoreFilterFieldProps} from '@xh/hoist/cmp/store';
import {storeFilterField} from '@xh/hoist/cmp/store';
import type {LoadSpec} from '@xh/hoist/core';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import type {FilterMatchMode} from '@xh/hoist/data';
import {select} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {demoPanel, demoPlayground, demoSection, fmtDemoConfig, raw} from '../../common/Demo';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../common/Wrapper';
import {MATCH_MODE_OPTIONS} from './helpers/MatchModes';
import {createTradesGridModel, loadTradesAsync, tradesGridFrame} from './helpers/TradesGrid';

export const storeFilterFieldPanel = hoistCmp.factory({
    displayName: 'StoreFilterFieldPanel',
    model: creates(() => StoreFilterFieldPanelModel),

    render({model}) {
        return wrapper({
            title: 'StoreFilterField',
            icon: Icon.search(),
            description: [
                '`StoreFilterField` is a quick text filter for a grid or store. Whatever the user',
                'types is matched against every visible column (and any `groupBy` field), and',
                "non-matching records are hidden. It's the simplest way to add search to a grid",
                'toolbar.',
                '',
                'Point it at a `gridModel` or a `store`, and use `includeFields` or',
                '`excludeFields` to control which fields it searches. For structured,',
                'field-by-field filters use `FilterChooser`; to find rows without hiding the rest,',
                'use `GridFindField`.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/grids/StoreFilterFieldPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/store/StoreFilterField.ts', notes: 'Hoist component.'}
            ],
            options: wrapperOptionGroup({
                label: 'Playground only - props',
                icon: Icon.experiment(),
                intent: 'primary',
                items: [
                    wrapperOption({
                        label: 'Match mode',
                        propName: 'StoreFilterFieldProps.matchMode',
                        control: select({
                            bind: 'matchMode',
                            enableFilter: false,
                            width: 130,
                            options: MATCH_MODE_OPTIONS
                        })
                    }),
                    wrapperOption({
                        label: 'Filter buffer',
                        propName: 'StoreFilterFieldProps.filterBuffer',
                        info: 'Delay in ms before filtering. 0 filters on every keystroke.',
                        control: select({
                            bind: 'filterBuffer',
                            enableFilter: false,
                            width: 130,
                            options: [0, 200, 500, 1000]
                        })
                    })
                ]
            }),
            item: demoPanel({
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            showValue: false,
                            caption: 'Try a company or city - "bos", "san fr".',
                            config: fmtDemoConfig<StoreFilterFieldProps>('storeFilterField', {
                                gridModel: raw('gridModel'),
                                matchMode:
                                    model.matchMode === 'startWord' ? undefined : model.matchMode,
                                filterBuffer:
                                    model.filterBuffer === 200 ? undefined : model.filterBuffer
                            }),
                            item: storeFilterField({
                                gridModel: model.gridModel,
                                matchMode: model.matchMode,
                                filterBuffer: model.filterBuffer,
                                width: '100%'
                            })
                        })
                    }),
                    demoSection({
                        title: 'Filtered Grid',
                        note: 'Filtered by the Playground field.',
                        item: tradesGridFrame({
                            gridModel: model.gridModel,
                            label: 'gridModel: gridModel',
                            info: 'Searches the visible columns - hide one from the column menu and it stops matching.',
                            mask: [model.loadObserver]
                        })
                    })
                ]
            })
        });
    }
});

class StoreFilterFieldPanelModel extends HoistModel {
    @managed gridModel: GridModel = createTradesGridModel();

    @bindable accessor matchMode: FilterMatchMode = 'startWord';
    @bindable accessor filterBuffer = 200;

    override async doLoadAsync(loadSpec: LoadSpec) {
        await loadTradesAsync(this.gridModel);
    }
}
