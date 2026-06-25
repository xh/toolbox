import {hoistCmp, HoistModel, creates, Intent, XH} from '@xh/hoist/core';
import {bindable, makeObservable} from '@xh/hoist/mobx';
import {ReactElement} from 'react';
import {div, filler, p, vbox} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {popover} from '@xh/hoist/mobile/cmp/popover';
import {dialog} from '@xh/hoist/mobile/cmp/dialog';
import {button} from '@xh/hoist/mobile/cmp/button';
import {select, switchInput} from '@xh/hoist/mobile/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {exampleOption, exampleScreen} from '../cmp/example/ExampleScreen';

import './PopoverPage.scss';

type PopoverPosition = 'auto' | 'top' | 'bottom' | 'left' | 'right';

/** Shared width for the trigger button and its menu so the menu anchors flush to the button. */
const MENU_WIDTH = 200;

export const popoverPage = hoistCmp.factory({
    model: creates(() => PopoverPageModel),
    render({model}) {
        return exampleScreen({
            title: 'Popover',
            icon: Icon.openExternal(),
            description: [
                '`Popover` floats content beside a target element - ideal for compact, contextual UI',
                'like a menu, filter, or mini-form that should not take over the screen. Tap "Actions"',
                'below to open a popover menu; the Position and Backdrop options reposition it.',
                '',
                'For content that demands a decision and should block the rest of the screen, reach for',
                'a modal `Dialog` instead - shown alongside for contrast.'
            ],
            options: [
                exampleOption({
                    label: 'Position',
                    info: 'Where the popover opens relative to its target.',
                    control: select({
                        width: 130,
                        model,
                        bind: 'position',
                        enableFilter: false,
                        hideSelectedOptionCheck: true,
                        options: [
                            {value: 'auto', label: 'Auto'},
                            {value: 'top', label: 'Top'},
                            {value: 'bottom', label: 'Bottom'},
                            {value: 'left', label: 'Left'},
                            {value: 'right', label: 'Right'}
                        ]
                    })
                }),
                exampleOption({
                    label: 'Backdrop',
                    control: switchInput({model, bind: 'backdrop'}),
                    info: 'Dim the rest of the screen behind the popover.'
                })
            ],
            links: [
                {url: '$TB/client-app/src/mobile/popover/PopoverPage.ts', notes: 'This example.'},
                {url: '$HR/mobile/cmp/popover/Popover.ts', text: 'Popover source'},
                {url: '$HR/mobile/cmp/dialog/Dialog.ts', text: 'Dialog source'}
            ],
            item: panel({
                className: 'tb-page xh-tiled-bg',
                items: [
                    filler(),
                    overlayCard({
                        title: 'Popover',
                        subtitle: 'Floating menu anchored to a control',
                        trigger: popover({
                            // Center the trigger and size it to the menu width, so the menu anchors
                            // cleanly to the button rather than floating under a full-width bar.
                            className: 'tb-popover-trigger',
                            isOpen: model.menuOpen,
                            onInteraction: next => (model.menuOpen = next),
                            position: model.position,
                            backdrop: model.backdrop,
                            item: button({
                                text: 'Actions',
                                icon: Icon.ellipsisVertical(),
                                width: MENU_WIDTH
                            }),
                            content: actionsMenu({model})
                        })
                    }),
                    overlayCard({
                        title: 'Dialog',
                        subtitle: 'Modal overlay that blocks the screen',
                        trigger: button({
                            text: 'Open Dialog',
                            icon: Icon.window(),
                            onClick: () => (model.dialogOpen = true)
                        })
                    }),
                    filler(),
                    editDialog({model})
                ]
            })
        });
    }
});

const overlayCard = hoistCmp.factory({
    render({title, subtitle, trigger}) {
        return div({
            className: 'tb-card tb-overlay-card',
            items: [
                div({className: 'tb-card__title', item: title}),
                div({className: 'tb-overlay-card__subtitle', item: subtitle}),
                trigger
            ]
        });
    }
});

const actionsMenu = hoistCmp.factory<PopoverPageModel>({
    render({model}) {
        const action = (icon: ReactElement, label: string, intent?: Intent) =>
            button({
                icon,
                text: label,
                intent,
                minimal: true,
                onClick: () => model.chooseAction(label)
            });
        return vbox({
            className: 'tb-popover-menu',
            width: MENU_WIDTH,
            items: [
                action(Icon.edit(), 'Edit'),
                action(Icon.copy(), 'Duplicate'),
                action(Icon.delete(), 'Delete', 'danger')
            ]
        });
    }
});

const editDialog = hoistCmp.factory<PopoverPageModel>({
    render({model}) {
        return dialog({
            isOpen: model.dialogOpen,
            icon: Icon.window(),
            title: 'Modal Dialog',
            onCancel: () => (model.dialogOpen = false),
            content: div({
                className: 'tb-overlay-dialog',
                items: [
                    p(
                        'Unlike a popover, a Dialog is a modal overlay - it sits centered over a backdrop and blocks interaction with the rest of the screen until dismissed.'
                    ),
                    p(
                        'Use one when the user must make a decision or complete a step before continuing, rather than for lightweight, dismiss-anywhere content.'
                    )
                ]
            }),
            buttons: [
                button({
                    text: 'Cancel',
                    onClick: () => (model.dialogOpen = false)
                }),
                filler(),
                button({
                    text: 'Save',
                    intent: 'primary',
                    onClick: () => model.saveDialog()
                })
            ]
        });
    }
});

/**
 * LocalModel driving the Popover menu (controlled open state, repositionable) and the contrasting
 * modal Dialog.
 */
class PopoverPageModel extends HoistModel {
    @bindable position: PopoverPosition = 'bottom';
    @bindable backdrop: boolean = false;
    @bindable menuOpen: boolean = false;
    @bindable dialogOpen: boolean = false;

    constructor() {
        super();
        makeObservable(this);
    }

    chooseAction(label: string) {
        this.menuOpen = false;
        XH.toast({message: `${label} selected`});
    }

    saveDialog() {
        this.dialogOpen = false;
        XH.toast({message: 'Changes saved', intent: 'success'});
    }
}
