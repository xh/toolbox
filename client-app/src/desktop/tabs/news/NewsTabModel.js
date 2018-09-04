/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {XH, HoistModel} from '@xh/hoist/core';
import {action, observable, computed} from '@xh/hoist/mobx';

@HoistModel()
export class NewsTabModel {

    @observable.ref results = [];

    async loadAsync() {
        // if (!this.view.isDisplayed) return;

        return XH
            .fetchJson({url: 'news'})
            .then(rows => {
                this.completeLoad(true, rows);
            }).catch(e => {
                this.completeLoad(false, e);
                XH.handleException(e);
            });
    }

    @action
    completeLoad(success, vals) {
        this.results = success ? Object.values(vals) : [];
    }
}