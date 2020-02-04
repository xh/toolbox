import {hoistCmp, HoistModel, useLocalModel} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {pinPad} from '@xh/hoist/mobile/cmp/auth/PinPad';
import {PinPadModel} from '@xh/hoist/mobile/cmp/auth/PinPadModel';
import {bindable} from '@xh/hoist/mobx';
import {p} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/mobile/cmp/panel';

import './PinPadPage.scss';

export const pinPadPage = hoistCmp.factory({
    render() {
        const model = useLocalModel(LocalModel);
        return page(
            model.loggedIn ?
                panel({
                    className: 'toolbox-page pinpad-page-secrets',
                    title: 'Secret plans',
                    items: [
                        p('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam porta velit varius augue fermentum, vulputate tempus magna tempus.'),
                        p('Fusce consectetur malesuada vehicula. Aliquam commodo magna at porta sollicitudin. Sed laoreet vehicula leo vel aliquam. Aliquam auctor fringilla ex, nec iaculis felis tincidunt ac. Pellentesque blandit ipsum odio, vel lacinia arcu blandit non.'),
                        p('Vestibulum non libero sem. Mauris a ipsum elit. Donec vestibulum sodales dapibus. Mauris posuere facilisis mollis. Etiam nec mauris nunc. Praesent mauris libero, blandit gravida ullamcorper vel, condimentum et velit. Suspendisse fermentum odio ac dui aliquet semper. Duis arcu felis, accumsan in leo sit amet, vehicula imperdiet tellus. Nulla ut condimentum quam. Donec eget mauris vitae libero blandit facilisis efficitur id justo.'),
                        p('Nam et tincidunt risus, at faucibus enim. Aliquam tortor est, finibus ac metus id, eleifend auctor quam. Aenean purus odio, tempus interdum velit et, faucibus placerat nisi. Etiam eget nunc vehicula, eleifend justo quis, varius leo. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Mauris bibendum mollis tempor.'),
                        p('Fusce ac sollicitudin nunc, at tempus sem. Fusce dapibus lorem malesuada vestibulum luctus. Etiam semper est in ligula sagittis facilisis. Phasellus accumsan placerat ex, eu fringilla mauris semper nec.')
                    ]
                }) :
                pinPad({model: model.model})
        );
    }
});

@HoistModel
class LocalModel {
    model;
    attempts = 0;
    @bindable
    loggedIn = false;
    constructor() {
        this.model = new PinPadModel({
            pinLength: 5,
            headerText: 'Enter PIN...'
        });

        this.addReaction({
            track: () => this.model.completedPin,
            run: (completedPin) => {
                const {model} = this;
                if (!completedPin) {
                    return;
                }
                model.setSubHeaderText('Checking PIN...');
                model.setDisabled(true);
                setTimeout(() => {
                    this.handleCompletedPin(completedPin);
                }, 500);
            }
        });
    }

    handleCompletedPin(completedPin) {
        const {model} = this;
        if (completedPin == '12345') {
            model.setErrorText('');
            model.setHeaderText('Access Granted.');
            model.setSubHeaderText('Welcome to XH.io');
            setTimeout(() => {
                this.setLoggedIn(true);
            }, 1000);
        } else if (this.attempts >= 5) {
            model.setHeaderText('Account Locked.');
            model.setSubHeaderText('Login disabled at this time.');
            model.setErrorText('You have made too many attempts to log in. Contact support for help.');
        } else {
            model.setErrorText(`PIN not recognized. Try again. Account will be locked after ${5 - this.attempts} attempts.`);
            model.setSubHeaderText('Access Denied.');
            model.setDisabled(false);
            model.clear();
            this.attempts++;
        }
    }
}