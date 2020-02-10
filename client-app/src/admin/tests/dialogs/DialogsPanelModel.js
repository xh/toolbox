import {HoistModel, managed} from '@xh/hoist/core';
import { DialogModel } from '@xh/hoist/desktop/cmp/dialog';
import {bindable} from '@xh/hoist/mobx';


@HoistModel
export class DialogsPanelModel {

    @bindable withMask = false;
    @bindable closeOnOutsideClick = true;

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

    @managed
    statefulDalogWithFormModel = new DialogModel({
        draggable: true,
        stateModel: {
            dialogId: 'stateFulDialogForm',
            trackSize: false
        }
    });

    @managed
    parentDialogModel = new DialogModel({
        draggable: true,
        stateModel: {
            dialogId: 'zIndexParentDialog'
        }
    });

    @managed
    childDalogWithOHLCChartModel = new DialogModel({
        resizable: true,
        draggable: true,
        stateModel: 'childDialogOHLC'
    });

    @managed
    customZIndexDialogModel = new DialogModel({
        resizable: true,
        draggable: true,
        stateModel: 'customZIndexDialog'
    });

    @managed
    customZIndexRndoDialogModel = new DialogModel({
        resizable: true,
        draggable: true
    });

    @managed
    customStylePropDialogModel = new DialogModel({
        resizable: true,
        draggable: true
    });
}