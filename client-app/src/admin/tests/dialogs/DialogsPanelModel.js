import {HoistModel, managed, XH} from '@xh/hoist/core';
import {observable, action} from '@xh/hoist/mobx';
import {DialogModel} from '@xh/hoist/desktop/cmp/dialog';

import {without} from 'lodash';
import {StubModel} from './StubModel';
import {FormModel} from '@xh/hoist/cmp/form';

import {formPanel} from './form/FormPanel';
import {oHLCChartPanel} from './chart/OHLCChartPanel';
import {simpleTreeMapPanel} from './chart/SimpleTreeMapPanel';

@HoistModel
export class DialogsPanelModel {

    initialConfig = {
        closeOnOutsideClick: true,
        showCloseButton: true,
        closeOnEscape: true,
        draggable: true,
        width: 600,
        height: 400,
        x: 100,
        y: 100,
        isOpen: true,
        inPortal: false,
        zIndex: true
    };

    @managed
    formModel = new FormModel({
        fields: [
            {name: 'icon', initialValue: 'add'},
            {name: 'content', initialValue: 'form'},
            {name: 'title', initialValue: 'My Dialog'},
            {
                name: 'modelConfig',
                initialValue: JSON.stringify(this.initialConfig, null, '\t')
            }
        ]
    });

    @observable.ref
    stubs = [];

    @action
    addStub() {
        const {values} = this.formModel;
        const newStub = new StubModel(
            values.title,
            values.icon,
            new DialogModel({
                ...JSON.parse(values.modelConfig),
                content: this.getContent()
            })
        );
        this.stubs = [...this.stubs, newStub];
    }

    @action
    removeStub(stub) {
        this.stubs = without(this.stubs, stub);
        XH.safeDestroy(stub);
    }

    //----------------------
    // Implementation
    //----------------------
    getContent() {
        switch (this.formModel.values.content) {
            case 'form': return formPanel;
            case 'chart': return oHLCChartPanel;
            case 'treeMap': return simpleTreeMapPanel;
        }
        return null;
    }

    destroy() {
        XH.safeDestroy(this.stubs);
    }
}