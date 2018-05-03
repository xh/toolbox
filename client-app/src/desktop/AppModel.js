/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import {XH, BaseAppModel} from 'hoist/core';
import {FeedbackDialogModel} from 'hoist/cmp';
import {setter, observable, computed} from 'hoist/mobx';
import {fmtDate} from 'hoist/format';

export class AppModel extends BaseAppModel {

    feedbackModel = new FeedbackDialogModel();

    async initAsync() {
        XH.track({msg: 'Loaded App'});
    }

}