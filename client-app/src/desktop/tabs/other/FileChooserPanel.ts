import {box, filler, img, span, vframe} from '@xh/hoist/cmp/layout';
import {card} from '@xh/hoist/cmp/card';
import {creates, hoistCmp, HoistModel, lookup, managed, uses, XH} from '@xh/hoist/core';
import {action, bindable, observable} from '@xh/hoist/mobx';
import {button} from '@xh/hoist/desktop/cmp/button';
import {fileChooser, FileChooserModel} from '@xh/hoist/desktop/cmp/filechooser';
import {picker, segmentedControl, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {pluralize} from '@xh/hoist/utils/js';
import {isEmpty} from 'lodash';
import {MouseEvent} from 'react';
import {wrapper, wrapperOption} from '../../common';
import './FileChooserPanel.scss';

// Use decimal MB so the size hint (formatted via `filesize`, decimal by default) reads cleanly.
const MB = 1_000_000;

// Cap the (equal-sized) cards so they stay balanced rather than stretching edge-to-edge on a wide
// screen; below this they flex to fill the centered demo region.
const CARD_MAX_WIDTH = 880;

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

    render({model}) {
        return wrapper({
            title: 'FileChooser',
            icon: Icon.copy(),
            description: [
                '`FileChooser` selects files from the local filesystem, wrapping the react-dropzone',
                'library for both drag-and-drop and click-to-browse. It can also show a grid (on by',
                'default) listing the selected files for removal.',
                '',
                'Provide it a `FileChooserModel`, which holds the observable file collection and the',
                'API to manipulate it. Your app processes the files (e.g. uploads them) and clears',
                'the selection when done.',
                '',
                'Use the Options below to vary the accepted types and size/count limits on the',
                'configurable chooser above; changing a limit re-creates the chooser.',
                '',
                'The lower card pairs two compact single-file choosers - a default minimal one and',
                'one with a custom `fileDisplay` image preview - showing use in space-constrained',
                'layouts.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/FileChooserPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/filechooser/FileChooser.ts',
                    notes: 'Hoist component for selecting and queuing files for upload.'
                },
                {
                    url: '$HR/desktop/cmp/filechooser/FileChooserModel.ts',
                    notes: 'Holds the observable file selection and its public API.'
                },
                {
                    url: 'https://react-dropzone.js.org/',
                    text: 'react-dropzone',
                    notes: 'The underlying drag-and-drop file selection library.'
                }
            ],
            options: [
                wrapperOption({
                    label: 'Accept',
                    propName: 'FileChooserConfig.accept',
                    control: picker({
                        model,
                        bind: 'acceptedTypes',
                        enableMulti: true,
                        enableClear: true,
                        enableSelectAll: true,
                        displayNoun: 'type',
                        placeholder: 'Any type',
                        width: 180,
                        multiSelectShowCount: true,
                        multiSelectButtonStyle: 'values',
                        options: ACCEPT_OPTIONS
                    }),
                    info: 'Allowed extensions or MIME types.'
                }),
                wrapperOption({
                    label: 'Max files',
                    propName: 'FileChooserConfig.maxFiles',
                    control: select({
                        model,
                        bind: 'maxFiles',
                        width: 110,
                        hideDropdownIndicator: true,
                        options: [
                            {value: null, label: 'No limit'},
                            {value: 1, label: '1'},
                            {value: 3, label: '3'},
                            {value: 10, label: '10'}
                        ]
                    })
                }),
                wrapperOption({
                    label: 'Max size',
                    propName: 'FileChooserConfig.maxFileSize',
                    control: select({
                        model,
                        bind: 'maxFileSize',
                        width: 110,
                        hideDropdownIndicator: true,
                        options: [
                            {value: null, label: 'No limit'},
                            {value: MB, label: '1 MB'},
                            {value: 5 * MB, label: '5 MB'},
                            {value: 25 * MB, label: '25 MB'}
                        ]
                    })
                }),
                wrapperOption({
                    label: 'Target',
                    propName: 'FileChooserProps.dropTargetPlacement',
                    control: segmentedControl({
                        model,
                        bind: 'placement',
                        options: [
                            {value: 'left', label: 'Left'},
                            {value: 'top', label: 'Top'},
                            {value: 'hidden', label: 'Hidden'}
                        ]
                    })
                }),
                wrapperOption({
                    label: 'Disable',
                    propName: 'FileChooserModel.disabled',
                    control: switchInput({model, bind: 'disabled'})
                })
            ],
            item: vframe({
                flex: 1,
                width: '100%',
                alignItems: 'center',
                gap: 12,
                items: [configChooserCard(), singleFileCard()]
            })
        });
    }
});

