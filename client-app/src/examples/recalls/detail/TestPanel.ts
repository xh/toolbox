import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';

export class TestPanelModel extends HoistModel {
    get testObj() {
        return this.componentProps.testObj;
    }
}

export const testPanel = hoistCmp.factory({
    model: creates(TestPanelModel),

    render({model}) {
        // const {testObj} = model;
        console.log('render test panel');

        return 'hello';
    }
});
