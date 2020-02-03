import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {creates} from '@xh/hoist/core/modelspec';
import {PinPadModel} from '@xh/hoist/mobile/cmp/auth/PinPadModel';
import {pinPad} from '@xh/hoist/mobile/cmp/auth/PinPad';

export const pinPadPanel = hoistCmp.factory({
    model: creates(() => new PinPadModel({
        numDigits: 4,
        headerText: 'Enter your pin...',
        onFinished: function(foo) {
            this.setErrorText('checking pin...');
            this.setDisabled(true);
            setTimeout(() => {
                if (JSON.stringify(foo) == JSON.stringify([1, 2, 3, 4])) {
                    this.setErrorText('');
                    this.setHeaderText('access granted');
                    this.setDisabled(false);
                } else {
                    this.setErrorText('pin incorrect.');
                    this.clear();
                    this.setDisabled(false);
                }
            }, 500);
        },
        disabled: false,
        errorText: 'locked out'
    })),

    render() {
        return panel(pinPad());
    }
});