import {HoistModel, managed} from '@xh/hoist/core';
import { DialogModel } from '@xh/hoist/desktop/cmp/dialog';
import {bindable} from '@xh/hoist/mobx';

import {formPanel} from './form/FormPanel';
import {oHLCChartPanel} from './chart/OHLCChartPanel';
import {simpleTreeMapPanel} from './chart/SimpleTreeMapPanel';

@HoistModel
export class DialogsPanelModel {

    @bindable showBackgroundMask = true;
    @bindable closeOnOutsideClick = true;
    @bindable showCloseButton = true;
    @bindable closeOnEscape = true;

    switchable = [4, 5, 6, 7, 8, 9];

    constructor() {
        this.addReaction({
            track: () => this.showCloseButton,
            run: (v) => {
                this.switchable.forEach(n => {
                    this['dialogModel' + n].setShowCloseButton(v);
                });
            }
        });
        this.addReaction({
            track: () => this.showBackgroundMask,
            run: (v) => {
                this.switchable.forEach(n => {
                    this['dialogModel' + n].setShowBackgroundMask(v);
                });
            }
        });
        this.addReaction({
            track: () => this.closeOnOutsideClick,
            run: (v) => {
                this.switchable.forEach(n => {
                    this['dialogModel' + n].setCloseOnOutsideClick(v);
                });
            }
        });
        this.addReaction({
            track: () => this.closeOnEscape,
            run: (v) => {
                this.switchable.forEach(n => {
                    this['dialogModel' + n].setCloseOnEscape(v);
                });
            }
        });
    }

    @bindable isOpen10 = false;
    @bindable isOpen11 = false;
    @bindable isOpen12 = false;
    @bindable isOpen13 = false;

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
}