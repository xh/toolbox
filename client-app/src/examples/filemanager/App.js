import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {vframe} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {appBar} from '@xh/hoist/desktop/cmp/appbar';
import {ContextMenuItem, ContextMenuSupport} from '@xh/hoist/desktop/cmp/contextmenu';
import {fileManager} from './FileManager';

@HoistComponent
@ContextMenuSupport
export class App extends Component {

    render() {
        return panel({
            tbar: appBar({
                icon: Icon.file({size: '2x', prefix: 'fal'}),
                title: 'File Manager',
                hideRefreshButton: true
            }),
            item: vframe({
                className: 'xh-tiled-bg',
                justifyContent: 'center',
                alignItems: 'center',
                item: fileManager()
            })
        });
    }

    static getContextMenuItems() {
        const Item = ContextMenuItem;
        return [Item.reloadApp(), Item.about(), Item.logout()];
    }

}
