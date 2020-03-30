
import {vspacer, vframe, hframe, hbox, filler} from '@xh/hoist/cmp/layout';
import {hoistCmp, creates} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {pickBy} from 'lodash';
import {jsonInput, select, textInput} from '@xh/hoist/desktop/cmp/input';
import {dialog, DialogModel} from '@xh/hoist/desktop/cmp/dialog';
import {Icon} from '@xh/hoist/icon';
import {DialogsPanelModel} from './DialogsPanelModel';
import {stubPanel} from './StubPanel';
import {form} from '@xh/hoist/cmp/form';
import {formField} from '@xh/hoist/desktop/cmp/form';
// import {formPanel} from './content/FormPanel';
import {chartPanel} from './content/ChartPanel';
import {treeMapPanel} from './content/TreeMapPanel';

export const dialogsPanel = hoistCmp.factory({
    model: creates(DialogsPanelModel),
    render() {
        return hframe(managePanel(), presetsPanel(), hostPanel());
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
                side: 'left',
                resizable: false,
                collapsible: false
            },
            item: form({
                fieldDefaults: {
                    inline: true,
                    minimal: true,
                    commitOnChange: true
                },
                items: vframe({
                    padding: 10,
                    items: [
                        formField({
                            field: 'title',
                            item: textInput({...ctrlDefaults})
                        }),
                        formField({
                            field: 'icon',
                            item: select({
                                ...ctrlDefaults,
                                options: ['chartLine', 'dollarSign', 'add']
                            })
                        }),
                        formField({
                            field: 'content',
                            item: select({
                                enableFilter: false,
                                enableClear: false,
                                ...ctrlDefaults,
                                options: ['form', 'chart', 'treeMap']
                            })
                        }),
                        formField({
                            field: 'modelConfig',
                            inline: false,
                            item: jsonInput({
                                ...ctrlDefaults,
                                height: 240,
                                editorProps: {lineNumbers: false}
                            })
                        }),
                        hbox(
                            button({
                                icon: Icon.reset({className: 'xh-red'}),
                                minimal: false,
                                onClick: () => formModel.reset(),
                                disabled: !formModel.isDirty
                            }),
                            filler(),
                            button({
                                text: 'Open New',
                                minimal: false,
                                icon: Icon.add(),
                                onClick: () => model.addStub()
                            })
                        ),
                        vspacer(5),
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
                        const {dialogModel, title, icon} = stub,
                            props = {
                                key: dialogModel.key,
                                title,
                                icon: icon ? Icon[icon]() : null,
                                model: dialogModel
                            };
                        return dialog(pickBy(props));
                    })
                ]
            })
        });
    }
});

const presetsPanel = hoistCmp.factory({
    render({model}) {
        return panel({
            title: 'Presets Panel',
            flex: '0 0 auto',
            item: vframe({
                items: [
                    button({
                        text: 'Resizable Chart (d1)',
                        minimal: false,
                        icon: Icon.chartLine(),
                        onClick: () => d1.open()
                    }),
                    dialog({
                        title: 'Resizable Chart (d1)',
                        icon: Icon.chartLine(),
                        model: d1
                    }),
                    button({
                        text: 'Resizable TreeMap (d2)',
                        minimal: false,
                        icon: Icon.box(),
                        onClick: () => d2.open()
                    }),
                    dialog({
                        title: 'Resizable TreeMap (d2)',
                        icon: Icon.box(),
                        model: d2
                    })
                ]
            })
        });
    }
});

const d1 = new DialogModel({
    'resizable': true,
    'size': {
        'width': 400,
        'height': 600
    },
    content: () => chartPanel()
});

const d2 = new DialogModel({
    'resizable': true,
    'size': {
        'width': 400,
        'height': 600
    },
    content: () => treeMapPanel()
});
