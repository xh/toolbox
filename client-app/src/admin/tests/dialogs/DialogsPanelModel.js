import {flatten, upperFirst} from 'lodash';

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

    // dialog model defaults
    @bindable showBackgroundMask = true;
    @bindable closeOnOutsideClick = true;
    @bindable showCloseButton = true;
    @bindable closeOnEscape = true;
    @bindable x = null;
    @bindable y = null;

    switchable = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    switches = [
        'showBackgroundMask', 'closeOnOutsideClick', 'showCloseButton', 'closeOnEscape'
    ];
    dynamics = ['x', 'y']

    disposers = [];

    constructor() {
        this.switches.forEach(prop => {
            this.addReaction({
                track: () => this[prop],
                run: (v) => {
                    this.switchable.forEach(n => {
                        const dm = this['dialogModel' + n];
                        const method = 'set' + upperFirst(prop);
                        dm[method](v);
                    });
                }
            });
        });

        this.switchable.forEach(n => {
            const dialogName = 'dialogModel' + n,
                dialogModel = this[dialogName];

            this.addReaction({
                track: () => dialogModel.isOpen,
                run: (isOpen) => {
                    if (isOpen) {
                        this.trackDynamics(dialogModel);
                        setTimeout(() => {
                            this.setX(dialogModel.x);
                            this.setY(dialogModel.y);
                        }, 100);
                    } else {
                        this.disposers.forEach(it => it());
                        this.disposers = [];
                        this.switchable.forEach(n => {
                            const dm = this['dialogModel' + n];
                            if (dm.isOpen) {
                                this.trackDynamics(dm);
                                this.setX(dm.x);
                                this.setY(dm.y);
                            }
                        });
                        if (this.switchable.map(n => this['dialogModel' + n]).every(dm => !dm.isOpen)) {
                            this.setX(null);
                            this.setY(null);
                        }
                    }
                }
            });
        });
    }

    trackDynamics(dialogModel) {
        this.disposers.forEach(it => it());
        this.disposers = flatten(this.dynamics.map(prop => {
            return [
                this.addReaction({
                    track: () => this[prop],
                    run: (v) => {
                        const method = 'set' + upperFirst(prop);
                        dialogModel[method](v);
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
        }));
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