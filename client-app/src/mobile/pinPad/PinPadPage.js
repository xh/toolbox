import {hoistCmp, HoistModel, useLocalModel} from '@xh/hoist/core';
import {page} from '@xh/hoist/mobile/cmp/page';
import {pinPad} from '@xh/hoist/mobile/cmp/auth/PinPad';
import {PinPadModel} from '@xh/hoist/mobile/cmp/auth/PinPadModel';

export const pinPadPage = hoistCmp.factory({
    render() {
        const model = useLocalModel(LocalModel);
        return page(pinPad({model: model.model}));
    }
});

@HoistModel
class LocalModel {
    model;
    attempts = 0;
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
                    if (completedPin == '12345') {
                        model.setErrorText('');
                        model.setHeaderText('Access Granted.');
                        model.setSubHeaderText('Welcome to XH.io');
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
                }, 500);
            }
        });
    }
}