import {HoistModel} from '@xh/hoist/core';
import {action, observable} from '@xh/hoist/mobx';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {h3, li, ol, p} from '@xh/hoist/cmp/layout';

@HoistModel
export class PanelResizingTestModel {

    @observable resizeWhileDragging = false;
    @observable persisted = false;

    @observable.ref topPanel1Model;
    @observable.ref topPanel2Model;
    @observable.ref leftPanel1Model;
    @observable.ref leftPanel2Model;
    @observable.ref rightPanel1Model;
    @observable.ref rightPanel2Model;
    @observable.ref bottomPanel1Model;
    @observable.ref bottomPanel2Model;

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

    constructor() {
        this.setPanelModels();
    }

    @action
    setPanelModels() {
        this.topPanel1Model = new PanelModel({
            resizeWhileDragging: this.resizeWhileDragging,
            defaultSize: 100,
            minSize: 50,
            side: 'top'
        });
    
        this.topPanel2Model = new PanelModel({
            resizeWhileDragging: this.resizeWhileDragging,
            persistWith: {localStorageKey: 'adminPanelSizing', path: 'topPanel2'},
            defaultSize: 100,
            maxSize: 150,
            side: 'top'
        });
    
        this.leftPanel1Model = new PanelModel({
            resizeWhileDragging: this.resizeWhileDragging,
            defaultSize: 100,
            side: 'left'
        });
    
        this.leftPanel2Model = new PanelModel({
            resizeWhileDragging: this.resizeWhileDragging,
            defaultSize: 150,
            minSize: 50,
            side: 'left'
        });
    
        this.rightPanel1Model = new PanelModel({
            resizeWhileDragging: this.resizeWhileDragging,
            defaultSize: 100,
            minSize: 150,
            side: 'right'
        });
    
        this.rightPanel2Model = new PanelModel({
            resizeWhileDragging: this.resizeWhileDragging,
            defaultSize: '20%',
            side: 'right'
        });
    
        this.bottomPanel1Model = new PanelModel({
            resizeWhileDragging: this.resizeWhileDragging,
            defaultSize: 100,
            side: 'bottom'
        });
    
        this.bottomPanel2Model = new PanelModel({
            resizeWhileDragging: this.resizeWhileDragging,
            persistWith: {localStorageKey: 'adminPanelSizing', path: 'bottomPanel2'},
            defaultSize: '15%',
            minSize: '5%',
            maxSize: '30%',
            side: 'bottom'
        });
    }

    setCollapsedAll(collapsed) {
        this.resizablePanelNames.forEach(it => this[it].setCollapsed(collapsed));
    }

    @action
    toggleResizeWhileDraggingOnAll() {
        this.resizeWhileDragging = !this.resizeWhileDragging;
        this.setPanelModels();
    }

    get allExpanded() {
        return this.resizablePanelNames.every(it => this[it] && !this[it].collapsed);
    }

    get allCollapsed() {
        return this.resizablePanelNames.every(it => this[it] && this[it].collapsed);
    }

    explanation = [
        h3({
            className: 'xh-text-color-accent',
            item: 'Use this Page to Test the Panel Drag Bars'
        }),
        p('The vertical and horizontal drag bars on the surrounding panels should be draggable (hold mouse down on bar and drag) and dragging a bar should resize its panel.'),
        p('There are two modes:'),
        ol({
            items: [
                li('Resize after drag (the default mode)'),
                li('Resize while dragging.')
            ]}),
        p('In default "Resize after Drag" mode, the drag bar should only be draggable as far as the next sibling\'s far side.  Also, if the next sibling is itself resizable, it will not shrink, but get pushed over.'),
        p('Panels that specify a minSize should not be resizable smaller than that specified size.'),
        p('Panels that specify a maxSize should not be resizable larger than that specified size.')
    ]
}