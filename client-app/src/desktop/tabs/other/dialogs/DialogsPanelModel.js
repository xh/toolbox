import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';


@HoistModel
export class DialogsPanelModel {
  @bindable mask = false;
  @bindable closeOnOutsideClick = true;
  @bindable showCloseButton = true;
  @bindable closeOnEscape = true;

  @bindable isOpen1 = false;
  @bindable isOpen2 = false;
  @bindable isOpen3 = false;
  @bindable isOpen4 = false;
  @bindable isOpen5 = false;
  @bindable isOpen6 = false;

}