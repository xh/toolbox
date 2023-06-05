import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {h3, p} from '@xh/hoist/cmp/layout';
import {action, observable, makeObservable} from '@xh/hoist/mobx';
import {pinPad, PinPadModel} from '@xh/hoist/cmp/pinpad';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {wait} from '@xh/hoist/promise';

import './PinPadPanel.scss';
import {wrapper} from '../../common';

export const pinPadPanel = hoistCmp.factory({
    model: creates(() => PinPadPanelModel),

    render({model}) {
        return wrapper({
            description: 'A specialized PIN input, used for lightweight authentication of users.',
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/PinPadPanel.ts',
                    notes: 'This example.'
                },
                {url: '$HR/cmp/pinpad/PinPad.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/pinpad/PinPadModel.ts',
                    notes: 'Hoist component model - primary API and configuration point for pin pads.'
                }
            ],
            item: panel({
                title: 'Other › PinPad',
                icon: Icon.unlock(),
                width: 380,
                height: 500,
                className: 'tb-pinpad-container',
                item: !model.loggedIn ? pinPad() : secretPlans(),
                bbar: [
                    button({
                        text: 'Reset',
                        icon: Icon.reset(),
                        onClick: () => model.reset()
                    })
                ]
            })
        });
    }
});

const secretPlans = hoistCmp.factory(() =>
    panel({
        className: 'tb-pinpad-container__secrets',
        items: [
            h3('Secret plans'),
            p(
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam porta velit varius augue fermentum, vulputate tempus magna tempus.'
            ),
            p(
                'Fusce consectetur malesuada vehicula. Aliquam commodo magna at porta sollicitudin. Sed laoreet vehicula leo vel aliquam. Aliquam auctor fringilla ex, nec iaculis felis tincidunt ac. Pellentesque blandit ipsum odio, vel lacinia arcu blandit non.'
            ),
            p(
                'Vestibulum non libero sem. Mauris a ipsum elit. Donec vestibulum sodales dapibus. Mauris posuere facilisis mollis. Etiam nec mauris nunc. Praesent mauris libero, blandit gravida ullamcorper vel, condimentum et velit. Suspendisse fermentum odio ac dui aliquet semper. Duis arcu felis, accumsan in leo sit amet, vehicula imperdiet tellus. Nulla ut condimentum quam. Donec eget mauris vitae libero blandit facilisis efficitur id justo.'
            ),
            p(
                'Nam et tincidunt risus, at faucibus enim. Aliquam tortor est, finibus ac metus id, eleifend auctor quam. Aenean purus odio, tempus interdum velit et, faucibus placerat nisi. Etiam eget nunc vehicula, eleifend justo quis, varius leo. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Mauris bibendum mollis tempor.'
            ),
            p(
                'Fusce ac sollicitudin nunc, at tempus sem. Fusce dapibus lorem malesuada vestibulum luctus. Etiam semper est in ligula sagittis facilisis. Phasellus accumsan placerat ex, eu fringilla mauris semper nec.'
            )
        ]
    })
);

class PinPadPanelModel extends HoistModel {
    @managed
    pinPadModel = new PinPadModel({
        pinLength: 5,
        headerText: 'Enter PIN...'
    });

    attempts = 0;
    maxAttempts = 5;

    @observable loggedIn = false;

    constructor() {
        super();
        makeObservable(this);
        const {pinPadModel: pad} = this;
        this.addReaction({
            track: () => pad.completedPin,
            run: completedPin => {
                if (!completedPin) return;

                pad.subHeaderText = 'Checking PIN...';
                pad.disabled = true;
                wait(500).then(() => this.handleCompletedPin(completedPin));
            }
        });
    }

    @action
    handleCompletedPin(completedPin) {
        const {pinPadModel: pad, attempts, maxAttempts} = this;
        if (completedPin === '12345') {
            pad.errorText = '';
            pad.headerText = 'Access Granted.';
            pad.subHeaderText = 'Welcome to XH.io';
            wait(1000).thenAction(() => (this.loggedIn = true));
        } else if (attempts >= maxAttempts) {
            pad.headerText = 'Account Locked.';
            pad.subHeaderText = 'Login disabled at this time.';
            pad.errorText = 'You have made too many attempts to log in. Contact support for help.';
        } else {
            pad.errorText = `PIN not recognized. Try again. Account will be locked after ${
                5 - attempts
            } attempts.`;
            pad.subHeaderText =
                attempts === maxAttempts - 2
                    ? 'Access Denied. (Use the Schwartz!)'
                    : attempts === maxAttempts - 1
                    ? "Access Denied. (Try '12345')"
                    : 'Access Denied';
            pad.disabled = false;
            pad.clear();

            this.attempts++;
        }
    }

    @action
    reset() {
        const {pinPadModel: pad} = this;

        pad.headerText = 'Enter PIN...';
        pad.subHeaderText = '';
        pad.errorText = '';
        pad.disabled = false;
        pad.clear();

        this.attempts = 0;
        this.loggedIn = false;
    }
}
