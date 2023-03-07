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
import './RoadmapWidget.scss';

export const roadmapWidget = hoistCmp.factory({
    displayName: 'RoadmapWidget',
    model: creates(RoadmapModel),

    render() {
        return panel({
            className: 'tb-roadmap-widget',
            item: dataView(),
            bbar: bbar()
        });
    }
});

const bbar = hoistCmp.factory<RoadmapModel>(({model}) =>
    toolbar({
        compact: true,
        items: [
            buttonGroupInput({
                bind: 'statusFilter',
                outlined: true,
                items: [
                    button({
                        text: 'Upcoming',
                        icon: Icon.mapSigns(),
                        value: 'showUpcoming',
                        width: 80
                    }),
                    button({
                        text: 'Released',
                        icon: Icon.checkCircle(),
                        value: 'showReleased',
                        width: 80
                    })
                ]
            }),
            filler(),
            storeFilterField({store: model.dataViewModel.store})
        ]
    })
);
