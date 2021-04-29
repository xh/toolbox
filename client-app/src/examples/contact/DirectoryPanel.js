import {grid} from '@xh/hoist/cmp/grid';
import {filler, p, placeholder, span, vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {button, colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {select, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {PERSIST_APP} from './AppModel';
import {DirectoryPanelModel} from './DirectoryPanelModel';
// import {detailsPanel} from './detail/DetailsPanel';
// import './RecallsPanel.scss';

export const recallsPanel = hoistCmp.factory({
    model: creates(DirectoryPanelModel),

    render({model}) {
        const {currentRecord} = model.detailsPanelModel;

        return vframe(
            panel({
                tbar: tbar(),
                item: grid(),
                mask: 'onLoad'
            }),
            panel({
                title: currentRecord?.data.brandName ?? 'Drug Details',
                icon: Icon.detail(),
                item: currentRecord ? placeholder('current record found') : placeholder('Select a drug above to view its details.'),
                className: 'toolbox-recalls-detail-panel',
                compactHeader: true,
                model: {
                    side: 'bottom',
                    defaultSize: 325,
                    persistWith: PERSIST_APP
                }
            })
        );
    }
});

const tbar = hoistCmp.factory(
    ({model}) => {
        // const aboutBlurb = 'This is a team directory';

        return toolbar({
            style: {backgroundColor: 'transparent'},
            items: [
                textInput({
                    bind: 'searchQuery',
                    placeholder: 'Search by name [or other fields?]',
                    width: 250,
                    commitOnChange: true,
                    enableClear: true
                }),
                toolbarSep(),
                span('Department:'),
                select({
                    bind: 'department',
                    options: [
                        {value: 'placeholder', label: 'Placeholder'}
                    ]
                }),
                toolbarSep(),
                select({
                    bind: 'location',
                    options: [
                        {value: 'placeholder', label: 'Placeholder'}
                    ]
                }),
                filler(),
                button({
                    title: 'About',
                    text: 'About',
                    icon: Icon.questionCircle(),
                    onClick: () => XH.alert({
                        message: p('Placeholder')
                    })
                }),
                toolbarSep(),
                colChooserButton()
            ]
        });
    }
);
