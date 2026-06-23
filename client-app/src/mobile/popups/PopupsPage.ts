import {hoistCmp, XH} from '@xh/hoist/core';
import {div, fragment, span} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {button} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {exampleScreen} from '../cmp/example/ExampleScreen';
import './PopupsPage.scss';

export const popupsPage = hoistCmp.factory({
    render() {
        return exampleScreen({
            title: 'Popups',
            icon: Icon.comment(),
            description: [
                'Hoist surfaces alerts, confirms, prompts, configurable messages, and toasts through',
                'simple `XH` calls (most returning a Promise). Tap a card below to trigger one.'
            ],
            links: [
                {url: '$TB/client-app/src/mobile/popups/PopupsPage.ts', notes: 'This example.'},
                {
                    url: '$HR/appcontainer/README.md',
                    text: 'Dialogs & Toasts',
                    notes: 'Alerts, confirms, prompts, messages, toasts.'
                },
                {
                    url: '$HR/core/XH.ts',
                    text: 'XH',
                    notes: 'XH.alert / confirm / prompt / message / toast.'
                }
            ],
            item: panel({
                className: 'tb-page xh-tiled-bg',
                scrollable: true,
                items: [
                    renderCard('Alert', 'Single-button acknowledgement', () => {
                        XH.alert({
                            title: 'Alert',
                            message: 'This is an alert dialog.'
                        });
                    }),
                    renderCard('Confirm', 'Confirm or cancel a choice', () => {
                        XH.confirm({
                            title: 'Confirm',
                            message: 'This is a confirm dialog.'
                        }).then(ret =>
                            XH.toast({
                                message: span(`That popup resolved to ${ret}`),
                                intent: ret ? 'success' : 'danger'
                            })
                        );
                    }),
                    renderCard('Extra Confirm', 'Requires an explicit opt-in', () => {
                        XH.confirm({
                            title: 'Extra Confirm',
                            message: 'This is a confirm dialog with extra confirm.',
                            extraConfirmText: 'I agree'
                        });
                    }),
                    renderCard('Prompt', 'Collects text input', () => {
                        XH.prompt<string>({
                            title: 'Prompt',
                            message: 'This is a prompt dialog.'
                        }).then(ret =>
                            XH.toast({
                                message: span(`That popup resolved to ${ret}`)
                            })
                        );
                    }),
                    renderCard('Message', 'Custom buttons and icons', () => {
                        XH.confirm({
                            title: 'Message',
                            icon: Icon.comment(),
                            message: 'Messages are highly configurable.',
                            confirmProps: {text: 'Ok, got it', icon: Icon.thumbsUp()},
                            cancelProps: {text: 'Exit', intent: 'danger'},
                            cancelAlign: 'left'
                        });
                    }),
                    renderCard('Toast', 'Brief, auto-dismissing notice', () => {
                        XH.toast({
                            message: 'This is a toast.',
                            icon: Icon.comment()
                        });
                    }),
                    renderCard('Danger Toast', 'Error-styled toast', () => {
                        XH.dangerToast({
                            message: fragment('This is a toast shown via XH.dangerToast()'),
                            icon: Icon.skull()
                        });
                    })
                ]
            })
        });
    }
});

function renderCard(title, subtitle, onClick) {
    return div({
        className: 'tb-card tb-popups-card',
        items: [
            div({className: 'tb-card__title', item: title}),
            div({className: 'tb-popups-card__subtitle', item: subtitle}),
            button({
                text: `Show ${title}`,
                onClick
            })
        ]
    });
}
