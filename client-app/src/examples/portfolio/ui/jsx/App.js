import React from 'react';
import {hoistCmp, uses} from '@xh/hoist/core';
import {Panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AppBar, AppBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {ContextMenuItem as CM} from '@xh/hoist/desktop/cmp/contextmenu';
import {WebSocketIndicator} from '@xh/hoist/cmp/websocket';

import {PortfolioPanel} from './PortfolioPanel';
import {AppModel} from '../../AppModel';

export const App = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        const tbar = <AppBar
            icon={Icon.portfolio({size: '2x', prefix: 'fal'})}
            title='Portfolio'
            hideRefreshButton={false}
            rightItems={[
                Icon.code({title: 'Rendered with JSX'}),
                <WebSocketIndicator iconOnly={true} marginRight={4}/>,
                <AppBarSeparator/>
            ]}
        />;

        return <Panel
            contextMenu={[CM.reloadApp(), CM.about(), CM.logout()]}
            tbar={tbar}
        >
            <PortfolioPanel/>
        </Panel>;
    }
});
