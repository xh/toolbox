import {HoistModel, managed, XH} from '@xh/hoist/core';
import {observable, action} from '@xh/hoist/mobx';
import {DialogModel} from '@xh/hoist/desktop/cmp/dialog';

import {without} from 'lodash';
import {StubModel} from './StubModel';
import {FormModel} from '@xh/hoist/cmp/form';

import {formPanel} from './content/FormPanel';
import {chartPanel} from './content/ChartPanel';
import {treeMapPanel} from './content/TreeMapPanel';

@HoistModel
export class DialogsPanelModel {

    initialModelConfig = `{
        resizable: true,
        draggable: true,
        // closeOnOutsideClick: false,
        // closeOnEscape: false,
        // showCloseButton: false,
        // showBackgroundMask: false,
        inPortal: false, 
       
        // size: {width: 400, height: 600},     
        // position: {x: 100, y: 100},
        // isOpen: false,
        // isMaximized: true
}`;

    @managed
    formModel = new FormModel({
        fields: [
            {name: 'icon', initialValue: 'add'},
            {name: 'content', initialValue: 'form'},
            {name: 'title', initialValue: 'My Dialog'},
            {
                name: 'modelConfig',
                initialValue: this.initialModelConfig
            }
        ]
    });

    @observable.ref
    stubs = [];

    addFormStub() {
        const {values} = this.formModel;
        this.addStub(
            values.title,
            values.icon,
            this.getContent(values.content),
            new DialogModel(eval('('+ values.modelConfig + ')'))
        );
    }

    @action
    addStub(...args) {
        this.stubs = [...this.stubs, new StubModel(...args)];
    }

    @action
    removeStub(stub) {
        this.stubs = without(this.stubs, stub);
        XH.safeDestroy(stub);
    }

    //--------------------
    // Some Useful presets
    //--------------------
    addStub1() {
        this.addStub(
            'Resizable TreeMap (s1)',
            'box',
            treeMapPanel(),
            new DialogModel({
                resizable: true,
                inPortal: false,
                size: {
                    width: 400,
                    height: 600
                }
            })
        );
    }

    addStub2() {
        this.addStub(
            'Resizable Chart (s1)',
            'chartLine',
            chartPanel(),
            new DialogModel({
                resizable: true,
                inPortal: false,
                size: {
                    width: 400,
                    height: 600
                }
            })
        );
    }

    //----------------------
    // Implementation
    //----------------------
    getContent() {
        switch (this.formModel.values.content) {
            case 'form': return formPanel();
            case 'chart': return chartPanel();
            case 'treeMap': return treeMapPanel();
        }
        return null;
    }

    destroy() {
        XH.safeDestroy(this.stubs);
    }
}