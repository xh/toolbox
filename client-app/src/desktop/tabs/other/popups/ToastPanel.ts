import {box, hbox, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, type Intent, type ToastSpec, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {
    intentInput,
    numberInput,
    select,
    switchInput,
    textInput
} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {SECONDS} from '@xh/hoist/utils/datetime';
import {useRef} from 'react';
import {
    demoGrid,
    demoPanel,
    demoPlayground,
    demoRow,
    demoSection,
    fmtDemoConfig,
    raw
} from '../../../common/Demo';
import {wrapper, wrapperOption, wrapperOptionGroup} from '../../../common/Wrapper';
import {popBtn} from './PopupsCommon';

export const toastPanel = hoistCmp.factory({
    displayName: 'ToastPanel',
    model: creates(() => ToastPanelModel),

    render({model}) {
        const anchorRef = useRef(null),
            {pgMessage, pgIcon, pgIntent, pgTimeout, pgPosition} = model;

        return wrapper({
            title: 'Toast',
            icon: Icon.toast(),
            description: [
                'Toasts are transient, non-modal notifications - a short message that appears',
                'at the edge of the app, or anchored to a given element, and dismisses itself',
                'after a timeout.',
                '',
                'Trigger them via `XH.toast()`, or the intent-specific `XH.successToast()`,',
                '`XH.warningToast()` and `XH.dangerToast()` shortcuts.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/popups/ToastPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/appcontainer/README.md',
                    text: 'App shell docs',
                    notes: 'Application shell guide: dialogs, toasts, and banners.'
                },
                {
                    url: '$HR/core/XH.ts',
                    notes: 'Top-level APIs: .toast(), .successToast(), .warningToast(), .dangerToast().'
                }
            ],
            options: wrapperOptionGroup({
                label: 'Playground only',
                icon: Icon.experiment(),
                intent: 'primary',
                info: 'Drives the Playground toast.',
                items: [
                    wrapperOption({
                        label: 'Message',
                        propName: 'ToastSpec.message',
                        control: textInput({bind: 'pgMessage', width: 150, commitOnChange: true})
                    }),
                    wrapperOption({
                        label: 'Icon',
                        propName: 'ToastSpec.icon',
                        control: switchInput({bind: 'pgIcon'})
                    }),
                    wrapperOption({
                        label: 'Intent',
                        propName: 'ToastSpec.intent',
                        control: intentInput({bind: 'pgIntent', enableClear: true})
                    }),
                    wrapperOption({
                        label: 'Timeout',
                        propName: 'ToastSpec.timeout',
                        info: 'Milliseconds - clear to keep the toast open.',
                        control: numberInput({
                            bind: 'pgTimeout',
                            width: 130,
                            min: 0,
                            stepSize: 1000
                        })
                    }),
                    wrapperOption({
                        label: 'Position',
                        propName: 'ToastSpec.position',
                        control: select({
                            bind: 'pgPosition',
                            enableFilter: false,
                            width: 130,
                            options: POSITIONS
                        })
                    })
                ]
            }),
            item: demoPanel({
                className: 'tbox-popups',
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 260,
                            showValue: false,
                            caption: 'Click to show a toast with the current options.',
                            config: fmtDemoConfig<ToastSpec>('XH.toast', {
                                message: pgMessage,
                                icon: pgIcon ? raw('Icon.info()') : undefined,
                                intent: pgIntent || undefined,
                                timeout: pgTimeout === DEFAULT_TIMEOUT ? undefined : pgTimeout,
                                position: pgPosition === DEFAULT_POSITION ? undefined : pgPosition
                            }),
                            item: button({
                                ...popBtn(Icon.toast({intent: 'warning'})),
                                text: 'Show toast',
                                onClick: () =>
                                    XH.toast({
                                        message: pgMessage,
                                        icon: pgIcon ? Icon.info() : null,
                                        intent: pgIntent,
                                        timeout: pgTimeout,
                                        position: pgPosition
                                    })
                            })
                        })
                    }),
                    demoSection({
                        title: 'Variants',
                        note: 'Each sets its own props.',
                        item: demoGrid({
                            columns: 3,
                            items: [
                                demoRow({
                                    label: 'With action',
                                    info: 'actionButtonProps renders a button within the toast',
                                    item: button({
                                        ...popBtn(Icon.toast({intent: 'warning'})),
                                        text: 'Toast with action',
                                        onClick: () =>
                                            XH.toast({
                                                message: 'This is a Toast with an action button.',
                                                timeout: 10 * SECONDS,
                                                actionButtonProps: {
                                                    text: 'Undo',
                                                    onClick: () =>
                                                        XH.toast('Action button clicked!')
                                                }
                                            })
                                    })
                                }),
                                demoRow({
                                    label: 'Shortcuts',
                                    info: 'Preset intent and icon for the common outcomes',
                                    item: hbox({
                                        gap: 6,
                                        flexWrap: 'wrap',
                                        items: [
                                            button({
                                                ...popBtn(Icon.checkCircle({intent: 'success'})),
                                                text: 'successToast',
                                                onClick: () =>
                                                    XH.successToast('Saved successfully.')
                                            }),
                                            button({
                                                ...popBtn(Icon.warning({intent: 'warning'})),
                                                text: 'warningToast',
                                                onClick: () => XH.warningToast('Check your inputs.')
                                            }),
                                            button({
                                                ...popBtn(Icon.skull({intent: 'danger'})),
                                                text: 'dangerToast',
                                                onClick: () =>
                                                    XH.dangerToast('Something went wrong.')
                                            })
                                        ]
                                    })
                                }),
                                demoRow({
                                    label: 'Anchored',
                                    info: 'containerRef positions the toast against a given element rather than the document edge',
                                    item: box({
                                        ref: anchorRef,
                                        className: 'tbox-popups__anchor',
                                        item: button({
                                            ...popBtn(Icon.toast({intent: 'warning'})),
                                            text: 'Toast in this box',
                                            onClick: () =>
                                                XH.toast({
                                                    message: span('Anchored with containerRef'),
                                                    containerRef: anchorRef.current
                                                })
                                        })
                                    })
                                })
                            ]
                        })
                    })
                ]
            })
        });
    }
});

//------------------------------------------------------------------
// Model
//------------------------------------------------------------------
class ToastPanelModel extends HoistModel {
    // Playground props
    @bindable accessor pgMessage = 'This is a Toast.';
    @bindable accessor pgIcon = false;
    @bindable accessor pgIntent: Intent = null;
    @bindable accessor pgTimeout: number = DEFAULT_TIMEOUT;
    @bindable accessor pgPosition = DEFAULT_POSITION;
}

const DEFAULT_TIMEOUT = 3 * SECONDS,
    DEFAULT_POSITION = 'bottom-right';

const POSITIONS = ['top-left', 'top', 'top-right', 'bottom-left', DEFAULT_POSITION, 'bottom'];
