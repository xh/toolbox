import { DialogModel } from '@xh/hoist/desktop/cmp/dialog';


export const dialogDraggableModel = new DialogModel({
    resizable: true,
    draggable: true,
    width: 870,
    height: 550
});

export const dialogNotDraggableModel = new DialogModel({
    width: 870,
    height: 550
});