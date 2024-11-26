import React, {Fragment} from 'react';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {filler, span} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {fileChooser, FileChooserModel} from '@xh/hoist/desktop/cmp/filechooser';
import {pluralize} from '@xh/hoist/utils/js';
import {wrapper} from '../../common';

export const fileChooserPanel = hoistCmp.factory({
    model: creates(() => FileChooserPanelModel),

    render({model}) {
        const {chooserModel, enableMulti, enableAddMulti, showFileGrid} = model;

        return wrapper({
            description: [
                <p>
                    A component to select one or more files from the local filesystem. Wraps the
                    third-party react-dropzone component to provide both drag-and-drop and
                    click-to-browse file selection. Expands upon this core functionality with an
                    optional grid (enabled by default) displaying the list of selected files and
                    allowing the user to remove files from the selection.
                </p>,
                <p>
                    This component should be provided with a FileChooserModel instance, as the model
                    holds an observable collection of File objects and provides a public API to
                    manipulate the selection. The application is responsible for processing the
                    selected files (e.g. by uploading them to a server) and clearing the selection
                    when complete.
                </p>
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/FileChooserPanel.tsx',
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
                width: 700,
                height: 400,
                item: fileChooser({
                    flex: 1,
                    enableMulti,
                    enableAddMulti,
                    showFileGrid,
                    accept: {
                        'image/png': ['.png'],
                        'text/plain': ['.txt']
                    },
                    targetText: (
                        <Fragment>
                            <p>Drag and drop files here, or click to browse.</p>
                            <p>
                                Note that this example is configured to accept only{' '}
                                <code>*.txt</code> and <code>*.png</code> file types.
                            </p>
                        </Fragment>
                    ),
                    model: chooserModel
                }),
                bbar: [
                    span('Show grid:'),
                    switchInput({
                        bind: 'showFileGrid'
                    }),
                    toolbarSep(),
                    span('Enable Multiple:'),
                    switchInput({
                        bind: 'enableMulti'
                    }),
                    span('Enable Bulk Addition: '),
                    switchInput({
                        bind: 'enableAddMulti'
                    }),
                    filler(),
                    span(`${pluralize('file', chooserModel.files.length, true)} selected`),
                    toolbarSep(),
                    button({
                        text: 'Clear all',
                        intent: 'danger',
                        onClick: () => chooserModel.removeAllFiles()
                    })
                ]
            })
        });
    }
});

class FileChooserPanelModel extends HoistModel {
    @managed
    chooserModel = new FileChooserModel();

    @bindable
    enableMulti = true;

    @bindable
    enableAddMulti = true;

    @bindable
    showFileGrid = true;

    constructor() {
        super();
        makeObservable(this);
    }
}
