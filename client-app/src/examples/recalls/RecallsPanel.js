import {hoistCmpFactory, creates, XH} from '@xh/hoist/core';
import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {a, filler, p, span, vframe} from '@xh/hoist/cmp/layout';
import {button, colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {detailsPanel} from './DetailsPanel';
import './RecallsPanel.scss';
import {RecallsPanelModel} from './RecallsPanelModel';

export const recallsPanel = hoistCmpFactory({
    model: creates(RecallsPanelModel),

    render({model}) {
        const {detailsPanelModel} = model,
            {currentRecord} = detailsPanelModel,
            fdaWebsite = 'https://open.fda.gov/apis/drug/enforcement/',
            aboutBlurb = 'This applet uses the openFDA drug enforcement reports API, ' +
                'which provides information on drug recall events since 2004. ' +
                'For more information, see: ';

        return vframe(
            panel({
                item: grid(),
                mask: model.loadModel,
                tbar: [
                    textInput({
                        bind: 'searchQuery',
                        placeholder: 'Keyword Search',
                        commitOnChange: true,
                        enableClear: true
                    }),
                    toolbarSep(),
                    span('Group By : '),
                    buttonGroupInput({
                        bind: 'groupBy',
                        enableClear: true,
                        items: [
                            button({
                                text: 'Class',
                                value: 'classification'
                            }),
                            button({
                                text: 'Brand Name',
                                value: 'brandName'
                            }),
                            button({
                                text: 'Status',
                                value: 'status'
                            }),
                            button({
                                text: 'Recalling Firm',
                                value: 'recallingFirm'
                            })
                        ]
                    }),
                    filler(),
                    gridCountLabel({unit: 'latest recall'}),
                    toolbarSep(),
                    button({
                        title: 'About the API',
                        text: 'About',
                        icon: Icon.questionCircle(),
                        onClick: () => XH.alert({
                            message: p(aboutBlurb, a({href: fdaWebsite, item: fdaWebsite, target: '_blank'}))
                        })
                    }),
                    toolbarSep(),
                    colChooserButton()
                ]
            }),
            panel({
                title: currentRecord ? currentRecord.brandName : 'Select a drug to see its details',
                icon: Icon.detail(),
                item: detailsPanel(),
                className: 'toolbox-recalls-detail-panel',
                compactHeader: true,
                model: {
                    side: 'bottom',
                    defaultSize: 325,
                    prefName: 'recallsPanelConfig'
                }
            })
        );
    }
});
