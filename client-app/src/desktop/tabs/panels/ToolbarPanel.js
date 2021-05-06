import {span} from '@xh/hoist/cmp/layout';
import {menu, menuItem, popover} from '@xh/hoist/kit/blueprint';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {wrapper} from '../../common/Wrapper';
import {filler, frame, hframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {buttonGroupInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {usStates} from '../../../core/data';
import {ToolbarPanelModel} from './ToolbarPanelModel';

export const toolbarPanel = hoistCmp.factory({
    model: creates(ToolbarPanelModel),

    render({model}) {
        return wrapper({
            description: `
                Toolbars (in case you have never seen one) are horizontal or vertical containers 
                with distinct styling and managed spacing between items. Support for top and bottom
                toolbars is built into Panel via its tbar/bbar props, but they can be used on their
                own and can be displayed in a vertical configuration as well. 
            `,
            links: [
                {url: '$TB/client-app/src/desktop/tabs/panels/ToolbarPanel.js', notes: 'This example.'},
                {url: '$HR/desktop/cmp/toolbar/Toolbar.js', notes: 'Hoist component.'}
            ],
            item: panel({
                title: 'Panels › Toolbar',
                height: 400,
                width: 700,
                tbar: topBar(),
                item: hframe(
                    leftBar(),
                    frame({padding: 10, item: 'Help, I am surrounded by toolbars!'}),
                    rightBar()
                ),
                bbar: bottomBar()
            })
        });
    }
});

const topBar = hoistCmp.factory(
    ({model}) => toolbar({
        compact: model.compact,
        enableOverflowMenu: true,
        items: [
            button({
                icon: Icon.add(),
                text: 'New',
                intent: 'success'
            }),
            toolbarSep(),
            button({
                icon: Icon.edit(),
                text: 'Edit',
                intent: 'primary'
            }),
            popover({
                placement: 'bottom-start',
                minimal: true,
                item: button({
                    icon: Icon.chevronDown(),
                    text: 'Menu Button'
                }),
                content: menu(
                    menuItem({text: 'Menu Item'}),
                    menuItem({text: 'Menu Item 2'}),
                    menuItem({text: 'Menu Item 3'})
                )
            }),
            filler(),
            switchInput({
                bind: 'enableTerminate',
                label: 'Danger mode',
                alignIndicator: 'right'
            }),
            button({
                icon: Icon.skull(),
                text: 'Terminate',
                intent: 'danger',
                disabled: !model.enableTerminate,
                onClick: () => XH.toast({message: 'Game over!', icon: Icon.skull(), intent: 'danger'})
            }),
            button({
                icon: Icon.add(),
                text: 'Extra Button'
            }),
            button({
                icon: Icon.chevronRight(),
                text: 'Overflowing Button 1'
            }),
            button({
                icon: Icon.arrowRight(),
                text: 'Overflowing Button 2'
            })
        ]
    })
);

const leftBar = hoistCmp.factory(
    ({model}) => toolbar({
        compact: model.compact,
        vertical: true,
        items: [
            filler(),
            button({icon: Icon.contact()}),
            button({icon: Icon.comment()}),
            toolbarSep(),
            button({icon: Icon.add()}),
            button({icon: Icon.delete()}),
            toolbarSep(),
            button({icon: Icon.gears()}),
            filler()
        ]
    })
);

const rightBar = hoistCmp.factory(
    ({model}) => toolbar({
        compact: model.compact,
        vertical: true,
        items: [
            button({icon: Icon.contact()})
        ]
    })
);

const bottomBar = hoistCmp.factory(
    ({model}) => toolbar({
        compact: model.compact,
        items: [
            switchInput({
                label: 'Compact',
                bind: 'compact'
            }),
            toolbarSep(),
            buttonGroupInput({
                bind: 'visible',
                items: [
                    button({icon: Icon.eye(), text: 'Show', value: true}),
                    button({icon: Icon.eyeSlash(), text: 'Hide', value: false})
                ]
            }),
            span({
                item: 'Now you see me...',
                omit: !model.visible
            }),
            filler(),
            select({
                bind: 'state',
                options: usStates,
                placeholder: 'Select a State...',
                leftIcon: Icon.globe()
            }),
            toolbarSep(),
            button({
                text: 'Show Toast',
                onClick: () => XH.toast({message: `Currently selected State: ${model.state || 'None'}`})
            })
        ]
    })
);