import {HoistModel, LoadSupport, managed} from '@xh/hoist/core';

import {SampleGridModel} from '../../../../common';

@HoistModel
@LoadSupport
export class GridWidgetModel {

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
        return this.sampleGridModel.doLoadAsync(loadSpec);
    }

}