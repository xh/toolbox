import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {pinPad, PinPadModel} from '@xh/hoist/cmp/pinpad';
import {bindable} from '@xh/hoist/mobx';
import {p} from '@xh/hoist/cmp/layout';
import {wait} from '@xh/hoist/promise';
import './PinPadPage.scss';

export const pinPadPage = hoistCmp.factory({

    model: creates(() => new Model()),

    render({model}) {
        return !model.loggedIn ? pinPad() : secretPlans();
    }
});

const secretPlans = hoistCmp.factory(
    () => panel({
        className: 'toolbox-page pinpad-page-secrets',
        title: 'Secret plans',
        items: [
            p('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam porta velit varius augue fermentum, vulputate tempus magna tempus.'),
            p('Fusce consectetur malesuada vehicula. Aliquam commodo magna at porta sollicitudin. Sed laoreet vehicula leo vel aliquam. Aliquam auctor fringilla ex, nec iaculis felis tincidunt ac. Pellentesque blandit ipsum odio, vel lacinia arcu blandit non.'),
            p('Vestibulum non libero sem. Mauris a ipsum elit. Donec vestibulum sodales dapibus. Mauris posuere facilisis mollis. Etiam nec mauris nunc. Praesent mauris libero, blandit gravida ullamcorper vel, condimentum et velit. Suspendisse fermentum odio ac dui aliquet semper. Duis arcu felis, accumsan in leo sit amet, vehicula imperdiet tellus. Nulla ut condimentum quam. Donec eget mauris vitae libero blandit facilisis efficitur id justo.'),
            p('Nam et tincidunt risus, at faucibus enim. Aliquam tortor est, finibus ac metus id, eleifend auctor quam. Aenean purus odio, tempus interdum velit et, faucibus placerat nisi. Etiam eget nunc vehicula, eleifend justo quis, varius leo. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Mauris bibendum mollis tempor.'),
            p('Fusce ac sollicitudin nunc, at tempus sem. Fusce dapibus lorem malesuada vestibulum luctus. Etiam semper est in ligula sagittis facilisis. Phasellus accumsan placerat ex, eu fringilla mauris semper nec.')
        ]
    })
);

class Model extends HoistModel {

    @managed
    pinPadModel = new PinPadModel({
        pinLength: 5,
        headerText: 'Enter PIN...'
    });

    attempts = 0;
    maxAttempts = 5;

    @bindable loggedIn = false;

    constructor() {
        super();
        const {pinPadModel: pad} = this;
        this.addReaction({
            track: () => pad.completedPin,
            run: (completedPin) => {
                if (!completedPin) return;

                pad.setSubHeaderText('Checking PIN...');
                pad.setDisabled(true);
                wait(500).then(() => this.handleCompletedPin(completedPin));
            }
        });
    }

    handleCompletedPin(completedPin) {
        const {pinPadModel: pad, attempts, maxAttempts} = this;
        if (completedPin === '12345') {
            pad.setErrorText('');
            pad.setHeaderText('Access Granted.');
            pad.setSubHeaderText('Welcome to XH.io');
            wait(1000).then(() => this.setLoggedIn(true));
        } else if (attempts >= maxAttempts) {
            pad.setHeaderText('Account Locked.');
            pad.setSubHeaderText('Login disabled at this time.');
            pad.setErrorText('You have made too many attempts to log in. Contact support for help.');
        } else {
            pad.setErrorText(`PIN not recognized. Try again. Account will be locked after ${5 - attempts} attempts.`);
            pad.setSubHeaderText(
                attempts === maxAttempts - 2 ? 'Access Denied. (Use the Schwartz!)' :
                    attempts === maxAttempts - 1 ? 'Access Denied. (Try \'12345\')' :
                        'Access Denied'
            );
            pad.setDisabled(false);
            pad.clear();

            this.attempts++;
        }
    }
}