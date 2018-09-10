/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {XH, HoistModel} from '@xh/hoist/core';
import {action, observable, bindable} from '@xh/hoist/mobx';
import {DataViewModel} from "@xh/hoist/desktop/cmp/dataview";
import {LocalStore} from "@xh/hoist/data";
import {newsPanelItem} from "./NewsPanelItem";

@HoistModel
export class NewsPanelModel {

    @observable sourceOptions = null;
    @bindable sourceSelected = null;
    @observable lastRefresh = null;
    @observable viewModel = new DataViewModel({
                                    store: new LocalStore({
                                        fields: ['title', 'source', 'text', 'url', 'imageUrl', 'author', 'published']
                                    }),
                                    itemFactory: newsPanelItem
                                });
    @action
    updateSourceOptions = () => {
        this.sourceOptions = [...new Set (this.viewModel.store.records.map(story => story.source))]
    };

    @action
    refreshTimestamp = () => {
        this.lastRefresh = new Date()
    }

}