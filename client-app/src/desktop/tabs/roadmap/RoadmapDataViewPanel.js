import {hoistCmp, HoistModel, LoadSupport, managed, XH, creates} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {filler} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {dataView, DataViewModel} from '@xh/hoist/cmp/dataview';

import {wrapper} from '../../common/Wrapper';
import {roadmapDataViewItem} from './RoadmapDataViewItem';
import './RoadmapDataViewItem.scss';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {bindable} from '@xh/hoist/mobx';

export const roadmapDataViewPanel = hoistCmp.factory({
    model: creates(() => new Model()),

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

@HoistModel
@LoadSupport
class Model {

    constructor() {
        this.addReaction({
            track: () => this.showReleasedOnly,
            run: () => this.dataViewModel.store.setFilter(
                (record) => {
                    if (this.showReleasedOnly) {
                        return record.data.status === 'RELEASED';
                    } else {
                        return record.data.status !== 'RELEASED';
                    }
                }
            ),
            fireImmediately: true
        });
    }
    @bindable
    showReleasedOnly = false;

    @managed
    dataViewModel = new DataViewModel({
        store: {
            fields: ['name', 'category', 'description', 'releaseVersion', 'status', 'gitLink', 'lastUpdated', 'lastUpdatedBy']
        },
        sortBy: 'name',
        emptyText: 'No projects found...',
        itemRenderer: (v, {record}) => roadmapDataViewItem({record}),
        contextMenu: [
            'copyCell'
        ],
        groupBy: 'status',
        itemHeight: 70,
        groupedItemHeight: 30
    });

    async doLoadAsync(loadSpec) {
        const {dataViewModel} = this,
            projects = await XH.fetchJson({url: 'rest/projectRest'});
        dataViewModel.loadData(projects.data);
    }
}