import {page} from '@xh/hoist/mobile/cmp/page';
import {pinPad} from '@xh/hoist/mobile/cmp/auth/PinPad';
import {PinPadModel} from '@xh/hoist/mobile/cmp/auth/PinPadModel';
import {creates} from '@xh/hoist/core/modelspec';
import {hoistCmp} from '@xh/hoist/core';

export const pinPadPage = hoistCmp.factory({
    model: creates(() => new PinPadModel({
        pinLength: 5,
        headerText: 'Enter PIN...',
        onPinComplete: function(res) {
            this.setSubHeaderText('Checking PIN...');
            this.setDisabled(true);
            setTimeout(() => {
                if (JSON.stringify(res) == JSON.stringify([1, 2, 3, 4, 5])) {
                    this.setErrorText('');
                    this.setHeaderText('Access Granted.');
                    this.setSubHeaderText('Welcome to XH.io');
                } else {
                    this.setErrorText('PIN incorrect. Try again.');
                    this.clear();
                    this.setDisabled(false);
                }
            }, 500);
        }
    })),

    render() {
        return page(pinPad());
    }
});