import {hoistCmp, creates, useLocalModel, HoistModel} from '@xh/hoist/core';

import {sampleGrid, SampleGridModel} from '../../../../common';

export const GridWidget = hoistCmp({
    model: creates(SampleGridModel),
    render({viewModel, model}) {
        useLocalModel(() => new LocalModel(viewModel, model));
        return sampleGrid({omitGridTools: true});
    }
});

@HoistModel
class LocalModel {

    viewModel;
    sampleGridModel;

    constructor(viewModel, sampleGridModel) {
        this.viewModel = viewModel;
        this.sampleGridModel = sampleGridModel;

        const {columnState, sortBy, groupBy} = viewModel.viewState ?? {},
            {gridModel} = sampleGridModel;

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

}