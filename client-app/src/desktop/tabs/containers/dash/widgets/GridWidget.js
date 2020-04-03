import {hoistCmp, HoistModel, LoadSupport, managed, useLocalModel} from '@xh/hoist/core';

import {sampleGrid, SampleGridModel} from '../../../../common';

export const GridWidget = hoistCmp({
    render({viewModel}) {
        const model = useLocalModel(() => new LocalModel(viewModel));
        return sampleGrid({
            model: model.sampleGridModel,
            omitGridTools: true
        });
    }
});

@HoistModel
@LoadSupport
class LocalModel {

    viewModel;
    @managed sampleGridModel = new SampleGridModel();

    constructor(viewModel) {
        this.viewModel = viewModel;
        const {columnState, sortBy, groupBy} = viewModel.viewState ?? {},
            {gridModel} = this.sampleGridModel;

        if (columnState) gridModel.applyColumnStateChanges(columnState);
        if (sortBy) gridModel.setSortBy(sortBy);
        if (groupBy) gridModel.setGroupBy(groupBy);

        this.addReaction({
            track: () => {
                const {columnState, groupBy, sortBy} = gridModel;
                return {columnState, groupBy, sortBy};
            },
            run: (viewState) => this.viewModel.setViewState(viewState)
        });
    }

    async doLoadAsync(loadSpec) {
        return this.sampleGridModel.loadAsync(loadSpec);
    }

}