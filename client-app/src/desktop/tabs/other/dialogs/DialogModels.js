import { DialogModel } from '@xh/hoist/desktop/cmp/dialog';

export const dialogNotDraggableModel = new DialogModel();

export const dialogDraggableModel = new DialogModel({
    draggable: true
});

export const dialogWithOHLCChartModel = new DialogModel({
    resizable: true,
    draggable: true
});

export const dialogWithTreeMapModel = new DialogModel({
    resizable: true,
    draggable: true
});