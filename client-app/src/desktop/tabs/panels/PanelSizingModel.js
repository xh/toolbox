import {HoistModel} from '@xh/hoist/core';
import {LoadSupport} from '@xh/hoist/core/mixins';
import {action, observable} from '@xh/hoist/mobx';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';


@HoistModel
@LoadSupport
export class PanelSizingModel {


    @observable animateResize = false;

    resizablePanelNames = [
        'topPanel1Model',
        'topPanel2Model',
        'leftPanel1Model',
        'leftPanel2Model',
        'rightPanel1Model',
        'rightPanel2Model',
        'bottomPanel1Model',
        'bottomPanel2Model'
    ];

    topPanel1Model = new PanelModel({
        defaultSize: 100,
        side: 'top'
    });

    topPanel2Model = new PanelModel({
        defaultSize: 100,
        side: 'top'
    });

    leftPanel1Model = new PanelModel({
        // resizable: false,
        defaultSize: 100,
        side: 'left'
    });

    leftPanel2Model = new PanelModel({
        defaultSize: 150,
        side: 'left'
    });

    rightPanel1Model = new PanelModel({
        defaultSize: 100,
        side: 'right'
    });

    rightPanel2Model = new PanelModel({
        defaultSize: 150,
        side: 'right'
    });

    bottomPanel1Model = new PanelModel({
        defaultSize: 100,
        side: 'bottom'
    });

    bottomPanel2Model = new PanelModel({
        defaultSize: 100,
        side: 'bottom'
    });

    setCollapsedAll(collapsed) {
        this.resizablePanelNames.forEach(it => this[it].setCollapsed(collapsed));
    }

    @action
    setAnimateResizeAll() {
        this.animateResize = !this.animateResize;
        this.resizablePanelNames.forEach(it => this[it].setAnimateResize(this.animateResize));
    }

    get allExpanded() {
        return this.resizablePanelNames.every(it => !this[it].collapsed);
    }

    get allCollapsed() {
        return this.resizablePanelNames.every(it => this[it].collapsed);
    }
}