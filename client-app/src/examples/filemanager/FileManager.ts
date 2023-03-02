import {filler, fragment, p} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon/';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {fileChooser} from '@xh/hoist/desktop/cmp/filechooser';
import {grid} from '@xh/hoist/cmp/grid';
import {FileManagerModel} from './FileManagerModel';
import './FileManager.scss';

export const fileManager = hoistCmp.factory({
    model: creates(FileManagerModel),

    render({model}) {
        return panel({
            title: 'File Manager',
            icon: Icon.folder(),
            className: 'file-manager',
            mask: 'onLoad',
            width: 700,
            height: 500,
            items: [
                grid(),
                fileChooser({
                    accept: acceptedFileTypes,
                    showFileGrid: false,
                    targetText: fragment(
                        p('Drag-and-drop new files here to queue for upload, or click to browse.'),
                        p('(Note that not all file types will be accepted.)')
                    ),
                    height: 150
                })
            ],
            bbar: [
                button({
                    text: 'Reset',
                    icon: Icon.reset(),
                    disabled: !model.pendingChangeCount,
                    onClick: () => model.resetAndLoadAsync()
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
        });
    }
});

// Entire example is limited to admins, but still limit to arbitrary-but-reasonable list of
// accepted file types for sanity (and to demo the `accepts` prop).
const acceptedFileTypes: string[] = [
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
