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

    initialConfig = {
        closeOnOutsideClick: true,
        showCloseButton: true,
        closeOnEscape: true,
        draggable: true,
        resizable: true,
        position: {x: 100, y: 100},
        size: {width: 400, height: 600},
        isOpen: true,
        inPortal: false
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
            this.getContent(values.content),
            new DialogModel(JSON.parse(values.modelConfig))
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