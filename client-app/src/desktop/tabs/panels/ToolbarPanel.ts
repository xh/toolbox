import {filler, hframe, placeholder, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {segmentedControl, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar, toolbarSep} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon, xhLogo} from '@xh/hoist/icon';
import {menu, menuDivider, menuItem, popover} from '@xh/hoist/kit/blueprint';
import {usStates} from '../../../core/data';
import {wrapper, wrapperOption} from '../../common';
import {ToolbarPanelModel} from './ToolbarPanelModel';

export const toolbarPanel = hoistCmp.factory({
    model: creates(ToolbarPanelModel),

    render({model}) {
        return wrapper({
            title: 'Toolbar',
            icon: Icon.window(),
            description: [
                'Toolbars are horizontal or vertical containers with distinct styling and',
                'managed spacing between their items. Top and bottom toolbar support is built',
                'into `Panel` via its `tbar` and `bbar` props, but toolbars can also be used',
                'on their own and rendered vertically. Items that exceed the available space',
                'collapse into an automatic overflow menu.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/panels/ToolbarPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/desktop/cmp/panel/README.md#toolbars',
                    text: 'Panel docs',
                    notes: 'Desktop panel guide; panels host toolbars via tbar and bbar.'
                },
                {url: '$HR/desktop/cmp/toolbar/Toolbar.ts', notes: 'Hoist component.'}
            ],
            options: wrapperOption({
                label: 'Compact',
                propName: 'ToolbarProps.compact',
                control: switchInput({model, bind: 'compact'})
            }),
            item: panel({
                title: 'Panel with Toolbars',
                icon: Icon.window(),
                height: '60vh',
                width: '90%',
                tbar: topBar(),
                item: hframe(leftBar(), placeholder(xhLogo({width: 200})), rightBar()),
                bbar: bottomBar()
            })
        });
    }
});

const topBar = hoistCmp.factory<ToolbarPanelModel>(({model}) =>
    toolbar({
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
                position: 'bottom-left',
                minimal: true,
                item: button({
                    icon: Icon.chevronDown(),
                    text: 'Menu Button'
                }),
                // Headings break a longer menu into labelled sections. This menu is assembled
                // from Blueprint elements directly, so it uses a titled `menuDivider`. Menus
                // built from Hoist `MenuItem` configs - e.g. `AppMenuButton.extraItems` or a
                // grid `contextMenu` - take a `{heading: '...'}` entry instead and render the
                // same way.
                content: menu(
                    menuDivider({title: 'Current View'}),
                    menuItem({icon: Icon.edit(), text: 'Rename'}),
                    menuItem({icon: Icon.copy(), text: 'Duplicate'}),
                    menuDivider({title: 'All Views'}),
                    menuItem({icon: Icon.gridPanel(), text: 'Manage'}),
                    menuItem({icon: Icon.reset(), text: 'Reset to Default'})
                )
            }),
            filler(),
            switchInput({
                bind: 'enableTerminate',
                label: 'Danger mode'
            }),
            button({
                icon: Icon.skull(),
                text: 'Terminate',
                intent: 'danger',
                disabled: !model.enableTerminate,
                onClick: () =>
                    XH.toast({message: 'Game over!', icon: Icon.skull(), intent: 'danger'})
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

const leftBar = hoistCmp.factory<ToolbarPanelModel>(({model}) =>
    toolbar({
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

const rightBar = hoistCmp.factory<ToolbarPanelModel>(({model}) =>
    toolbar({
        compact: model.compact,
        vertical: true,
        items: [button({icon: Icon.contact()})]
    })
);

const bottomBar = hoistCmp.factory<ToolbarPanelModel>(({model}) =>
    toolbar({
        compact: model.compact,
        items: [
            // SegmentedControl is preferred over ButtonGroupInput for a small set of mutually
            // exclusive options - it draws a clearer distinction between selected and unselected.
            segmentedControl({
                bind: 'visible',
                fill: false,
                compact: model.compact,
                options: [
                    {value: true, label: 'Show', icon: Icon.eye()},
                    {value: false, label: 'Hide', icon: Icon.eyeSlash()}
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
                onClick: () =>
                    XH.toast({message: `Currently selected State: ${model.state || 'None'}`})
            })
        ]
    })
);
