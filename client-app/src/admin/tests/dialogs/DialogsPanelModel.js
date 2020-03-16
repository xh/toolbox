import {flatten, last, upperFirst} from 'lodash';

import {HoistModel, managed} from '@xh/hoist/core';
import {DialogModel} from '@xh/hoist/desktop/cmp/dialog';
import {bindable} from '@xh/hoist/mobx';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {p} from '@xh/hoist/cmp/layout';

import {formPanel} from './form/FormPanel';
import {oHLCChartPanel} from './chart/OHLCChartPanel';
import {simpleTreeMapPanel} from './chart/SimpleTreeMapPanel';


@HoistModel
export class DialogsPanelModel {

   @bindable controllSizePos = false;

    // dialog model defaults
    @bindable showBackgroundMask = true;
    @bindable closeOnOutsideClick = true;
    @bindable showCloseButton = true;
    @bindable closeOnEscape = true;

    @bindable x = null;
    @bindable y = null;
    @bindable width = null;
    @bindable height = null;

    switchableDialogModels = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    switches = [
        'showBackgroundMask', 'closeOnOutsideClick', 'showCloseButton', 'closeOnEscape'
    ];
    dynamics = ['x', 'y', 'width', 'height'];

    disposers = new Map();
    openDialogs = new Set();

    constructor() {
        this.switches.forEach(prop => {
            this.addReaction({
                track: () => this[prop],
                run: (v) => {
                    this.switchableDialogModels.forEach(n => {
                        const dm = this['dialogModel' + n];
                        const method = 'set' + upperFirst(prop);
                        dm[method](v);
                    });
                }
            });
        });

        this.switchableDialogModels.forEach(n => {
            const dm = this['dialogModel' + n];
            this.addReaction({
                track: () => dm.isOpen,
                run: (isOpen) => {
                    if (this.controllSizePos) {
                        if (isOpen) {
                            setTimeout(() => this.trackDynamics(dm), 100);
                            this.openDialogs.add(dm);
                        } else {
                            this.dispose(dm);
                            this.clearDynamics();
                            this.openDialogs.delete(dm);
                            const lastOpened = last([...this.openDialogs.values()]);
                            if (lastOpened) this.trackDynamics(lastOpened);
                        }
                    }
                }
            });
        });
      
        this.addReaction({
            track: () => this.controllSizePos,
            run: (controllSizePos) => {
                if (controllSizePos) {
                    this.switchableDialogModels.forEach(n => {
                        const dialogName = 'dialogModel' + n,
                            dm = this[dialogName];
                        if (dm.isOpen) {
                            this.trackDynamics(dm);
                            this.openDialogs.add(dm);
                        } else {
                            this.openDialogs.delete(dm);
                        }
                    });
                } else {
                    this.disposeAll();
                    this.clearDynamics();
                }
            }
        });
    }

    clearDynamics() {
        this.dynamics.forEach(it => {
            const method = 'set' + upperFirst(it);
            this[method](null);
        });
    }

    dispose(dm) {
        this.disposers.get(dm)?.forEach(it => it());
        this.disposers.delete(dm);
    }

    disposeAll() {
        this.disposers.forEach(items => {
          items?.forEach(it => it());
        });
        this.disposers.clear();
    }

    trackDynamics(dialogModel) {
        this.disposeAll();
        this.setX(dialogModel.position.x);
        this.setY(dialogModel.position.y);

        this.setWidth(dialogModel.size.width);
        this.setHeight(dialogModel.size.height);

        this.disposers.set(dialogModel, flatten(this.dynamics.map(prop => {
            return [
                this.addReaction({
                    track: () => this[prop],
                    run: (v) => {
                        if (['x', 'y'].includes(prop)) {
                            const method = 'setPosition',
                                pos = {
                                    ...{x: this.x, y: this.y},
                                    ...{[prop]: v}
                                };
                            dialogModel[method](pos);
                        } 
                        if (['width', 'height'].includes(prop)) {
                            const method = 'setSize',
                                size = {
                                    ...{width: this.width, height: this.height},
                                    ...{[prop]: v}
                                };
                            dialogModel[method](size);
                        } 
                    }
                }),
                this.addReaction({
                    track: () => dialogModel[prop],
                    run: (v) => {
                        const method = 'set' + upperFirst(prop);
                        this[method](v);
                    }
                })
            ];
        }))
        );
    }

    @managed
    dialogModel1 = new DialogModel({
        content: () => formPanel({onCloseClick: () => this.dialogModel1.close()})
    });

    @managed
    dialogModel2 = new DialogModel({
        content: () => formPanel({onCloseClick: () => this.dialogModel2.close()}),
        showCloseButton: false
    });

    @managed
    dialogModel3 = new DialogModel({
        content: () => formPanel({onCloseClick: () => this.dialogModel3.close()})
    });

    @managed
    dialogModel4 = new DialogModel({
        content: () => formPanel({onCloseClick: () => this.dialogModel4.close()}),
        draggable: true
    });

    @managed
    dialogModel5 = new DialogModel({
        content: oHLCChartPanel,
        resizable: true,
        width: 600,
        height: 400,
        x: 100,
        y: 100
    });

    @managed
    dialogModel6 = new DialogModel({
        content: simpleTreeMapPanel,
        draggable: true,
        resizable: true,
        width: 600,
        height: 400
    });

    @managed
    dialogModel7 = new DialogModel({
        content: oHLCChartPanel,
        draggable: true,
        width: 600,
        height: 400,
        stateModel: 'stateFul_DM7'
    });

    @managed
    dialogModel8 = new DialogModel({
        content: oHLCChartPanel,
        resizable: true,
        width: 600,
        height: 400,
        stateModel: 'stateFul_DM8'
    });

    @managed
    dialogModel9 = new DialogModel({
        content: oHLCChartPanel,
        draggable: true,
        resizable: true,
        width: 600,
        height: 400,
        stateModel: 'stateFul_DM9'
    });

    @managed
    dialogModel10 = new DialogModel({
        x: 100,
        y: 100,
        content: () => panel({
            style: {padding: '10px'},
            width: 300,
            items: [
                p(`The "child" dialog must be defined outside of this dialog if the two 
        dialogs are to be dragged independently.`),
                button({
                    ...dialogBtn(),
                    text: 'Open a Child Dialog',
                    onClick: () => this.dialogModel11.open()   
                })
            ]
        })
    });

    @managed
    dialogModel11 = new DialogModel({
        content: oHLCChartPanel,
        draggable: true,
        resizable: true,
        x: 300,
        y: 300,
        width: 600,
        height: 400
    });

    @managed
    dialogModel12 = new DialogModel({
        content: oHLCChartPanel,
        draggable: true,
        resizable: true,
        width: 600,
        height: 400
    });

    @managed
    dialogModel13 = new DialogModel({
        content: oHLCChartPanel,
        draggable: true,
        resizable: true,
        width: 600,
        height: 400
    });

    @managed
    dialogModel14 = new DialogModel({
        inPortal: false,
        content: () => formPanel({onCloseClick: () => this.dialogModel14.close()}),
        draggable: true,
        resizable: true,
        width: 600,
        height: 400
    });

    @managed
    dialogModel15 = new DialogModel({
        inPortal: false,
        content: oHLCChartPanel,
        width: 600,
        height: 400
    });
}


function dialogBtn(icon) {
    return ({
        className: 'tbox-dialogs__button',
        icon: icon,
        minimal: false
    });
}