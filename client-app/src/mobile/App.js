import {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {vframe} from '@xh/hoist/cmp/layout';
import {page} from '@xh/hoist/mobile/cmp/page';
import {appBar} from '@xh/hoist/mobile/cmp/header';
import {navigator} from '@xh/hoist/mobile/cmp/navigator';
import {toolbar} from '@xh/hoist/kit/onsen';
import {div, span} from '@xh/hoist/cmp/layout';

import {menuButton} from '@xh/hoist/mobile/cmp/button';



import './App.scss';

@HoistComponent
export class App extends Component {

    render() {
        const {appMenuModel, navigatorModel, dimMenuModel} = this.model;
        return vframe(
            page({
                renderToolbar: () => appBar({
                    appMenuModel,
                    navigatorModel,
                    // rightItems: [menuButton({model: dimMenuModel})],
                    hideRefreshButton: true
                }),
                items: [
                    div(menuButton({model: dimMenuModel})),
                    navigator({model: navigatorModel}),
                ]
            })
        );
    }
}