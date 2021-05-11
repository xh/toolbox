import {grid} from '@xh/hoist/cmp/grid';
import {filler, p, placeholder, hframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
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
import {facebookLayout} from './FacebookLayout';

export const directoryPanel = hoistCmp.factory({
    model: creates(DirectoryPanelModel),

    render({model}) {
        const {currentRecord, displayMode} = model;

        return hframe(
            panel({
                tbar: tbar(),
                item: displayMode === 'details' ? grid() : facebookLayout(),
                mask: 'onLoad'
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
        );
    }
});

const tbar = hoistCmp.factory(
    ({model}) => {
        const aboutBlurb = 'Contact app';

        return toolbar({
            style: {backgroundColor: 'transparent'},
            items: [
                storeFilterField({
                    width: 250,
                    autoApply: false,
                    onFilterChange: (fn) => model.setSearchQuery(fn)
                }),
                toolbarSep(),
                select({
                    bind: 'locationFilter',
                    labelField: 'Location',
                    placeholder: 'Office',
                    enableClear: true,
                    options: [
                        {label: 'New York', value: 'NY'},
                        {label: 'California', value: 'CA'}
                    ]
                }),
                toolbarSep(),
                select({
                    bind: 'departmentFilter',
                    labelField: 'Department',
                    placeholder: 'Department',
                    enableClear: true,
                    options: [
                        {label: 'XH', value: 'XH'}
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
                            value: 'details'
                        }),
                        button({
                            text: 'Faces',
                            value: 'faces'
                        })
                    ]
                }),
                toolbarSep(),
                button({
                    title: 'About the API',
                    text: 'About',
                    icon: Icon.questionCircle(),
                    onClick: () => XH.alert({
                        message: p(aboutBlurb)
                    })
                }),
                toolbarSep(),
                colChooserButton()
            ]
        });
    }
);
