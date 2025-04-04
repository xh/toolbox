import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {FormPersistenceTestModel} from './FormPersistenceTestModel';

export const FormPersistenceTestPanel = hoistCmp({
    model: creates(FormPersistenceTestModel),

    render({model}) {
        return panel({});
    }
});
