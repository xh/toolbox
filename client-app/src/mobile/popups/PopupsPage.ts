import {hoistCmp, XH} from '@xh/hoist/core';
import {div, fragment, span} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {button} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {exampleScreen} from '../cmp/example/ExampleScreen';

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
                {url: '$TB/client-app/src/mobile/popups/PopupsPage.ts', notes: 'This example.'}
            ],
            item: panel({
                className: 'tb-page xh-tiled-bg',
                scrollable: true,
                items: [
                    renderCard('Alert', () => {
                        XH.alert({
                            title: 'Alert',
                            message: 'This is an alert dialog.'
                        });
                    }),
                    renderCard('Confirm', () => {
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
                    renderCard('Extra Confirm', () => {
                        XH.confirm({
                            title: 'Extra Confirm',
                            message: 'This is a confirm dialog with extra confirm.',
                            extraConfirmText: 'I agree'
                        });
                    }),
                    renderCard('Prompt', () => {
                        XH.prompt<string>({
                            title: 'Prompt',
                            message: 'This is a prompt dialog.'
                        }).then(ret =>
                            XH.toast({
                                message: span(`That popup resolved to ${ret}`)
                            })
                        );
                    }),
                    renderCard('Message', () => {
                        XH.confirm({
                            title: 'Message',
                            icon: Icon.comment(),
                            message: 'Messages are highly configurable.',
                            confirmProps: {text: 'Ok, got it', icon: Icon.thumbsUp()},
                            cancelProps: {text: 'Exit', intent: 'danger'},
                            cancelAlign: 'left'
                        });
                    }),
                    renderCard('Toast', () => {
                        XH.toast({
                            message: 'This is a toast.',
                            icon: Icon.comment()
                        });
                    }),
                    renderCard('Danger Toast', () => {
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

function renderCard(title, onClick) {
    return div({
        className: 'tb-card',
        items: [
            div({className: 'tb-card__title', item: title}),
            button({
                text: `Show ${title}`,
                onClick
            })
        ]
    });
}
