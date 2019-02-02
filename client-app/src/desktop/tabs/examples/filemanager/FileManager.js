import {filler, fragment} from '@xh/hoist/cmp/layout';
import React, {Component} from 'react';
import {HoistComponent, LoadSupport} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon/';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {fileChooser} from '@xh/hoist/desktop/cmp/filechooser';
import {grid} from '@xh/hoist/cmp/grid';
import {wrapper} from '../../../common';
import {FileManagerModel} from './FileManagerModel';
import './FileManager.scss';

@HoistComponent
@LoadSupport
export class FileManager extends Component {

    model = new FileManagerModel();

    render() {
        const {model} = this,
            {gridModel, chooserModel} = model;

        return wrapper({
            description: [
                <p>
                    This admin-only panel shows a simple, full-stack pattern for listing files from
                    the server and providing UI elements to view, delete, and upload. See the
                    corresponding server-side controller and service classes to review how file
                    uploads can be extracted from the request and processed within Grails.
                </p>,
                <p>
                    Note that in this usage, the <code>FileChooser</code> component is configured
                    not to show its built-in grid for pending uploads, as those are mixed into the
                    main grid here alongside files already on the server. See
                    the <a href="/app/other/fileChooser">dedicated component example</a> to review
                    its capabilities.
                </p>,
                <p>
                    <strong>This example is visible only to admins</strong> to avoid
                    enabling arbitrary file uploads on public Toolbox instances.
                </p>
            ],
            item: [
                panel({
                    title: 'File Manager',
                    icon: Icon.folder(),
                    className: 'file-manager',
                    mask: model.loadMaskModel,
                    width: 700,
                    height: 500,
                    items: [
                        grid({model: gridModel}),
                        fileChooser({
                            model: chooserModel,
                            accept: this.getAcceptedFileTypes(),
                            showFileGrid: false,
                            targetText: fragment(
                                <p>Drag-and-drop new files here to queue for upload, or click to browse.</p>,
                                <p>(Note that not all file types will be accepted.)</p>
                            ),
                            height: 150
                        })
                    ],
                    bbar: toolbar({
                        items: [
                            button({
                                text: 'Reset',
                                icon: Icon.reset(),
                                disabled: !model.pendingChangeCount,
                                onClick: () => model.reset()
                            }),
                            filler(),
                            button({
                                text: 'Download',
                                icon: Icon.download(),
                                disabled: !model.enableDownload,
                                onClick: () => model.downloadSelectedAsync()
                            }),
                            toolbarSep(),
                            button({
                                text: 'Sync Changes to Server',
                                icon: Icon.upload(),
                                intent: 'success',
                                disabled: !model.pendingChangeCount,
                                onClick: () => model.saveAsync()
                            })
                        ]
                    })
                })
            ]
        });
    }

    // Entire example is limited to admins, but still limit to arbitrary-but-reasonable list of
    // accepted file types for sanity (and to demo the `accepts` prop).
    getAcceptedFileTypes() {
        return [
            '.txt',
            '.png',
            '.gif',
            '.jpg',
            '.doc',
            '.docx',
            '.xls',
            '.xlsx',
            '.ppt',
            '.pptx',
            '.pdf'
        ];
    }
}