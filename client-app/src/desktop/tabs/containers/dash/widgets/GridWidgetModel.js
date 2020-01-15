import {HoistModel, LoadSupport, managed} from '@xh/hoist/core';

import {SampleGridModel} from '../../../../common';

@HoistModel
@LoadSupport
export class GridWidgetModel {

    @managed sampleGridModel = new SampleGridModel();

    constructor(viewState, setViewStateSource) {
        const {columnState, sortBy, groupBy} = viewState,
            {gridModel} = this.sampleGridModel;

        gridModel.applyColumnStateChanges(columnState);
        gridModel.setSortBy(sortBy);
        gridModel.setGroupBy(groupBy);
        setViewStateSource(() => this.getViewState());
    }

    //----------------------
    // Dash container state
    //----------------------
    getViewState() {
        const {columnState, sortBy, groupBy} = this.sampleGridModel.gridModel;
        return {columnState, sortBy, groupBy};
    }

    async doLoadAsync(loadSpec) {
        return this.sampleGridModel.doLoadAsync(loadSpec);
    }

}