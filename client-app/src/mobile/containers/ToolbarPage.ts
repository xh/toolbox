import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/mobile/cmp/toolbar';
import {button} from '@xh/hoist/mobile/cmp/button';
import {select} from '@xh/hoist/mobile/cmp/input';
import {div, filler, frame, hframe} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {ToolbarPageModel} from './ToolbarPageModel';

export const toolbarPage = hoistCmp.factory({
    model: creates(ToolbarPageModel),

    render({model}) {
        return panel({
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
                        minimal: true
                    }),
                    filler(),
                    button({
                        icon: Icon.skull(),
                        text: 'Terminate',
                        minimal: true
                    })
                ),
                hframe(
                    toolbar({
                        vertical: true,
                        items: [
                            filler(),
                            button({icon: Icon.contact(), minimal: true}),
                            button({icon: Icon.comment(), minimal: true}),
                            toolbarSep(),
                            button({icon: Icon.add(), minimal: true}),
                            button({icon: Icon.delete(), minimal: true}),
                            toolbarSep(),
                            button({icon: Icon.gears(), minimal: true}),
                            filler()
                        ]
                    }),
                    frame({
                        padding: 10,
                        item: 'Help, I am surrounded by toolbars!'
                    }),
                    toolbar({
                        vertical: true,
                        items: [button({icon: Icon.contact()})]
                    })
                ),
                toolbar(
                    filler(),
                    select({
                        width: 200,
                        placeholder: 'Select a State...',
                        options: model.options,
                        bind: 'state'
                    }),
                    button({
                        text: 'Show Toast',
                        onClick: () =>
                            XH.toast({
                                message: model.state
                                    ? `Selected "${model.state}"`
                                    : 'No state selected'
                            })
                    })
                )
            ]
        });
    }
});
