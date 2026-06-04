import {box, filler, img, p, span, vframe, vspacer} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, lookup, managed, uses, XH} from '@xh/hoist/core';
import {action, bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {button} from '@xh/hoist/desktop/cmp/button';
import {fileChooser, FileChooserModel} from '@xh/hoist/desktop/cmp/filechooser';
import {picker, segmentedControl, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {pluralize} from '@xh/hoist/utils/js';
import {isEmpty} from 'lodash';
import {MouseEvent} from 'react';
import {wrapper} from '../../common';
import './FileChooserPanel.scss';

// Use decimal MB so the size hint (formatted via `filesize`, decimal by default) reads cleanly.
const MB = 1_000_000;

const ACCEPT_OPTIONS = [
    '.csv',
    '.doc',
    '.docx',
    '.gif',
    '.jpg',
    '.pdf',
    '.png',
    '.ppt',
    '.pptx',
    '.txt',
    '.xls',
    '.xlsx',
    '.zip'
];

export const fileChooserPanel = hoistCmp.factory({
    model: creates(() => FileChooserPanelModel),

    render() {
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
                ),
                p(
                    'The second example is a single-image chooser that supplies a custom `fileDisplay` to preview the selected PNG in place, with a footer to replace or clear it.'
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
            item: vframe({
                flex: 1,
                width: '100%',
                overflow: 'auto',
                alignItems: 'center',
                items: [configChooserPanel(), vspacer(), imageChooserPanel()]
            })
        });
    }
});

/**
 * Multi-purpose chooser with live controls over accept / limits / target placement.
 */
const configChooserPanel = hoistCmp.factory<FileChooserPanelModel>({
    model: uses(() => FileChooserPanelModel),
    render({model}) {
        const {chooserModel, disabled, placement} = model;
        return panel({
            title: 'Other › FileChooser',
            icon: Icon.copy(),
            className: 'tb-filechooser-example',
            flex: 'none',
            width: 960,
            height: 400,
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
                    width: 90,
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
                    width: 100,
                    hideDropdownIndicator: true,
                    options: [
                        {value: null, label: 'No limit'},
                        {value: MB, label: '1 MB'},
                        {value: 5 * MB, label: '5 MB'},
                        {value: 25 * MB, label: '25 MB'}
                    ]
                }),
                toolbarSep(),
                span('Target:'),
                segmentedControl({
                    bind: 'placement',
                    options: [
                        {value: 'left', label: 'Left'},
                        {value: 'top', label: 'Top'},
                        {value: 'hidden', label: 'Hidden'}
                    ]
                }),
                toolbarSep(),
                span('Disable: '),
                switchInput({bind: 'disabled'})
            ],
            item: fileChooser({model: chooserModel, dropTargetPlacement: placement}),
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
        });
    }
});

/**
 * Single-image chooser demonstrating a custom `fileDisplay` (in-place image preview).
 */
const imageChooserPanel = hoistCmp.factory<FileChooserPanelModel>({
    model: uses(() => FileChooserPanelModel),
    render({model}) {
        return panel({
            title: 'Other › FileChooser - custom image preview',
            icon: Icon.fileImage(),
            className: 'tb-filechooser-example',
            flex: 'none',
            width: 500,
            height: 280,
            item: fileChooser({model: model.imageChooserModel, fileDisplay: imagePreview})
        });
    }
});

/**
 * Custom single-file display: renders the selected image in place, with a footer to replace
 * (drop / click anywhere) or clear it. The object URL is created / revoked via a local model so
 * it is cleaned up on replace and unmount.
 */
const imagePreview = hoistCmp.factory({
    model: creates(() => ImagePreviewModel),
    render({model}) {
        const {objectUrl, chooserModel} = model;
        return panel({
            item: box({
                flex: 1,
                minHeight: 0,
                item: img({
                    src: objectUrl,
                    omit: !objectUrl,
                    // Fill the available area (scaling up small images), preserving aspect ratio.
                    style: {width: '100%', height: '100%', objectFit: 'contain'}
                })
            }),
            bbar: toolbar({
                items: [
                    'Drop or click to replace.',
                    filler(),
                    button({
                        text: 'Remove',
                        icon: Icon.delete(),
                        minimal: true,
                        onClick: (e: MouseEvent) => {
                            // Don't bubble to the drop target and re-open the file dialog.
                            e.stopPropagation();
                            chooserModel.clear();
                        }
                    })
                ]
            })
        });
    }
});

class ImagePreviewModel extends HoistModel {
    @lookup(() => FileChooserModel)
    chooserModel: FileChooserModel;

    @observable
    objectUrl: string = null;

    constructor() {
        super();
        makeObservable(this);
    }

    override onLinked() {
        super.onLinked();
        this.addReaction({
            track: () => this.chooserModel.files[0],
            run: file => this.setObjectUrl(file ? URL.createObjectURL(file) : null),
            fireImmediately: true
        });
    }

    @action
    private setObjectUrl(url: string) {
        if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
        this.objectUrl = url;
    }

    override destroy() {
        if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
        super.destroy();
    }
}

class FileChooserPanelModel extends HoistModel {
    @bindable
    disabled = false;

    @bindable.ref
    acceptedTypes: string[] = ['.png', '.txt'];

    @bindable
    maxFiles: number = null;

    @bindable
    maxFileSize: number = null;

    @bindable
    placement: 'left' | 'top' | 'hidden' = 'left';

    @managed
    @observable.ref
    chooserModel: FileChooserModel;

    @managed
    imageChooserModel = new FileChooserModel({accept: ['.png'], maxFiles: 1});

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
