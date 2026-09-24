import {hbox, span} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel, type Intent, type MessageSpec, XH} from '@xh/hoist/core';
import {lengthIs, required} from '@xh/hoist/data';
import {button} from '@xh/hoist/desktop/cmp/button';
import {intentInput, switchInput, textArea, textInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {bindable} from '@xh/hoist/mobx';
import {MINUTES} from '@xh/hoist/utils/datetime';
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

export const messagesPanel = hoistCmp.factory({
    displayName: 'MessagesPanel',
    model: creates(() => MessagesPanelModel),

    render({model}) {
        const divRef = useRef(null),
            responseToast = ret =>
                XH.toast({
                    message: span(`That message resolved to ${ret}`),
                    intent: ret ? 'success' : 'danger',
                    icon: ret ? Icon.check() : Icon.x(),
                    containerRef: divRef.current
                }),
            {pgTitle, pgMessage, pgIcon, pgConfirmText, pgCancelText} = model,
            {pgExtraConfirm, pgDismissable, pgCancelOnDismiss} = model;

        return wrapper({
            title: 'Messages',
            icon: Icon.comment(),
            description: [
                'Modal messages notify users about important events or prompt them to confirm',
                'an action, blocking the app until they respond.',
                '',
                'The `Message` component provides them in Hoist but is rarely used directly.',
                'Instead, the `XH.message()`, `XH.alert()`, `XH.confirm()`, and `XH.prompt()`',
                'methods offer convenient APIs to trigger them, each returning a Promise that',
                "resolves with the user's response. The `message` accepts strings, JSX, or",
                'React elements for rich text.',
                '',
                'For non-modal notifications, see the Toast and Banners examples.'
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/popups/MessagesPanel.ts',
                    notes: 'This example.'
                },
                {
                    url: '$HR/appcontainer/README.md',
                    text: 'App shell docs',
                    notes: 'Application shell guide: dialogs, toasts, and banners.'
                },
                {
                    url: '$HR/core/XH.ts',
                    notes: 'Top-level APIs: .alert(), .confirm(), .prompt(), .message().'
                }
            ],
            options: wrapperOptionGroup({
                label: 'Playground only',
                icon: Icon.experiment(),
                intent: 'primary',
                info: 'Drives the Playground message.',
                items: [
                    wrapperOption({
                        label: 'Title',
                        propName: 'MessageSpec.title',
                        control: textInput({bind: 'pgTitle', width: 150, commitOnChange: true})
                    }),
                    wrapperOption({
                        label: 'Message',
                        propName: 'MessageSpec.message',
                        control: textInput({
                            bind: 'pgMessage',
                            width: 150,
                            commitOnChange: true
                        })
                    }),
                    wrapperOption({
                        label: 'Icon',
                        propName: 'MessageSpec.icon',
                        control: switchInput({bind: 'pgIcon'})
                    }),
                    wrapperOption({
                        label: 'Icon intent',
                        propName: 'MessageSpec.icon',
                        control: intentInput({
                            bind: 'pgIntent',
                            enableClear: true,
                            disabled: !pgIcon
                        })
                    }),
                    wrapperOption({
                        label: 'Confirm text',
                        propName: 'MessageSpec.confirmProps',
                        info: 'Clear to omit the button.',
                        control: textInput({
                            bind: 'pgConfirmText',
                            width: 150,
                            commitOnChange: true
                        })
                    }),
                    wrapperOption({
                        label: 'Cancel text',
                        propName: 'MessageSpec.cancelProps',
                        info: 'Clear to omit the button.',
                        control: textInput({
                            bind: 'pgCancelText',
                            width: 150,
                            commitOnChange: true
                        })
                    }),
                    wrapperOption({
                        label: 'Typed confirmation',
                        propName: 'MessageSpec.extraConfirmText',
                        info: "Type 'CONFIRM' to enable the confirm button.",
                        control: switchInput({bind: 'pgExtraConfirm'})
                    }),
                    wrapperOption({
                        label: 'Dismissable',
                        propName: 'MessageSpec.dismissable',
                        info: 'Escape and backdrop clicks close the message.',
                        control: switchInput({bind: 'pgDismissable'})
                    }),
                    wrapperOption({
                        label: 'Cancel on dismiss',
                        propName: 'MessageSpec.cancelOnDismiss',
                        info: 'Dismissing resolves false rather than null.',
                        control: switchInput({
                            bind: 'pgCancelOnDismiss',
                            disabled: !pgDismissable
                        })
                    })
                ]
            }),
            item: demoPanel({
                className: 'tbox-popups',
                ref: divRef,
                items: [
                    demoSection({
                        title: 'Playground',
                        intent: 'primary',
                        item: demoPlayground({
                            instanceWidth: 260,
                            showValue: false,
                            caption: 'Click to show a message with the current options.',
                            config: fmtDemoConfig<MessageSpec>('XH.message', {
                                title: pgTitle || undefined,
                                message: pgMessage,
                                icon: pgIcon ? raw(model.pgIconSnippet) : undefined,
                                confirmProps: pgConfirmText
                                    ? raw(`{text: '${pgConfirmText}'}`)
                                    : undefined,
                                cancelProps: pgCancelText
                                    ? raw(`{text: '${pgCancelText}'}`)
                                    : undefined,
                                extraConfirmText: pgExtraConfirm ? 'CONFIRM' : undefined,
                                dismissable: pgDismissable ? undefined : false,
                                cancelOnDismiss: pgCancelOnDismiss ? undefined : false
                            }),
                            item: button({
                                ...popBtn(Icon.comment({intent: 'primary'})),
                                text: 'Show message',
                                onClick: () => XH.message(model.pgSpec).then(responseToast)
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
                                    label: 'Alert',
                                    info: 'XH.alert() - one button, resolves true when acknowledged',
                                    item: button({
                                        ...popBtn(Icon.warning({intent: 'danger'})),
                                        text: 'Alert',
                                        onClick: () =>
                                            XH.alert({
                                                title: 'Alert',
                                                message:
                                                    'This is an Alert. Alerts come with one button: "OK".'
                                            }).then(responseToast)
                                    })
                                }),
                                demoRow({
                                    label: 'Confirm',
                                    info: 'XH.confirm() - OK and Cancel, resolves true or false',
                                    item: button({
                                        ...popBtn(Icon.questionCircle({intent: 'primary'})),
                                        text: 'Confirm',
                                        onClick: () =>
                                            XH.confirm({
                                                title: 'Confirm',
                                                message:
                                                    'This is a Confirm. Confirms come with two buttons: "OK" and "Cancel".'
                                            }).then(responseToast)
                                    })
                                }),
                                demoRow({
                                    label: 'Prompt',
                                    info: 'XH.prompt() - collects a value, resolves to it or false on cancel',
                                    item: button({
                                        ...popBtn(Icon.edit({intent: 'primary'})),
                                        text: 'Prompt',
                                        onClick: () =>
                                            XH.prompt<string>({
                                                title: 'Prompt',
                                                message: 'This is a Prompt. Enter a value below.'
                                            }).then(responseToast)
                                    })
                                }),
                                demoRow({
                                    label: 'Prompt with validation',
                                    info: 'input.item swaps in a textArea, input.rules validate before confirming',
                                    item: button({
                                        ...popBtn(Icon.edit({intent: 'primary'})),
                                        text: 'Send a message',
                                        onClick: () =>
                                            XH.prompt<string>({
                                                title: 'Send a message',
                                                message:
                                                    'Your message must be at least 20 characters.',
                                                input: {
                                                    initialValue:
                                                        'I must be at least 20 characters to send...',
                                                    item: textArea({
                                                        autoFocus: true,
                                                        selectOnFocus: true
                                                    }),
                                                    rules: [required, lengthIs({min: 20})]
                                                },
                                                confirmProps: {
                                                    text: 'Send',
                                                    icon: Icon.mail(),
                                                    intent: 'primary'
                                                }
                                            }).then(responseToast)
                                    })
                                }),
                                demoRow({
                                    label: 'Custom buttons',
                                    info: 'confirmProps, cancelProps and cancelAlign style the buttons',
                                    item: button({
                                        ...popBtn(Icon.questionCircle({intent: 'primary'})),
                                        text: 'Custom buttons',
                                        onClick: () =>
                                            XH.confirm({
                                                title: 'Confirm with custom buttons',
                                                message:
                                                    'The cancel button is left-aligned, styled as danger and given autoFocus.',
                                                confirmProps: {
                                                    text: 'Go ahead...',
                                                    intent: 'primary'
                                                },
                                                cancelProps: {
                                                    text: 'Get me outta here!',
                                                    intent: 'danger',
                                                    autoFocus: true
                                                },
                                                cancelAlign: 'left'
                                            }).then(responseToast)
                                    })
                                }),
                                demoRow({
                                    label: 'Callbacks',
                                    info: 'onConfirm and onCancel fire alongside the resolved Promise',
                                    item: button({
                                        ...popBtn(Icon.comment({intent: 'success'})),
                                        text: 'Callbacks',
                                        onClick: () =>
                                            XH.message({
                                                title: 'Message with callbacks',
                                                message: 'Each button triggers its callback.',
                                                confirmProps: {text: 'Trigger onConfirm()'},
                                                cancelProps: {text: 'Trigger onCancel()'},
                                                onConfirm: () =>
                                                    XH.toast({
                                                        message: 'Called onConfirm',
                                                        containerRef: divRef.current
                                                    }),
                                                onCancel: () =>
                                                    XH.toast({
                                                        message: 'Called onCancel',
                                                        icon: Icon.x(),
                                                        intent: 'danger',
                                                        containerRef: divRef.current
                                                    })
                                            })
                                    })
                                })
                            ]
                        })
                    }),
                    demoSection({
                        title: 'Suppress',
                        note: 'Include a "Don\'t show this again" checkbox.',
                        item: demoGrid({
                            columns: 3,
                            items: [
                                demoRow({
                                    label: 'Suppress 1 min, this tab',
                                    info: 'Session storage, 1 minute expiry',
                                    item: button({
                                        ...popBtn(Icon.clock({intent: 'warning'})),
                                        text: 'Open delayed data',
                                        onClick: () =>
                                            XH.alert({
                                                title: 'Delayed market data',
                                                icon: Icon.clock({intent: 'warning'}),
                                                message:
                                                    'Prices on this page are delayed by 15 minutes.',
                                                messageKey: 'tbMessagesDelayedData',
                                                suppress: {storage: 'session', expiry: 1 * MINUTES}
                                            }).then(responseToast)
                                    })
                                }),
                                demoRow({
                                    label: 'Suppress forever',
                                    info: 'Local storage, no expiry',
                                    item: button({
                                        ...popBtn(Icon.info({intent: 'primary'})),
                                        text: 'Show tip',
                                        onClick: () =>
                                            XH.alert({
                                                title: 'Tip',
                                                icon: Icon.info({intent: 'primary'}),
                                                message:
                                                    'Press ? at any time to see the keyboard shortcuts for this page.',
                                                messageKey: 'tbMessagesOnboardingTip',
                                                suppress: true
                                            }).then(responseToast)
                                    })
                                }),
                                hbox({
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    item: button({
                                        icon: Icon.reset(),
                                        text: 'Clear suppress state',
                                        onClick: () => model.clearSuppressState()
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
class MessagesPanelModel extends HoistModel {
    // Playground props
    @bindable accessor pgTitle = 'Message';
    @bindable accessor pgMessage = 'This is a Message.';
    @bindable accessor pgIcon = false;
    @bindable accessor pgIntent: Intent = 'primary';
    @bindable accessor pgConfirmText = 'OK';
    @bindable accessor pgCancelText = 'Cancel';
    @bindable accessor pgExtraConfirm = false;
    @bindable accessor pgDismissable = true;
    @bindable accessor pgCancelOnDismiss = true;

    /** Forget the responses saved by the Suppress examples, so their messages show again. */
    clearSuppressState() {
        SUPPRESS_KEYS.forEach(key => {
            XH.localStorageService.remove(`xhSuppressedMessage.${key}`);
            XH.sessionStorageService.remove(`xhSuppressedMessage.${key}`);
        });
        XH.toast('Cleared suppress state');
    }

    /** The live spec for the Playground message. */
    get pgSpec(): MessageSpec {
        const {pgIcon, pgIntent, pgConfirmText, pgCancelText} = this,
            ret: MessageSpec = {
                title: this.pgTitle,
                message: this.pgMessage,
                icon: pgIcon ? Icon.info({intent: pgIntent}) : null
            };
        // Optional keys are added only when set, leaving the framework defaults otherwise.
        if (pgConfirmText) ret.confirmProps = {text: pgConfirmText};
        if (pgCancelText) ret.cancelProps = {text: pgCancelText};
        if (this.pgExtraConfirm) ret.extraConfirmText = 'CONFIRM';
        if (!this.pgDismissable) ret.dismissable = false;
        if (!this.pgCancelOnDismiss) ret.cancelOnDismiss = false;
        return ret;
    }

    get pgIconSnippet(): string {
        const {pgIntent} = this;
        return pgIntent ? `Icon.info({intent: '${pgIntent}'})` : 'Icon.info()';
    }
}

// messageKeys of the Suppress examples - MessageModel stores each saved response under
// `xhSuppressedMessage.<messageKey>` in the storage the example names.
const SUPPRESS_KEYS = ['tbMessagesDelayedData', 'tbMessagesOnboardingTip'];
