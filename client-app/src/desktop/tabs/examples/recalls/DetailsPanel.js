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

        return table(
            tbody(
                tr(th('Brand Name'), td(`${currentRecord.brandName}`)),
                tr(th('Generic Name'), td(`${currentRecord.genericName}`)),
                tr(th('Classification'), td(`${model.classification_details()}`)),
                tr(th('Description'), td(`${currentRecord.description}`))
            )
        );
    }

}

export const detailsPanel = elemFactory(DetailsPanel);