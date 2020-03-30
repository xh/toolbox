import {HoistModel, XH} from '@xh/hoist/core';

@HoistModel
export class StubModel {
    title;
    icon;
    dialogModel;

    constructor(title, icon, content, dialogModel) {
        this.title = title;
        this.icon = icon;
        this.content = content;
        this.dialogModel = dialogModel;
    }

    destroy() {
        this.dialogModel.close();
        XH.safeDestroy(this.dialogModel);
    }
}