import {hoistCmp, creates} from '@xh/hoist/core';
import {grid} from '@xh/hoist/cmp/grid';
import {hframe, filler} from '@xh/hoist/cmp/layout';
import {storeCountLabel, storeFilterField} from '@xh/hoist/cmp/store';
import {button} from '@xh/hoist/mobile/cmp/button';
import {buttonGroupInput} from '@xh/hoist/mobile/cmp/input';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {toolbar} from '@xh/hoist/mobile/cmp/toolbar';

import tileView from './cmp/TileView';
import DirectoryPanelModel from './DirectoryPanelModel';
import '../DirectoryPanel.scss';

const directoryPanel = hoistCmp.factory({
    model: creates(DirectoryPanelModel),

    render({model}) {
        return panel({
            className: 'tb-directory-panel',
            item: hframe(
                panel({
                    tbar: tbar(),
                    item: model.displayMode === 'grid' ? grid() : tileView(),
                    bbar: bbar()
                })
            )
        });
    }
});

const tbar = hoistCmp.factory<DirectoryPanelModel>(({model}) => {
    return toolbar({
        className: 'tb-directory-panel__tbar',
        items: [
            storeFilterField({
                leftIcon: Icon.search(),
                maxWidth: 400,
                minWidth: 200
            }),
            filler(),
            buttonGroupInput({
                outlined: true,
                onChange: value => model.setDisplayMode(value),
                value: model.displayMode,
                intent: 'primary',
                items: [
                    button({
                        icon: Icon.list(),
                        value: 'grid',
                        width: 50
                    }),
                    button({
                        icon: Icon.users(),
                        value: 'tiles',
                        width: 50
                    })
                ]
            })
        ]
    });
});

const bbar = hoistCmp.factory<DirectoryPanelModel>(({model}) => {
    const {
        gridModel: {store}
    } = model;

    return toolbar(filler(), storeCountLabel({store, unit: 'contact'}));
});

export default directoryPanel;
