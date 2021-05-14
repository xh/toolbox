import {grid} from '@xh/hoist/cmp/grid';
import {filler, hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button, colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {detailsPanel} from './detail/DetailsPanel';
import './DirectoryPanel.scss';
import {DirectoryPanelModel} from './DirectoryPanelModel';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {tileView} from './TileView';

export const directoryPanel = hoistCmp.factory({
    model: creates(DirectoryPanelModel),

    render({model}) {
        const {displayMode} = model;

        return panel({
            item: hframe(
                panel({
                    tbar: tbar(),
                    item: displayMode === 'grid' ? grid() : tileView()
                }),
                detailsPanel({
                    className: 'xh-border-left'
                })
            ),
            mask: 'onLoad'
        });
    }
});

const tbar = hoistCmp.factory(
    ({model}) => {
        const {displayMode} = model;

        return toolbar({
            className: 'directory-panel-toolbar',
            items: [
                storeFilterField({
                    width: 250,
                    autoApply: false,
                    onFilterChange: (fn) => model.setSearchQuery(fn)
                }),
                toolbarSep(),
                select({
                    bind: 'locationFilter',
                    placeholder: 'Office',
                    enableClear: true,
                    options: [
                        {label: 'New York', value: 'NY'},
                        {label: 'California', value: 'CA'},
                        {label: 'Maine', value: 'ME'},
                        {label: 'United Kingdom', value: 'UK'},
                        {label: 'Canada', value: 'CAN'}
                    ]
                }),
                toolbarSep(),
                switchInput({
                    label: model.showFavoritesOnly ? 'Show All' : 'Show Favorites',
                    bind: 'showFavoritesOnly'
                }),
                filler(),
                buttonGroupInput({
                    bind: 'displayMode',
                    outlined: true,
                    intent: 'primary',
                    items: [
                        button({
                            text: 'Details',
                            value: 'grid'
                        }),
                        button({
                            text: 'Faces',
                            value: 'tiles'
                        })
                    ]
                }),
                toolbarSep(),
                colChooserButton({
                    disabled: !(displayMode === 'grid')
                })
            ]
        });
    }
);
