import {box, div, li, p, span, table, tbody, td, th, tr, ul} from '@xh/hoist/cmp/layout';
import {hoistCmp, XH} from '@xh/hoist/core';
import {lengthIs, required} from '@xh/hoist/data';
import {button} from '@xh/hoist/desktop/cmp/button';
import {textArea} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {useRef} from 'react';
import {wrapper} from '../../common';
import './PopupsPanel.scss';

export const popupsPanel = hoistCmp.factory(() => {
    const divRef = useRef(null),
        acceptRichTextReminder = getRichTextReminder(),
        responseToast = ret =>
            XH.toast({
                message: span(`That popup resolved to ${ret}`),
                intent: ret ? 'success' : 'danger',
                icon: ret ? Icon.check() : Icon.x(),
                containerRef: divRef.current
            });

    return wrapper({
        description: div(
            p('Popups notify users about important events or prompt them to confirm an action.'),
            p(
                'The Message component supports for modal alerts in Hoist, but is not typically used directly by an application. Instead, the XH.message(), XH.alert(), XH.confirm(), and XH.prompt() methods provide convenient APIs for apps to trigger the display of Messages.'
            ),
            p(
                'For non-modal notifications, consider using XH.toast() or XH.showBanner().'
            )
        ),
        item: box({
            className: 'tbox-popups',
            ref: divRef,
            item: table(
                tbody(
                    row(
                        button({
                            ...popBtn(Icon.warning({className: 'xh-red'})),
                            text: 'Alert',
                            onClick: () =>
                                XH.alert({
                                    title: 'Alert',
                                    message: div(
                                        p('This is an Alert. Alerts come with one button: "OK"'),
                                        acceptRichTextReminder
                                    )
                                })
                        }),
                        button({
                            ...popBtn(Icon.warning({className: 'xh-red-muted'})),
                            text: 'with custom button',
                            onClick: () =>
                                XH.alert({
                                    title: 'Alert with custom button',
                                    message: p(
                                        'This is also an Alert. Here, we customized the appearance of the button via confirmProps.'
                                    ),
                                    confirmProps: {
                                        intent: 'success',
                                        minimal: false,
                                        icon: Icon.checkCircle()
                                    }
                                })
                        }),
                        button({
                            ...popBtn(Icon.warning({className: 'xh-red-muted'})),
                            text: 'as promise',
                            onClick: () =>
                                XH.alert({
                                    title: 'Alert with callback',
                                    message: p(
                                        'Alert returns a promise that resolves to true when acknowledged.'
                                    )
                                }).then(responseToast)
                        })
                    ),
                    row(
                        button({
                            ...popBtn(Icon.questionCircle({className: 'xh-blue-dark'})),
                            text: 'Confirm',
                            onClick: () =>
                                XH.confirm({
                                    title: 'Confirm',
                                    message: div(
                                        p(
                                            'This is a confirm. Confirms come with two buttons: "OK" and "Cancel".'
                                        ),
                                        acceptRichTextReminder
                                    )
                                })
                        }),
                        button({
                            ...popBtn(Icon.questionCircle({className: 'xh-blue-muted'})),
                            text: 'with custom button',
                            onClick: () =>
                                XH.confirm({
                                    title: 'Confirm with custom buttons',
                                    message: p(
                                        'This is also an Alert. Here, we customized the appearance of the buttons and set the cancel button to autoFocus via confirmProps, cancelProps, and cancelAlign.'
                                    ),
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
                                })
                        }),
                        button({
                            ...popBtn(Icon.questionCircle({className: 'xh-blue-muted'})),
                            text: 'as promise',
                            onClick: () =>
                                XH.confirm({
                                    title: 'Confirm with promise',
                                    message: p(
                                        'Confirm returns a promise that resolves to true if the user confirms or false if the user cancels.'
                                    )
                                }).then(responseToast)
                        })
                    ),
                    row(
                        button({
                            ...popBtn(Icon.edit({className: 'xh-blue-light'})),
                            text: 'Prompt',
                            onClick: () =>
                                XH.prompt<string>({
                                    title: 'Prompt',
                                    message: div(
                                        p(
                                            'This is a prompt. Prompt comes with two buttons: "OK" and "Cancel" and supports an input field to collect a response from the user.'
                                        ),
                                        acceptRichTextReminder
                                    )
                                })
                        }),
                        button({
                            ...popBtn(Icon.edit({className: 'xh-blue-light'})),
                            text: 'with customizations',
                            onClick: () =>
                                XH.prompt<string>({
                                    title: 'Prompt with customizations',
                                    message: div(
                                        p(
                                            'This is also a Prompt. Here, we set the input to a custom textArea with validation via input and customized the buttons via confirmProps, cancelProps, and cancelAlign.'
                                        ),
                                        p(
                                            'This Prompt cannot be dismissed by hitting the escape key or clicking on the background. The cancel or send buttons must be clicked to close it. This behavior is controlled via dismissable and cancelOnDismiss.'
                                        )
                                    ),
                                    input: {
                                        initialValue: 'I must be at least 20 characters to send...',
                                        item: textArea({autoFocus: true, selectOnFocus: true}),
                                        rules: [required, lengthIs({min: 20})]
                                    },
                                    confirmProps: {
                                        text: 'Send a Message',
                                        icon: Icon.mail(),
                                        intent: 'primary'
                                    },
                                    cancelProps: {intent: 'danger'},
                                    cancelAlign: 'left',
                                    dismissable: false
                                })
                        }),
                        button({
                            ...popBtn(Icon.edit({className: 'xh-blue-light'})),
                            text: 'as promise',
                            onClick: () =>
                                XH.prompt<string>({
                                    title: 'Prompt with promise',
                                    message: p(
                                        "Prompt return a promise that resolves to the input's value if user confirms, or false if user cancels."
                                    )
                                }).then(responseToast)
                        })
                    ),
                    row(
                        button({
                            ...popBtn(Icon.comment({className: 'xh-green'})),
                            text: 'Message',
                            onClick: () =>
                                XH.message({
                                    title: 'Message',
                                    message: div(
                                        p('Messages are highly configurable - Alerts and Confirms are simply preconfigured Messages.'),
                                        p(
                                            'Note, without valid confirmProps or cancelProps, the displayed Message will have no buttons!'
                                        ),
                                        p('This message has the primary button set to autoFocus.'),
                                        acceptRichTextReminder
                                    ),
                                    confirmProps: {text: 'Oh I see!'},
                                    cancelProps: {icon: Icon.xCircle()}
                                })
                        }),
                        button({
                            ...popBtn(Icon.comment({className: 'xh-green-muted'})),
                            text: 'with callbacks',
                            onClick: () =>
                                XH.message({
                                    title: 'Message with callbacks',
                                    message: p(
                                        'You can also pass a function to Message, Alert, and Confirm via the onCancel and onConfirm callback configs.'
                                    ),
                                    confirmProps: {text: 'Trigger onConfirm()'},
                                    onConfirm: () =>
                                        XH.toast({
                                            message: 'Called onConfirm',
                                            containerRef: divRef.current
                                        }),
                                    cancelProps: {text: 'Trigger onCancel()'},
                                    onCancel: () =>
                                        XH.toast({
                                            message: 'Called onCancel',
                                            icon: Icon.x(),
                                            intent: 'danger',
                                            containerRef: divRef.current
                                        })
                                })
                        }),
                        button({
                            ...popBtn(Icon.comment({className: 'xh-green-muted'})),
                            text: 'as promise',
                            onClick: () =>
                                XH.message({
                                    title: 'Message with promise',
                                    message: div(
                                        p(
                                            'Messages, Prompts, Alerts, and Confirms all return a promise...'
                                        ),
                                        ul(
                                            li(
                                                'Alert promises resolve to true when user acknowledges alert. '
                                            ),
                                            li(
                                                'Confirm and Message promises resolve to true if user confirms, or false if user cancels.'
                                            ),
                                            li(
                                                'Prompt promises resolve to the entered value if user confirms, or false if user cancels.'
                                            )
                                        )
                                    ),
                                    confirmProps: {text: 'Resolve to true'},
                                    cancelProps: {text: 'Resolve to false'}
                                }).then(responseToast)
                        })
                    ),
                    row(
                        button({
                            ...popBtn(Icon.flag({className: 'xh-blue-dark'})),
                            text: 'Banner',
                            onClick: () =>
                                XH.showBanner({
                                    message:
                                        'This is a Banner. Banners are highly configurable, and can display rich text by accepting strings, JSX, and React elements.'
                                })
                        }),
                        button({
                            ...popBtn(Icon.flag({className: 'xh-blue-muted'})),
                            text: 'with intent + icon',
                            onClick: () =>
                                XH.showBanner({
                                    message: "This is a Banner with intent: 'danger'",
                                    icon: Icon.skull(),
                                    intent: 'danger'
                                })
                        }),
                        button({
                            ...popBtn(Icon.flag({className: 'xh-blue-muted'})),
                            text: 'with action',
                            onClick: () =>
                                XH.showBanner({
                                    message:
                                        'This is a Banner with an action button. The action button can be configured to execute custom functionality.',
                                    icon: Icon.flag(),
                                    actionButtonProps: {
                                        text: 'Click me!',
                                        intent: 'success',
                                        onClick: () => {
                                            XH.toast({message: 'Action button clicked!'});
                                            XH.hideBanner();
                                        }
                                    }
                                })
                        })
                    ),
                    row(
                        button({
                            ...popBtn(Icon.toast({className: 'xh-orange'})),
                            text: 'Toast',
                            onClick: () =>
                                XH.toast({
                                    message: 'This is a Toast. Bottom right of app by default.'
                                })
                        }),
                        button({
                            ...popBtn(Icon.toast({className: 'xh-orange-muted'})),
                            text: 'with custom timeout',
                            onClick: () =>
                                XH.toast({
                                    message: span(
                                        'This is a Toast has a timeout: 10000. Ten seconds can seem like forever, right?'
                                    ),
                                    timeout: 10000
                                })
                        }),
                        button({
                            ...popBtn(Icon.toast({className: 'xh-orange-muted'})),
                            text: 'with containerRef',
                            onClick: () =>
                                XH.toast({
                                    message: span(
                                        'This is a Toast anchored using containerRef'
                                    ),
                                    containerRef: divRef.current
                                })
                        })
                    ),
                    row(
                        '',
                        button({
                            ...popBtn(Icon.toast({className: 'xh-orange-muted'})),
                            text: 'with position',
                            onClick: () =>
                                XH.toast({
                                    position: 'top-center',
                                    message: span(
                                        'This is a Toast with position: top-center'
                                    )
                                })
                        }),
                        button({
                            ...popBtn(Icon.toast({className: 'xh-orange-muted'})),
                            text: 'with intent + icon',
                            onClick: () =>
                                XH.dangerToast({
                                    message: div(
                                        'This calls XH.dangerToast() to set an intent and icon suitable for an alert when something goes wrong.'
                                    )
                                })
                        })
                    )
                )
            )
        })
    });
});

function popBtn(icon) {
    return {
        className: 'tbox-popups__button',
        icon: icon,
        minimal: false
    };
}

function row(col1, col2, col3) {
    return tr(th(col1), td(col2), td(col3));
}

function getRichTextReminder() {
    return p(
        'Good to know: Alert, Confirm, Prompt, and Message can display rich text by accepting strings, JSX, and React elements. '
    );
}
