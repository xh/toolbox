import {grid} from '@xh/hoist/cmp/grid';
import {filler, placeholder, hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button, colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, select} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {PERSIST_APP} from './AppModel';
import {detailsPanel} from './detail/DetailsPanel';
import './DirectoryPanel.scss';
import {DirectoryPanelModel} from './DirectoryPanelModel';
import {storeFilterField} from '@xh/hoist/cmp/store';
import {tileView} from './TileView';

export const directoryPanel = hoistCmp.factory({
    model: creates(DirectoryPanelModel),

    render({model}) {
        const {currentRecord, displayMode} = model;

        return panel({
            item: hframe(
                panel({
                    tbar: tbar(),
                    item: displayMode === 'grid' ? grid() : tileView()
                }),
                panel({
                    title: currentRecord?.data.name ?? 'Select a contact',
                    icon: Icon.detail(),
                    item: currentRecord ? detailsPanel() : placeholder('Select a contact to view their details.'),
                    className: 'toolbox-recalls-detail-panel',
                    compactHeader: true,
                    model: {
                        side: 'right',
                        defaultSize: 325,
                        persistWith: PERSIST_APP
                    }
                })
            ),
            mask: 'onLoad'
        });
    }
});

const tbar = hoistCmp.factory(
    ({model}) => {
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
                colChooserButton()
            ]
        });
    }
);
