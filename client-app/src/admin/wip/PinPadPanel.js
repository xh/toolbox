import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {creates} from '@xh/hoist/core/modelspec';
import {PinPadModel} from '@xh/hoist/mobile/cmp/auth/PinPadModel';
import {pinPad} from '@xh/hoist/mobile/cmp/auth/PinPad';

export const pinPadPanel = hoistCmp.factory({
    model: creates(() => new PinPadModel({
        pinLength: 4,
        headerText: 'Enter your pin...',
        onPinComplete: function(res) {
            this.setSubHeaderText('checking pin...');
            this.setDisabled(true);
            setTimeout(() => {
                if (JSON.stringify(res) == JSON.stringify([1, 2, 3, 4])) {
                    this.setErrorText('');
                    this.setHeaderText('access granted');
                    this.setDisabled(false);
                } else {
                    this.setErrorText('pin incorrect.');
                    this.clear();
                    this.setDisabled(false);
                }
            }, 500);
        }
    })),

    render() {
        return panel(pinPad());
    }
});