/**
 * Top card: the multi-purpose chooser with live controls over accept / limits / target placement,
 * filling the card with its Browse / selected-count / Clear-all actions as a footer toolbar row.
 */
const configChooserCard = hoistCmp.factory<FileChooserPanelModel>({
    model: uses(() => FileChooserPanelModel),
    render({model}) {
        const {chooserModel, disabled, placement} = model;
        return card({
            title: 'Configurable Chooser',
            icon: Icon.copy(),
            className: 'tb-filechooser-card',
            flex: 1,
            width: '100%',
            maxWidth: CARD_MAX_WIDTH,
            contentBoxProps: {flexDirection: 'column', flex: 1},
            items: [
                fileChooser({
                    flex: 1,
                    model: chooserModel,
                    dropTargetPlacement: placement
                }),
                toolbar({
                    items: [
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
            ]
        });
    }
});

/**
 * Bottom card (same footprint as the top): pairs two deliberately compact single-file choosers
 * side by side - a default chooser in its minimal single-file mode, and one with a custom in-place
 * image preview. Each is captioned with a lightweight nested-card legend rather than a panel header.
 */
const singleFileCard = hoistCmp.factory({
    render() {
        return card({
            title: 'Single-File Choosers',
            icon: Icon.file(),
            className: 'tb-filechooser-card',
            flex: 1,
            width: '100%',
            maxWidth: CARD_MAX_WIDTH,
            contentBoxProps: {flexDirection: 'row', flex: 1, gap: 16},
            items: [basicChooserCard(), imageChooserCard()]
        });
    }
});

/**
 * Default single-file chooser - no extra configuration, shown as-is in single-file mode. Captioned
 * with a light legend title rather than a panel header.
 */
const basicChooserCard = hoistCmp.factory<FileChooserPanelModel>({
    model: uses(() => FileChooserPanelModel),
    render({model}) {
        return card({
            title: 'Default',
            className: 'tb-filechooser-card',
            flex: 1,
            contentBoxProps: {flex: 1},
            item: fileChooser({flex: 1, model: model.basicChooserModel})
        });
    }
});

/**
 * Single-image chooser demonstrating a custom `fileDisplay` (in-place image preview). Captioned
 * with a light legend title rather than a panel header.
 */
const imageChooserCard = hoistCmp.factory<FileChooserPanelModel>({
    model: uses(() => FileChooserPanelModel),
    render({model}) {
        return card({
            title: 'Custom image preview',
            className: 'tb-filechooser-card',
            flex: 1,
            contentBoxProps: {flex: 1},
            item: fileChooser({flex: 1, model: model.imageChooserModel, fileDisplay: imagePreview})
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
    accessor objectUrl: string = null;

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
    accessor disabled = false;

    @bindable.ref
    accessor acceptedTypes: string[] = ['.png', '.txt'];

    @bindable accessor maxFiles: number = null;

    @bindable accessor maxFileSize: number = null;

    @bindable accessor placement: 'left' | 'top' | 'hidden' = 'left';

    @managed
    @observable.ref
    accessor chooserModel: FileChooserModel;

    @managed
    basicChooserModel = new FileChooserModel({maxFiles: 1});

    @managed
    imageChooserModel = new FileChooserModel({accept: ['.png'], maxFiles: 1});

    constructor() {
        super();
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
