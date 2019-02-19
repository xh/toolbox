import {HoistModel} from '@xh/hoist/core/index';
import {action, observable} from '@xh/hoist/mobx/index';
import { DialogModel } from '@xh/hoist/desktop/cmp/dialog';

@HoistModel
export class ModalPanelModel {
    @observable isAnimated = false;
    @action
    setIsAnimated() {
        this.isAnimated = !this.isAnimated;
        this.dialogModel = new DialogModel({isAnimated: this.isAnimated});
    }

    @observable
    dialogModel = new DialogModel({isAnimated: this.isAnimated})
}