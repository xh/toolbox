import React from 'react';
import {hoistComponent, localModel, useModel, HoistModel, managed} from '@xh/hoist/core';
import {wrapper} from '../../common/Wrapper';
import {bindable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {leftRightChooser, leftRightChooserFilter, LeftRightChooserModel} from '@xh/hoist/desktop/cmp/leftrightchooser';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import data from './impl/LeftRightChooserData';

export const LeftRightChooserPanel = hoistComponent({
    model: localModel(Model),

    render() {
        const model = useModel();
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
            links: [
                {url: '$TB/client-app/src/desktop/tabs/other/LeftRightChooserPanel.js', notes: 'This example.'},
                {url: '$HR/desktop/cmp/leftrightchooser/LeftRightChooser.js', notes: 'Hoist component.'},
                {url: '$HR/desktop/cmp/leftrightchooser/LeftRightChooserModel.js', notes: 'Hoist component model.'},
                {url: '$HR/desktop/cmp/leftrightchooser/LeftRightChooserFilter.js', notes: 'Optional filter component.'}
            ],
            item: panel({
                title: 'Other › LeftRightChooser',
                icon: Icon.arrowsLeftRight(),
                width: 700,
                height: 400,
                item: leftRightChooser({
                    model: model.leftRightChooserModel,
                    flex: 1
                }),
                bbar: [
                    leftRightChooserFilter({
                        fields: ['text'],
                        model: model.leftRightChooserModel,
                        anyMatch: model.anyMatch
                    }),
                    switchInput({
                        bind: 'anyMatch',
                        label: 'match anywhere in the string'
                    })
                ]
            })
        });
    }
});


@HoistModel
class Model {

    @managed
    leftRightChooserModel = new LeftRightChooserModel({
        data,
        ungroupedName: 'Others',
        leftEmptyText: 'No more fruits to choose!',
        rightGroupingEnabled: false
    });

    @bindable anyMatch = false;
}