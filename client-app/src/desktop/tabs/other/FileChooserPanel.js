import React, {Component, Fragment} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {span, filler} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {fileChooser, FileChooserModel} from '@xh/hoist/desktop/cmp/filechooser';
import {pluralize} from '@xh/hoist/utils/js';
import {wrapper} from '../../common/Wrapper';


@HoistComponent
export class FileChooserPanel extends Component {

    chooserModel = new FileChooserModel();

    @bindable
    showFileGrid = true;

    render() {
        const chooserModel = this.chooserModel;

        return wrapper({

            item: panel({
                title: 'Other > FileChooser',
                icon: Icon.copy(),
                width: 500,
                height: 300,
                item: fileChooser({
                    flex: 1,
                    enableMulti: true,
                    showFileGrid: this.showFileGrid,
                    accept: ['.txt', '.png'],
                    targetText: (
                        <Fragment>
                            <p>Drop and drop files here, or click to browse.</p>
                            <p>Note that this example is configured to accept only <code>*.txt</code> and <code>*.png</code> file types.</p>
                        </Fragment>
                    ),
                    model: chooserModel
                }),
                bbar: toolbar(
                    span('Show grid:'),
                    switchInput({
                        model: this,
                        bind: 'showFileGrid'
                    }),
                    filler(),
                    span(`${pluralize('file', chooserModel.files.length, true)} selected`),
                    toolbarSep(),
                    button({
                        text: 'Clear all',
                        intent: 'danger',
                        onClick: () => chooserModel.removeAllFiles()
                    }),
                    button({
                        text: 'Upload',
                        intent: 'primary',
                        onClick: () => this.uploadFiles()
                    })
                )
            })
        });
    }

    uploadFiles() {
        const toUpload = this.chooserModel.files,
            formData = new FormData();

        toUpload.forEach((file, idx) => {
            console.log(file.name);
            formData.append(`file-${idx}`, file, file.name);
        });

        XH.fetch({
            url: 'upload/postFiles',
            method: 'POST',
            body: formData,
            headers: new Headers()
        });
    }

}