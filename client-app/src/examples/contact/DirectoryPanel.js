import {grid} from '@xh/hoist/cmp/grid';
import {filler, hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button, colChooserButton, exportButton} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {detailsPanel} from './detail/DetailsPanel';
import './DirectoryPanel.scss';
import {DirectoryPanelModel} from './DirectoryPanelModel';
import {storeCountLabel, storeFilterField} from '@xh/hoist/cmp/store';
import {tileView} from './TileView';

export const directoryPanel = hoistCmp.factory({
    model: creates(DirectoryPanelModel),

    render({model}) {
        const {displayMode} = model;

        return panel({
            item: hframe(
                panel({
                    tbar: tbar(),
                    item: displayMode === 'grid' ? grid() : tileView(),
                    bbar: bbar()
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
        const {locationList, tagList} = model;

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
                    placeholder: 'Location',
                    enableClear: true,
                    options: locationList.map(loc => ({value: loc}))
                }),
                toolbarSep(),
                select({
                    bind: 'tagFilters',
                    placeholder: 'Tags',
                    enableMulti: true,
                    enableClear: true,
                    options: tagList.map(tag => ({value: tag}))
                }),
                filler(),
                buttonGroupInput({
                    bind: 'displayMode',
                    outlined: true,
                    intent: 'primary',
                    items: [
                        button({
                            text: 'Details',
                            value: 'grid',
                            width: 80
                        }),
                        button({
                            text: 'Faces',
                            value: 'tiles',
                            width: 80
                        })
                    ]
                })                
            ]
        });
    }
);

const bbar = hoistCmp.factory(
    ({model}) => {
        const {displayMode, gridModel} = model;
        const {store} = gridModel;

        return toolbar({
            className: 'directory-panel-toolbar',
            items: [
                filler(),
                storeCountLabel({store, unit: 'XH Engineers'}),
                toolbarSep(),
                colChooserButton({
                    disabled: !(displayMode === 'grid')
                }),
                toolbarSep(),
                exportButton()
            ]
        });
    });
