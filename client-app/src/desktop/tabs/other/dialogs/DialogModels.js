import { DialogModel } from '@xh/hoist/desktop/cmp/dialog';


export const dialogDraggableModel = new DialogModel({
    canEscapeKeyClose: true,
    draggable: true,
    width: 870,
    height: 550
});

export const dialogNotDraggableModel = new DialogModel({
    canEscapeKeyClose: true,
    draggable: false,
    width: 870,
    height: 550
});