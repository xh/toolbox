/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2018 Extremely Heavy Industries Inc.
 */

import {Component} from 'react';
import {XH, HoistComponent, elemFactory} from '@xh/hoist/core';
import {div} from '@xh/hoist/cmp/layout';
import {page} from '@xh/hoist/mobile/cmp/page';
import {button} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';

@HoistComponent
export class PopupsPage extends Component {

    render() {
        return page({
            className: 'toolbox-page',
            items: [
                this.renderCard('Alert', () => {
                    XH.alert({
                        title: 'Alert',
                        message: 'This is an alert dialog.'
                    });
                }),
                this.renderCard('Confirm', () => {
                    XH.confirm({
                        title: 'Confirm',
                        message: 'This is a confirm dialog.'
                    });
                }),
                this.renderCard('Message', () => {
                    XH.confirm({
                        title: 'Message',
                        icon: Icon.comment(),
                        message: 'Messages are highly configurable.',
                        confirmText: 'Ok, got it',
                        cancelText: 'Exit'
                    });
                }),
                this.renderCard('Toast', () => {
                    XH.toast({
                        message: 'This is a toast.',
                        icon: Icon.comment()
                    });
                })
            ]
        });
    }

    renderCard(title, onClick) {
        return div({
            className: 'toolbox-card',
            items: [
                div({className: 'toolbox-card__title', item: title}),
                button({
                    text: `Show ${title}`,
                    onClick: onClick
                })
            ]
        });
    }

}

export const popupsPage = elemFactory(PopupsPage);