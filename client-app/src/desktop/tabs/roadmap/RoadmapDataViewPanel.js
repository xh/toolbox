import {hoistCmp, HoistModel, LoadSupport, managed, XH, creates} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {dataView, DataViewModel} from '@xh/hoist/cmp/dataview';

import {wrapper} from '../../common/Wrapper';
import {RoadmapDataViewItem} from './RoadmapDataViewItem';
import './RoadmapDataViewItem.scss';

export const roadmapDataViewPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render({model})  {
        return wrapper({
            item: panel({
                className: 'toolbox-roadmap-dataview-panel',
                title: 'Hoist Roadmap',
                icon: Icon.mapSigns(),
                width: 700,
                height: 400,
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

@HoistModel
@LoadSupport
class Model {

    @managed
    dataViewModel = new DataViewModel({
        store: {
            fields: ['name', 'description', 'status']
        },
        sortBy: 'name',
        emptyText: 'No projects found...',
        itemRenderer: (v, {record}) => RoadmapDataViewItem({record}),
        contextMenu: [
            'copyCell'
        ],
        groupBy: 'status',
        itemHeight: 70,
        groupedItemHeight: 32
    });

    async doLoadAsync(loadSpec) {
        const {dataViewModel} = this,
            projects = await XH.fetchJson({url: 'rest/projectRest'});
        dataViewModel.store.loadData(projects.data);
        dataViewModel.selectFirst();
    }
}