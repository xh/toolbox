/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */
import React, {Component} from 'react';
import {HoistComponent} from '@xh/hoist/core';
import {wrapper} from '../../common/Wrapper';
import {observable, runInAction} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {leftRightChooser, leftRightChooserFilter, LeftRightChooserModel} from '@xh/hoist/desktop/cmp/leftrightchooser';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {switchField} from '@xh/hoist/desktop/cmp/form';
import data from './impl/LeftRightChooserData';

@HoistComponent()
export class LeftRightChooserPanel extends Component {

    localModel = new LeftRightChooserModel({
        data,
        ungroupedName: 'Others',
        rightGroupingEnabled: false
    });

    @observable anyMatch = false;

    render() {
        return wrapper({
            description: [
                <p>
                    LeftRightChooser splits a list of items into generic "left" and "right" sides,
                    with controls for the user to move items between the two. This can be used to e.g.
                    create a selected subset from a pool of items - see the grid column chooser for
                    such an example.
                </p>,
                <p>
                    Items can provide optional descriptions and groups, and can be marked
                    with <code>locked:true</code> to prevent them from being moved from one side to another.
                </p>
            ],
            item: panel({
                title: 'Other > LeftRightChooser',
                icon: Icon.arrowsLeftRight(),
                width: 700,
                height: 400,
                item: leftRightChooser({
                    model: this.model,
                    flex: 1
                }),
                bbar: toolbar(
                    leftRightChooserFilter({
                        fields: ['text'],
                        model: this.model,
                        anyMatch: this.anyMatch
                    }),
                    switchField({
                        value: this.anyMatch,
                        onCommit: (val) => {
                            runInAction(() => this.anyMatch = val);
                        },
                        label: 'match anywhere in the string'
                    })
                )
            })
        });
    }

}