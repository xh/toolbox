import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {p} from '@xh/hoist/cmp/layout';
import {Icon} from '@xh/hoist/icon';
import {pinPad, PinPadModel} from '@xh/hoist/cmp/pinpad';
import {action, observable} from '@xh/hoist/mobx';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {wait} from '@xh/hoist/promise';
import {exampleAction, exampleScreen} from '../cmp/example/ExampleScreen';
import './PinPadPage.scss';

export const pinPadPage = hoistCmp.factory({
    model: creates(() => PinPadPageModel),

    render({model}) {
        return exampleScreen({
            title: 'PinPad',
            icon: Icon.unlock(),
            description: [
                '`PinPad` is a specialized numeric input for lightweight authentication, such as',
                'unlocking a kiosk or confirming a sensitive action.',
                '',
                'Its `PinPadModel` drives the displayed header, subheader, and error text and exposes',
                'the entered value, letting the application validate the PIN, enforce attempt limits,',
                'and lock out repeated failures.',
                '',
                'Enter the PIN **12345** below to unlock the demo.'
            ],
            options: [
                exampleAction({
                    text: 'Reset',
                    icon: Icon.reset(),
                    onClick: () => model.reset()
                })
            ],
            links: [
                {url: '$TB/client-app/src/mobile/pinPad/PinPadPage.ts', notes: 'This example.'},
                {url: '$HR/cmp/pinpad/PinPad.ts', notes: 'Hoist component.'},
                {
                    url: '$HR/cmp/pinpad/PinPadModel.ts',
                    notes: 'Hoist component model - primary API and configuration point for pin pads.'
                }
            ],
            item: !model.loggedIn ? pinPad() : secretPlans()
        });
    }
});

const secretPlans = hoistCmp.factory(() =>
    panel({
        className: 'tb-page pinpad-page-secrets',
        title: 'Secret plans',
        items: [
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

class PinPadPageModel extends HoistModel {
    @managed
    pinPadModel: PinPadModel = new PinPadModel({
        pinLength: 5,
        headerText: 'Enter PIN...'
    });

    attempts: number = 0;
    maxAttempts: number = 5;

    @observable accessor loggedIn: boolean = false;

    constructor() {
        super();
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
    private handleCompletedPin(completedPin: string) {
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
