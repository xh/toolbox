import {HoistModel, managed} from '@xh/hoist/core';
import { DialogModel } from '@xh/hoist/desktop/cmp/dialog';

@HoistModel
export class DialogsPanelModel {

    // order important here for testing getting first 
    // dialog model defined in context
    @managed
    dialogNotDraggableModel = new DialogModel();

    @managed
    dialogDraggableModel = new DialogModel({
        draggable: true
    });
    @managed
    dialogWithOHLCChartModel = new DialogModel({
        resizable: true,
        draggable: true
    });

    @managed
    dialogWithTreeMapModel = new DialogModel({
        resizable: true,
        draggable: true
    });

    @managed
    statefulDalogWithOHLCChartModel = new DialogModel({
        resizable: true,
        draggable: true,
        stateModel: 'stateFulDialogOHLC'
    });
}