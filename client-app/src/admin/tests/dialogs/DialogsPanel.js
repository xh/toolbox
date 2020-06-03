
import {vspacer, vframe, vbox, hframe, hbox, filler} from '@xh/hoist/cmp/layout';
import {hoistCmp, creates} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {pickBy} from 'lodash';
import {dialog} from '@xh/hoist/desktop/cmp/dialog';
import {codeInput, select, textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {DialogsPanelModel} from './DialogsPanelModel';
import {stubPanel} from './StubPanel';
import {form} from '@xh/hoist/cmp/form';
import {formField} from '@xh/hoist/desktop/cmp/form';


export const dialogsPanel = hoistCmp.factory({
    model: creates(DialogsPanelModel),
    render() {
        return hframe(managePanel(), hostPanel());
    }
});

const managePanel = hoistCmp.factory({
    render: ({model}) => {
        const {formModel} = model,
            ctrlDefaults = {enableClear: true, placeholder: '[none]'};
        return panel({
            title: 'Create/Manage',
            model: {
                showSplitter: true,
                defaultSize: 400,
                minSize: 400,
                side: 'left',
                resizable: true
            },
            item: form({
                fieldDefaults: {
                    inline: false,
                    minimal: true,
                    commitOnChange: true
                },
                items: vbox({
                    padding: 5,
                    items: [
                        hframe(
                            formField({
                                field: 'icon',
                                width: 120,
                                item: select({
                                    ...ctrlDefaults,
                                    options: ['chartLine', 'dollarSign', 'add']
                                })
                            }),
                            formField({
                                field: 'title',
                                width: 140,
                                item: textInput({...ctrlDefaults})
                            }),
                            formField({
                                field: 'content',
                                width: 120,
                                item: select({
                                    enableFilter: false,
                                    enableClear: false,
                                    ...ctrlDefaults,
                                    options: ['form', 'chart', 'treeMap']
                                })
                            })
                        ),
                        formField({
                            field: 'modelConfig',
                            item: codeInput({
                                ...ctrlDefaults,
                                height: 290,
                                editorProps: {lineNumbers: false},
                                mode: 'javascript'
                            })
                        }),
                        hbox(
                            button({
                                text: 'Preset 1',
                                minimal: false,
                                onClick: () => model.addStub1()
                            }),
                            button({
                                text: 'Preset 2',
                                minimal: false,
                                onClick: () => model.addStub2()
                            }),
                            filler(),
                            button({
                                icon: Icon.reset({className: 'xh-red'}),
                                minimal: false,
                                onClick: () => formModel.reset(),
                                disabled: !formModel.isDirty
                            }),
                            button({
                                text: 'Add from Form',
                                minimal: false,
                                icon: Icon.add(),
                                onClick: () => model.addFormStub()
                            })
                        ),
                        vspacer(7),
                        stubsPanel()
                    ]
                })
            })
        });
    }
});

const stubsPanel = hoistCmp.factory({
    render({model}) {
        return vframe({
            items: [...model.stubs.map(stub => stubPanel({key: stub.xhId, model: stub}))]
        });
    }
});

const hostPanel = hoistCmp.factory({
    render({model}) {
        return panel({
            title: 'Host Panel',
            flex: 1,
            item: vframe({
                items: [
                    ...model.stubs.map(stub => {
                        const {dialogModel, title, icon, content} = stub,
                            props = {
                                key: dialogModel.key,
                                icon: icon ? Icon[icon]() : null,
                                title,
                                model: dialogModel,
                                item: content
                            };
                        return dialog(pickBy(props));
                    })
                ]
            })
        });
    }
});