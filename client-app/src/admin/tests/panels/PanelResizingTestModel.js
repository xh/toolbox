import {HoistModel} from '@xh/hoist/core';
import {action, observable} from '@xh/hoist/mobx';
import {PanelModel} from '@xh/hoist/desktop/cmp/panel';
import {p, h3} from '@xh/hoist/cmp/layout';


@HoistModel
export class PanelResizingTestModel {

    @observable resizeWhileDragging = false;

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
            side: 'top'
        });
    
        this.topPanel2Model = new PanelModel({
            resizeWhileDragging: this.resizeWhileDragging,
            defaultSize: 100,
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
            side: 'left'
        });
    
        this.rightPanel1Model = new PanelModel({
            resizeWhileDragging: this.resizeWhileDragging,
            defaultSize: 100,
            side: 'right'
        });
    
        this.rightPanel2Model = new PanelModel({
            resizeWhileDragging: this.resizeWhileDragging,
            defaultSize: 150,
            side: 'right'
        });
    
        this.bottomPanel1Model = new PanelModel({
            resizeWhileDragging: this.resizeWhileDragging,
            defaultSize: 100,
            side: 'bottom'
        });
    
        this.bottomPanel2Model = new PanelModel({
            resizeWhileDragging: this.resizeWhileDragging,
            defaultSize: 100,
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

    loremIpsum = [
        h3({
            className: 'xh-text-color-accent',
            item: 'Some old-fashioned text content'
        }),
        p('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam porta velit varius augue fermentum, vulputate tempus magna tempus.)'),
        p('Fusce consectetur malesuada vehicula. Aliquam commodo magna at porta sollicitudin. Sed laoreet vehicula leo vel aliquam. Aliquam auctor fringilla ex, nec iaculis felis tincidunt ac. Pellentesque blandit ipsum odio, vel lacinia arcu blandit non.'),
        p('Vestibulum non libero sem. Mauris a ipsum elit. Donec vestibulum sodales dapibus. Mauris posuere facilisis mollis. Etiam nec mauris nunc. Praesent mauris libero, blandit gravida ullamcorper vel, condimentum et velit. Suspendisse fermentum odio ac dui aliquet semper. Duis arcu felis, accumsan in leo sit amet, vehicula imperdiet tellus. Nulla ut condimentum quam. Donec eget mauris vitae libero blandit facilisis efficitur id justo.'),
        p('Nam et tincidunt risus, at faucibus enim. Aliquam tortor est, finibus ac metus id, eleifend auctor quam. Aenean purus odio, tempus interdum velit et, faucibus placerat nisi. Etiam eget nunc vehicula, eleifend justo quis, varius leo. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Mauris bibendum mollis tempor.'),
        p('Fusce ac sollicitudin nunc, at tempus sem. Fusce dapibus lorem malesuada vestibulum luctus. Etiam semper est in ligula sagittis facilisis. Phasellus accumsan placerat ex, eu fringilla mauris semper nec.')
    ]
}