import {Component} from 'react';
import {XH, HoistComponent, elemFactory} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {toolbar, toolbarSep} from '@xh/hoist/mobile/cmp/toolbar';
import {button} from '@xh/hoist/mobile/cmp/button';
import {select} from '@xh/hoist/mobile/cmp/input';
import {div, hframe, filler} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';

import {usStates} from '../../core/data';

@HoistComponent
export class ToolbarPage extends Component {

    render() {
        return page({
            className: 'toolbox-toolbar-page',
            items: [
                div({
                    className: 'toolbox-description',
                    item: `
                        Toolbars (in case you have never seen one) are horizontal or vertical containers 
                        with distinct styling and managed spacing between items.
                    `
                }),
                toolbar(
                    button({
                        icon: Icon.add(),
                        text: 'New'
                    }),
                    toolbarSep(),
                    button({
                        icon: Icon.edit(),
                        text: 'Edit',
                        modifier: 'quiet'
                    }),
                    filler(),
                    button({
                        icon: Icon.skull(),
                        text: 'Terminate',
                        modifier: 'quiet'
                    })
                ),
                hframe(
                    toolbar({
                        vertical: true,
                        items: [
                            filler(),
                            button({icon: Icon.contact(), modifier: 'quiet'}),
                            button({icon: Icon.comment(), modifier: 'quiet'}),
                            toolbarSep(),
                            button({icon: Icon.add(), modifier: 'quiet'}),
                            button({icon: Icon.delete(), modifier: 'quiet'}),
                            toolbarSep(),
                            button({icon: Icon.gears(), modifier: 'quiet'}),
                            filler()
                        ]
                    }),
                    hframe({
                        padding: 10,
                        item: 'Help, I am surrounded by toolbars!'
                    }),
                    toolbar({
                        vertical: true,
                        items: [
                            button({icon: Icon.contact()})
                        ]
                    })
                ),
                toolbar(
                    filler(),
                    select({
                        width: 200,
                        options: usStates,
                        placeholder: 'Select a State...'
                    }),
                    button({
                        text: 'Show Toast',
                        onClick: () => XH.toast({message: 'Toast Shown!'})
                    })
                )
            ]
        });
    }

}
export const toolbarPage = elemFactory(ToolbarPage);