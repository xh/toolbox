/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2019 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {elemFactory, HoistComponent} from '@xh/hoist/core';
import {table, tbody, tr, th, td} from '@xh/hoist/cmp/layout';

@HoistComponent
class DetailsPanel extends Component {

    render() {
        const {model} = this,
            {currentRecord} = model;

        if (!currentRecord) return null;

        console.log('We got the currentRecord: ', currentRecord);

        return table(
            tbody(
                tr(th('Brand Name'), td(`${currentRecord.brandName}`)),
                tr(th('Generic Name'), td(`${currentRecord.genericName}`)),
                tr(th('Classification'), td(`${model.classification_details()}`)),
                tr(th('Description'), td(`${currentRecord.description}`)),
                tr(th('Recalling Firm'), td(`${currentRecord.recallingFirm}`)),
                tr(th('Reason For Recall'), td(`${currentRecord.reason}`))
            )
        );
    }

}

export const detailsPanel = elemFactory(DetailsPanel);