import {HoistModel, managed} from '@xh/hoist/core';
import { DialogModel } from '@xh/hoist/desktop/cmp/dialog';
import {bindable} from '@xh/hoist/mobx';


@HoistModel
export class DialogsPanelModel {

    @bindable withMask = false;
    @bindable closeOnOutsideClick = true;

    @bindable isOpen1 = false;
    @bindable isOpen2 = false;
    @bindable isOpen3 = false;
    @bindable isOpen4 = false;
    @bindable isOpen5 = false;
    @bindable isOpen6 = false;

    // order important here for testing getting first 
    // dialog model defined in context
    @managed
    dialogModelThatWillBeFoundFromContextLookup = new DialogModel();

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