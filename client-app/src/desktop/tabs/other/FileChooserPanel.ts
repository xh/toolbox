import {box, filler, img, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, lookup, managed, uses, XH} from '@xh/hoist/core';
import {action, bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {button} from '@xh/hoist/desktop/cmp/button';
import {
    fileChooser,
    FileChooserConfig,
    FileChooserModel,
    FileChooserProps
} from '@xh/hoist/desktop/cmp/filechooser';
import {picker, segmentedControl, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {pluralize} from '@xh/hoist/utils/js';
import {isEmpty} from 'lodash';
import {MouseEvent} from 'react';
import {
    demoGrid,
    demoPanel,
    demoPlayground,
    demoRow,
    demoSection,
    fmtDemoConfig,
    raw,
    wrapper,
    wrapperOption,
    wrapperOptionGroup
} from '../../common';

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

/** Render a string array as the literal a developer would write. */
function fmtList(vals: string[]): string {
    return `[${vals.map(v => `'${v}'`).join(', ')}]`;
}

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
                'The rail options vary the accepted types and the size and count limits on the',
                'Playground chooser. Those three are read once at construction, so changing one',
                're-creates its model.',
                '',
                'Below, two compact single-file choosers show use in space-constrained layouts - a',
                'default one, and one with a custom `fileDisplay` image preview.'
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
            options: wrapperOptionGroup({
                label: 'Playground only',
                icon: Icon.experiment(),
                intent: 'primary',
                info: 'Configure the primary instance. The single-file choosers use their own models.',
                items: [
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
                            compact: true,
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
                ]
            }),
            item: demoPanel({
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 440,
                            // The chooser lists its own files and the footer shows the count, so
                            // the standard value readout would be redundant here - and dropping it
                            // keeps the band inside a normal window width.
                            showValue: false,
                            caption: 'Drag files in, or click to browse.',
                            config: [
                                fmtDemoConfig<FileChooserConfig>('new FileChooserModel', {
                                    accept: isEmpty(model.acceptedTypes)
                                        ? undefined
                                        : raw(fmtList(model.acceptedTypes)),
                                    maxFiles: model.maxFiles ?? undefined,
                                    maxFileSize: model.maxFileSize ?? undefined
                                }),
                                fmtDemoConfig<FileChooserProps>('fileChooser', {
                                    model: raw('chooserModel'),
                                    dropTargetPlacement:
                                        model.placement === 'left' ? undefined : model.placement,
                                    className: 'xh-border xh-bg'
                                })
                            ].join('\n\n'),
                            item: configChooser()
                        })
                    }),
                    demoSection({
                        title: 'Single-File Choosers',
                        note: 'The compact single-file mode, for space-constrained layouts.',
                        item: demoGrid({
                            columns: 2,
                            items: [
                                demoRow({
                                    label: 'Default',
                                    info: 'maxFiles: 1, no other configuration',
                                    item: fileChooser({
                                        model: model.basicChooserModel,
                                        height: 220,
                                        width: '100%'
                                    })
                                }),
                                demoRow({
                                    label: 'Custom image preview',
                                    info: 'fileDisplay renders the selected image in place',
                                    item: fileChooser({
                                        model: model.imageChooserModel,
                                        fileDisplay: imagePreview,
                                        height: 220,
                                        width: '100%'
                                    })
                                })
                            ]
                        })
                    })
                ]
            })
        });
    }
});

/**
 * The Playground chooser: the multi-purpose chooser driven by the rail, with its Browse /
 * selected-count / Clear-all actions as a footer toolbar row.
 */
const configChooser = hoistCmp.factory<FileChooserPanelModel>({
    model: uses(() => FileChooserPanelModel),
    render({model}) {
        const {chooserModel, disabled, placement} = model;
        return vbox({
            width: '100%',
            items: [
                fileChooser({
                    model: chooserModel,
                    dropTargetPlacement: placement,
                    // The chooser draws no chrome of its own, which leaves it adrift on the
                    // Playground's tinted ground. The two standard utility classes give it an
                    // edge and an opaque surface, and the snippet discloses them.
                    className: 'xh-border xh-bg',
                    height: 260,
                    width: '100%'
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
    basicChooserModel = new FileChooserModel({maxFiles: 1});

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
