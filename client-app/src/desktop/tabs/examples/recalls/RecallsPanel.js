/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {HoistComponent, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {grid} from '@xh/hoist/cmp/grid';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {button, colChooserButton} from '@xh/hoist/desktop/cmp/button';
import {storeCountLabel} from '@xh/hoist/desktop/cmp/store';
import {vframe, filler, p, a} from '@xh/hoist/cmp/layout';
import {textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';

import {RecallsPanelModel} from './RecallsPanelModel';
import './RecallsPanel.scss';
import {detailsPanel} from './DetailsPanel';

@HoistComponent
export class RecallsPanel extends Component {

    model = new RecallsPanelModel();
    
    render() {
        const {model} = this,
            {gridModel, detailsPanelModel} = model,
            {currentRecord} = detailsPanelModel,
            fdaWebsite = 'https://open.fda.gov/apis/drug/enforcement/',
            aboutBlurb = 'This applet uses the openFDA drug enforcement reports API, ' +
                'which provides information on drug recall events since 2004. ' +
                'For more information, see: ';

        console.log(detailsPanelModel);
        console.log(detailsPanelModel.currentRecord)

        return vframe(
            panel({
                title: 'FDA Drug Recalls',
                icon: Icon.health(),
                headerItems: [
                    button({
                        title: 'About the API',
                        text: 'About',
                        icon: Icon.questionCircle(),
                        onClick: () => XH.alert({
                            message: p(aboutBlurb, a({href: fdaWebsite, item: fdaWebsite, target: '_blank'}))
                        })
                    })
                ],
                item: grid({model: gridModel}),
                mask: model.loadModel,
                tbar: toolbar(
                    textInput({
                        model,
                        bind: 'searchQuery',
                        placeholder: 'Keyword Search',
                        commitOnChange: true,
                        enableClear: true
                    }),
                    filler(),
                    storeCountLabel({
                        gridModel,
                        unit: 'latest recall'
                    }),
                    toolbarSep(),
                    colChooserButton({gridModel})
                )
            }),
            panel({
                title: currentRecord ? currentRecord.brandName : 'Details',
                icon: Icon.detail(),
                item: detailsPanel({model: detailsPanelModel}),
                className: 'toolbox-recalls-detail-panel',
                model: {
                    side: 'bottom',
                    defaultSize: 325,
                    prefName: 'recallsPanelConfig'
                }
            })
        );
    }

}

