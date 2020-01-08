import { DialogModel } from '@xh/hoist/desktop/cmp/dialog';


export const dialogDraggableModel = new DialogModel({
    resizable: true,
    draggable: true
});

export const dialogNotDraggableModel = new DialogModel();