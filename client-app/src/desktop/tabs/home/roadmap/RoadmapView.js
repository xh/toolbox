import {hoistCmp, creates} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {dataView} from '@xh/hoist/cmp/dataview';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {button} from '@xh/hoist/desktop/cmp/button';
import {RoadmapViewModel} from './RoadmapViewModel';
import './RoadmapView.scss';

export const roadmapView = hoistCmp.factory({
    model: creates(RoadmapViewModel),

    render({model})  {
        return panel({
            className: 'toolbox-roadmap-dataview-panel',
            title: 'Hoist Roadmap',
            headerItems: [
                buttonGroupInput({
                    enableClear: true,
                    minimal: true,
                    bind: 'statusFilter',
                    items: [
                        button({
                            text: 'Show Pipeline',
                            value: 'showPipeline'
                        }),
                        button({
                            bind: 'statusFilter',
                            text: 'Show Released',
                            value: 'showReleased'
                        })
                    ]
                })
            ],
            icon: Icon.mapSigns(),
            width: 500,
            height: 600,
            item: dataView({
                model: model.dataViewModel,
                rowCls: 'dataview-item'
            }),
            bbar: [
                filler(),
                storeFilterField({store: model.dataViewModel.store})
            ]
        });
    }
});