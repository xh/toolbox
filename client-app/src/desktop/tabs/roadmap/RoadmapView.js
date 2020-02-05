import {hoistCmp, creates} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {dataView} from '@xh/hoist/cmp/dataview';

import {wrapper} from '../../common/Wrapper';
import {RoadmapViewModel} from './RoadmapViewModel';
import './RoadmapView.scss';
import {switchInput} from '@xh/hoist/desktop/cmp/input';

export const roadmapView = hoistCmp.factory({
    model: creates(RoadmapViewModel),

    render({model})  {
        return wrapper({
            item: panel({
                className: 'toolbox-roadmap-dataview-panel',
                title: 'Hoist Roadmap',
                headerItems: [
                    switchInput({
                        label: 'Show Released',
                        labelAlign: 'right',
                        bind: 'showReleasedOnly'
                    })
                ],
                icon: Icon.mapSigns(),
                width: 500,
                height: 700,
                item: dataView({
                    model: model.dataViewModel,
                    rowCls: 'dataview-item'
                }),
                bbar: [
                    filler(),
                    storeFilterField({store: model.dataViewModel.store})
                ]
            })
        });
    }
});
