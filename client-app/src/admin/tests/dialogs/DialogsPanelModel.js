import {HoistModel, managed} from '@xh/hoist/core';
import { DialogModel } from '@xh/hoist/desktop/cmp/dialog';
import {bindable} from '@xh/hoist/mobx';

import {formPanel} from './form/FormPanel';


@HoistModel
export class DialogsPanelModel {

    @bindable withMask = false;
    @bindable closeOnOutsideClick = true;
    @bindable showCloseButton = true;
    @bindable closeOnEscape = true;

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


    @managed
    dialogModel1 = new DialogModel({
        content: () => formPanel({onCloseClick: () => this.dialogModel1.close()})
    });

}