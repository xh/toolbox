import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {appBar} from '@xh/hoist/desktop/cmp/appbar';
import {ContextMenuSupport, ContextMenuItem} from '@xh/hoist/desktop/cmp/contextmenu';
import {newsPanel} from './NewsPanel';
import {relativeTimestamp} from "@xh/hoist/cmp/relativetimestamp";

@HoistComponent
@ContextMenuSupport
export class App extends Component {

    render() {
        const {model} = this,
            {newsPanelModel} = model;

        return panel({
            tbar: appBar({
                icon: Icon.news({size: '2x', prefix: 'fal'}),
                title: 'News Feed',
                hideRefreshButton: false,
                rightItems: [
                    relativeTimestamp({
                        timestamp: newsPanelModel.lastRefresh,
                        options: {prefix: 'Last Updated:'}
                    })
                ]
            }),
            items: [
                newsPanel({model: newsPanelModel})
            ]
        });
    }

    static getContextMenuItems() {
        const Item = ContextMenuItem;
        return [Item.reloadApp(), Item.about(), Item.logout()];
    }

}
