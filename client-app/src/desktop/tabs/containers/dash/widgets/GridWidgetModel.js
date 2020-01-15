import {HoistModel, LoadSupport, managed} from '@xh/hoist/core';

import {SampleGridModel} from '../../../../common';

@HoistModel
@LoadSupport
export class GridWidgetModel {

    @managed sampleGridModel = new SampleGridModel();

    //----------------------
    // Dash container state
    //----------------------
    getState() {
        const {columnState, sortBy, groupBy} = this.sampleGridModel.gridModel;
        return {columnState, sortBy, groupBy};
    }

    setState(state) {
        const {columnState, sortBy, groupBy} = state,
            {gridModel} = this.sampleGridModel;

        gridModel.applyColumnStateChanges(columnState);
        gridModel.setSortBy(sortBy);
        gridModel.setGroupBy(groupBy);
    }

    async doLoadAsync(loadSpec) {
        return this.sampleGridModel.doLoadAsync(loadSpec);
    }

}