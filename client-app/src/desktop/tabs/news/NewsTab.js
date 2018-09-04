/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core/index';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {wrapper} from '../../common/Wrapper';
import {NewsTabModel} from "./NewsTabModel";



@HoistComponent()
export class NewsTab extends Component {

    localModel = new NewsTabModel();

    async loadAsync() {
        this.model.loadAsync()
    }

    render() {
        let newsRows = null
        if (this.localModel.results) {
            newsRows = this.localModel.results.map((story) => <li>{story.title}</li>)
        }

        return wrapper({
            item: panel({
                width: '90%',
                item: [
                    <div>
                        <ul>
                            {newsRows}
                        </ul>
                    </div>
                ]
            })
        });
    }

}
