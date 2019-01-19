import {filler} from '@xh/hoist/cmp/layout';
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon/';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {fileChooser} from '@xh/hoist/desktop/cmp/filechooser';
import {grid} from '@xh/hoist/cmp/grid';
import {wrapper} from '../../../common';
import {FileManagerModel} from './FileManagerModel';
import './FileManager.scss';

@HoistComponent
export class FileManager extends Component {

    model = new FileManagerModel();

    render() {
        const model = this.model,
            gridModel = model.gridModel,
            chooserModel = model.chooserModel;

        return wrapper({
            description: [
                <p>
                    This admin-only panel shows a simple, full-stack pattern for listing files from
                    the server and providing UI elements to view, delete, and upload. See the
                    corresponding server-side controller and service classes to review how file
                    uploads can be extracted from the request and processed.
                </p>,
                <p>
                    Restricted to admins to avoid exposing file upload capabilities on the public
                    Toolbox instances.
                </p>
            ],
            item: [
                panel({
                    title: 'File Manager',
                    icon: Icon.fileArchive(),
                    className: 'file-manager',
                    mask: model.loadMaskModel,
                    width: 700,
                    height: 500,
                    items: [
                        grid({model: gridModel}),
                        fileChooser({
                            model: chooserModel,
                            showFileGrid: false,
                            targetText: 'Drag-and-drop new files here to queue for upload, or click to browse.',
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

    async loadAsync() {
        return this.model.loadAsync();
    }


}