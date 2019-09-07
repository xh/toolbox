
import {grid, gridCountLabel} from '@xh/hoist/cmp/grid';
import {a, filler, p, span, vframe} from '@xh/hoist/cmp/layout';
import {hoistCmpFactory, localModel, useModel, XH} from '@xh/hoist/core';
import {button, colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {detailsPanel} from './DetailsPanel';
import './RecallsPanel.scss';
import {RecallsPanelModel} from './RecallsPanelModel';

export const recallsPanel = hoistCmpFactory({
    model: localModel(RecallsPanelModel),

    render() {
        const model = useModel(),
            {gridModel, detailsPanelModel} = model,
            {currentRecord} = detailsPanelModel,
            fdaWebsite = 'https://open.fda.gov/apis/drug/enforcement/',
            aboutBlurb = 'This applet uses the openFDA drug enforcement reports API, ' +
                'which provides information on drug recall events since 2004. ' +
                'For more information, see: ';

        return vframe(
            panel({
                item: grid({model: gridModel}),
                mask: model.loadModel,
                tbar: [
                    textInput({
                        model,
                        bind: 'searchQuery',
                        placeholder: 'Keyword Search',
                        commitOnChange: true,
                        enableClear: true
                    }),
                    toolbarSep(),
                    span('Group By : '),
                    buttonGroupInput({
                        model: model,
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
                    gridCountLabel({gridModel, unit: 'latest recall'}),
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
                    colChooserButton({gridModel})
                ]
            }),
            panel({
                title: currentRecord ? currentRecord.brandName : 'Select a drug to see its details',
                icon: Icon.detail(),
                item: detailsPanel({model: detailsPanelModel}),
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
