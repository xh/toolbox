import {creates, hoistCmp, HoistModel, managed, XH} from '@xh/hoist/core';
import {action, bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {filler, p, span} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {picker, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {fileChooser, FileChooserModel} from '@xh/hoist/desktop/cmp/filechooser';
import {pluralize} from '@xh/hoist/utils/js';
import {isEmpty} from 'lodash';
import {wrapper} from '../../common';

// Use decimal MB so the size hint (formatted via `filesize`, decimal by default) reads cleanly.
const MB = 1_000_000;

const ACCEPT_OPTIONS = [
    '.png',
    '.jpg',
    '.gif',
    '.txt',
    '.csv',
    '.pdf',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
    '.zip'
];

export const fileChooserPanel = hoistCmp.factory({
    model: creates(() => FileChooserPanelModel),

    render({model}) {
        const {chooserModel, disabled} = model;

        return wrapper({
            description: [
                p(
                    'A component to select one or more files from the local filesystem. Wraps the third-party react-dropzone component to provide both drag-and-drop and click-to-browse file selection. Expands upon this core functionality with an optional grid (enabled by default) displaying the list of selected files and allowing the user to remove files from the selection.'
                ),
                p(
                    'This component should be provided with a FileChooserModel instance, as the model holds an observable collection of File objects and provides a public API to manipulate the selection. The application is responsible for processing the selected files (e.g. by uploading them to a server) and clearing the selection when complete.'
                ),
                p(
                    'Use the controls below to vary the accepted types and size/count limits - the empty-state hint updates to summarize the active configuration. Changing a limit re-creates the chooser, clearing any current selection.'
                )
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/FileChooserPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/filechooser/FileChooser.ts',
                    notes: 'Hoist component for selecting and queuing files for upload.'
                }
            ],
            item: panel({
                title: 'Other › FileChooser',
                icon: Icon.copy(),
                width: 820,
                height: 440,
                tbar: [
                    span('Accept:'),
                    picker({
                        bind: 'acceptedTypes',
                        enableMulti: true,
                        enableClear: true,
                        enableSelectAll: true,
                        displayNoun: 'type',
                        placeholder: 'Any type',
                        width: 200,
                        multiSelectShowCount: true,
                        multiSelectButtonStyle: 'values',
                        options: ACCEPT_OPTIONS
                    }),
                    toolbarSep(),
                    span('Max files:'),
                    select({
                        bind: 'maxFiles',
                        width: 110,
                        hideDropdownIndicator: true,
                        options: [
                            {value: null, label: 'No limit'},
                            {value: 1, label: '1'},
                            {value: 3, label: '3'},
                            {value: 10, label: '10'}
                        ]
                    }),
                    toolbarSep(),
                    span('Max size:'),
                    select({
                        bind: 'maxFileSize',
                        width: 120,
                        hideDropdownIndicator: true,
                        options: [
                            {value: null, label: 'No limit'},
                            {value: MB, label: '1 MB'},
                            {value: 5 * MB, label: '5 MB'},
                            {value: 25 * MB, label: '25 MB'}
                        ]
                    }),
                    toolbarSep(),
                    span('Disable: '),
                    switchInput({
                        bind: 'disabled'
                    })
                ],
                item: fileChooser({model: chooserModel}),
                bbar: [
                    button({
                        disabled,
                        outlined: true,
                        text: 'Browse',
                        icon: Icon.arrowUpFromBracket({intent: 'primary'}),
                        onClick: () => chooserModel.openFileBrowser()
                    }),
                    filler(),
                    span(`${pluralize('file', chooserModel.files.length, true)} selected`),
                    toolbarSep(),
                    button({
                        text: 'Clear all',
                        intent: 'danger',
                        onClick: () => chooserModel.clear()
                    })
                ]
            })
        });
    }
});

class FileChooserPanelModel extends HoistModel {
    @bindable
    disabled = false;

    @bindable.ref
    acceptedTypes: string[] = ['.png', '.txt'];

    @bindable
    maxFiles: number = null;

    @bindable
    maxFileSize: number = null;

    @managed
    @observable.ref
    chooserModel: FileChooserModel;

    constructor() {
        super();
        makeObservable(this);
        this.createChooserModel();

        // Re-create the chooser whenever a configured limit changes - accept / maxFiles /
        // maxFileSize are read once at construction, so a fresh model is needed to apply them.
        this.addReaction({
            track: () => [this.acceptedTypes, this.maxFiles, this.maxFileSize],
            run: () => this.createChooserModel()
        });

        this.addReaction({
            track: () => this.disabled,
            run: disabled => (this.chooserModel.disabled = disabled)
        });
    }

    @action
    private createChooserModel() {
        XH.safeDestroy(this.chooserModel);
        this.chooserModel = new FileChooserModel({
            accept: isEmpty(this.acceptedTypes) ? null : this.acceptedTypes,
            maxFiles: this.maxFiles,
            maxFileSize: this.maxFileSize
        });
        this.chooserModel.disabled = this.disabled;
    }
}
