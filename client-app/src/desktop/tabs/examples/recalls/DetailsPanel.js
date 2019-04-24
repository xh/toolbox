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


        return table({
            item: tbody(
                tr(th('Brand Name'), td('Concerta, Ritalin')),
                tr(th('Generic Name'), td('methylphenidate')),
                tr(th('description'), td('Clonidine HCL Injection, 1000 mcg/10mL (100 mcg/mL), 10 ML Single Dose Vial, Rx only, Manufactured for: X-Gen Pharmaceuticals, Big Flats, NY 14814, NDC 39822-2000-1'))
            )
        });
    }

}

export const detailsPanel = elemFactory(DetailsPanel);