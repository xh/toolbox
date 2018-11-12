import {Component} from 'react';
import {HoistComponent, elemFactory} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {div, vbox, box} from '@xh/hoist/cmp/layout';

@HoistComponent
export class VBoxPage extends Component {

    render() {
        return page({
            className: 'toolbox-containers-page',
            items: [
                div({
                    className: 'toolbox-description',
                    item: `
                        A vbox lays out its children vertically, rendering a box with flexDirection 
                        set to column.
                    `
                }),
                vbox(
                    this.renderBox({flex: 1, item: 'flex: 1'}),
                    this.renderBox({height: 80, item: 'height: 80'}),
                    this.renderBox({flex: 2, item: 'flex: 2'})
                )
            ]
        });
    }

    renderBox(args) {
        return box({
            padding: 10,
            className: 'toolbox-containers-box',
            ...args
        });
    }
}

export const vBoxPage = elemFactory(VBoxPage);