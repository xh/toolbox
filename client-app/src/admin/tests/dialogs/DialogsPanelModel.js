import {HoistModel, managed} from '@xh/hoist/core';
import { DialogModel } from '@xh/hoist/desktop/cmp/dialog';
import {bindable} from '@xh/hoist/mobx';


@HoistModel
export class DialogsPanelModel {

    @bindable withMask = false;
    @bindable closeOnOutsideClick = true;
    @bindable showCloseButton = true;
    @bindable closeOnEscape = true;

    @bindable isOpen1 = false;
    @bindable isOpen2 = false;
    @bindable isOpen3 = false;
    @bindable isOpen4 = false;
    @bindable isOpen5 = false;
    @bindable isOpen6 = false;
    @bindable isOpen7 = false;
    @bindable isOpen8 = false;
    @bindable isOpen9 = false;
    @bindable isOpen10 = false;
    @bindable isOpen11 = false;
    @bindable isOpen12 = false;
    @bindable isOpen13 = false;

    // order important here for testing getting first 
    // dialog model defined in context
    @managed
    dialogModelThatWillBeFoundFromContextLookup = new DialogModel();

}