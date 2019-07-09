import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {appBar} from '@xh/hoist/desktop/cmp/appbar';
import {ContextMenuSupport, ContextMenuItem} from '@xh/hoist/desktop/cmp/contextmenu';
import {newsPanel} from './NewsPanel';

@HoistComponent
@ContextMenuSupport
export class App extends Component {

    render() {
        return panel({
            tbar: appBar({
                icon: Icon.news({size: '2x', prefix: 'fal'}),
                title: 'News Feed',
                hideRefreshButton: true
            }),
            item: newsPanel()
        });
    }

    static getContextMenuItems() {
        const Item = ContextMenuItem;
        return [Item.reloadApp(), Item.about(), Item.logout()];
    }

}
