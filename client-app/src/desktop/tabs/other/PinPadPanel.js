import React from 'react';
import {creates, hoistCmp, HoistModel, managed} from '@xh/hoist/core';
import {h3, p} from '@xh/hoist/cmp/layout';
import {bindable} from '@xh/hoist/mobx';
import {pinPad, PinPadModel} from '@xh/hoist/cmp/pinpad';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {wait} from '@xh/hoist/promise';

import './PinPadPanel.scss';
import {wrapper} from '../../common/Wrapper';

export const pinPadPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render({model}) {
        return wrapper({
            description: [
                <p>A specialized PIN input, used for lightweight authentication of users.</p>
            ],
            links: [
                {url: '$TB/client-app/src/desktop/tabs/other/PinPadPanel.js', notes: 'This example.'},
                {url: '$HR/cmp/pinpad/PinPad.js', notes: 'Hoist component.'},
                {url: '$HR/cmp/pinpad/PinPadModel.js', notes: 'Hoist component model - primary API and configuration point for pin pads.'}
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

const secretPlans = hoistCmp.factory(
    () => panel({
        className: 'tb-pinpad-container__secrets',
        items: [
            h3('Secret plans'),
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

    reset() {
        const {pinPadModel: pad} = this;

        pad.setHeaderText('Enter PIN...');
        pad.setSubHeaderText('');
        pad.setErrorText('');
        pad.setDisabled(false);
        pad.clear();

        this.attempts = 0;
        this.setLoggedIn(false);
    }
}