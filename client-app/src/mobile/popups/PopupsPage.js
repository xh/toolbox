import {XH, hoistCmp} from '@xh/hoist/core';
import {div, span, code} from '@xh/hoist/cmp/layout';
import {page} from '@xh/hoist/mobile/cmp/page';
import {button} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';

export const PopupsPage = hoistCmp({
    render() {
        return page({
            title: 'Popups',
            icon: Icon.comment(),
            className: 'toolbox-page xh-tiled-bg',
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
                    }).then(ret => XH.toast({
                        message: span('That popup resolved to ', code(`${ret}`)),
                        intent: ret ? 'success' : 'danger'
                    }));
                }),
                renderCard('Prompt', () => {
                    XH.prompt({
                        title: 'Prompt',
                        message: 'This is a prompt dialog.'
                    }).then(ret => XH.toast({
                        message: span('That popup resolved to ', code(`${ret}`))
                    }));
                }),
                renderCard('Message', () => {
                    XH.confirm({
                        title: 'Message',
                        icon: Icon.comment(),
                        message: 'Messages are highly configurable.',
                        confirmProps: {text: 'Ok, got it', icon: Icon.thumbsUp()},
                        cancelProps: {text: 'Exit'}
                    });
                }),
                renderCard('Toast', () => {
                    XH.toast({
                        message: 'This is a toast.',
                        icon: Icon.comment()
                    });
                })
            ]
        });
    }
});

function renderCard(title, onClick) {
    return div({
        className: 'toolbox-card',
        items: [
            div({className: 'toolbox-card__title', item: title}),
            button({
                text: `Show ${title}`,
                onClick
            })
        ]
    });
}