import {dataView} from '@xh/hoist/cmp/dataview';
import {filler} from '@xh/hoist/cmp/layout';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {RoadmapModel} from './RoadmapModel';
import './RoadmapView.scss';

export const roadmapView = hoistCmp.factory({
    model: creates(RoadmapModel),

    render({model, ...props})  {
        return panel({
            title: 'Hoist Roadmap',
            icon: Icon.mapSigns(),
            className: 'tb-roadmap',
            item: dataView(),
            bbar: bbar(),
            ...props
        });
    }
});

const bbar = hoistCmp.factory(
    ({model}) => toolbar(
        buttonGroupInput({
            bind: 'statusFilter',
            items: [
                button({
                    text: 'Upcoming',
                    icon: Icon.mapSigns(),
                    value: 'showUpcoming',
                    width: 100
                }),
                button({
                    text: 'Released',
                    icon: Icon.checkCircle(),
                    value: 'showReleased',
                    width: 100
                })
            ]
        }),
        filler(),
        storeFilterField({store: model.dataViewModel.store})
    )
);