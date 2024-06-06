import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {a, filler, p, placeholder, span, vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {button, colChooserButton, printGridButton} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {PERSIST_APP} from './AppModel';
import {detailsPanel} from './detail/DetailsPanel';
import './RecallsPanel.scss';
import {RecallsPanelModel} from './RecallsPanelModel';

export const recallsPanel = hoistCmp.factory({
    model: creates(RecallsPanelModel),

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
                item: currentRecord
                    ? detailsPanel()
                    : placeholder('Select a drug above to view its details.'),
                className: 'tb-recalls-detail-panel',
                compactHeader: true,
                modelConfig: {
                    side: 'bottom',
                    defaultSize: 325,
                    persistWith: PERSIST_APP,
                    printSupport: true
                }
            })
        );
    }
});

const tbar = hoistCmp.factory(() => {
    const aboutBlurb =
            'This applet uses the openFDA drug enforcement reports API, ' +
            'which provides information on drug recall events since 2004. ' +
            'For more information, see: ',
        fdaWebsite = 'https://open.fda.gov/apis/drug/enforcement/';

    return toolbar({
        style: {backgroundColor: 'transparent'},
        items: [
            textInput({
                bind: 'searchQuery',
                placeholder: 'Keyword Search',
                width: 250,
                commitOnChange: true,
                enableClear: true
            }),
            toolbarSep(),
            span('Group By:'),
            buttonGroupInput({
                bind: 'groupBy',
                enableClear: true,
                outlined: true,
                items: [
                    button({text: 'Class', value: 'classification'}),
                    button({text: 'Brand Name', value: 'brandName'}),
                    button({text: 'Status', value: 'status'}),
                    button({text: 'Recalling Firm', value: 'recallingFirm'})
                ]
            }),
            filler(),
            gridCountLabel({unit: 'latest recall'}),
            toolbarSep(),
            button({
                title: 'About the API',
                text: 'About',
                icon: Icon.questionCircle(),
                onClick: () =>
                    XH.alert({
                        message: p(
                            aboutBlurb,
                            a({href: fdaWebsite, item: fdaWebsite, target: '_blank'})
                        )
                    })
            }),
            toolbarSep(),
            colChooserButton(),
            printGridButton()
        ]
    });
});
