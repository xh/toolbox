import {hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {sampleForm} from '../../../../desktop/common/form/SampleForm';

export const formPanel = hoistCmp.factory({
    render() {
        return panel({
            height: '100%',
            item: sampleForm()
        });
    }
});
