import React from 'react';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {wrapper} from '../../common/Wrapper';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {Icon} from '@xh/hoist/icon';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {leftRightChooser, LeftRightChooserModel} from '@xh/hoist/desktop/cmp/leftrightchooser2';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import data from './impl/LeftRightChooserData';

export const newLeftRightChooserPanel = hoistCmp.factory({
    model: creates(() => LeftRightChooserPanelModel),

    render({model}) {
        return wrapper({
            description: [
                <p>
                    NewLeftRightChooser splits a list of items into generic "left" and "right" sides,
                    with controls for the user to move items between the two. The user may also drag
                    and drop items between each list, and drag items to reorder an individual list.
                    This can be used to e.g. create a selected subset from a pool of items - see the
                    grid column chooser for such an example.
                </p>,
                <p>
                    Items can provide optional descriptions and groups, and can be marked
                    with <code>locked:true</code> to prevent them from being moved from one side to another.
                </p>
            ],
            item: panel({
                title: 'Other > NewLeftRightChooser',
                icon: Icon.arrowsLeftRight(),
                width: 700,
                height: 400,
                item: leftRightChooser({
                    flex: 1
                }),
                bbar: [

                    switchInput({
                        bind: 'anyMatch',
                        label: 'match anywhere in the string'
                    })
                ]
            })
        });
    }
});

class LeftRightChooserPanelModel extends HoistModel {

    @managed
    leftRightChooserModel = new LeftRightChooserModel({
        data,
        ungroupedName: 'Others',
        leftEmptyText: 'No more fruits to choose!',
        rightGroupingEnabled: true
    });

    @bindable anyMatch = false;

    constructor() {
        super();
        makeObservable(this);
    }
}