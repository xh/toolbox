import {fragment} from '@xh/hoist/cmp/layout';
import {elemFactory, HoistComponent} from '@xh/hoist/core';
import {switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Component} from 'react';

@HoistComponent
export class GridStyleSwitches extends Component {

    render() {
        const {gridModel} = this.props;

        return fragment(
            switchInput({
                model: gridModel,
                bind: 'compact',
                label: 'Compact',
                labelAlign: 'left'
            }),
            toolbarSep(),
            switchInput({
                model: gridModel,
                bind: 'stripeRows',
                label: 'Striped',
                labelAlign: 'left'
            }),
            toolbarSep(),
            switchInput({
                model: gridModel,
                bind: 'rowBorders',
                label: 'Borders',
                labelAlign: 'left'
            }),
            toolbarSep(),
            switchInput({
                model: gridModel,
                bind: 'showHover',
                label: 'Hover',
                labelAlign: 'left'
            }),
            toolbarSep(),
            switchInput({
                model: gridModel,
                bind: 'showCellFocus',
                label: 'Cell focus',
                labelAlign: 'left'
            })
        );
    }
}

export const gridStyleSwitches = elemFactory(GridStyleSwitches);