import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';

@HoistModel
export class InputTestModel {
    @bindable value = null;

    componentName;
    props;
    scope;

    constructor({componentName, props, scope, value}) {
        this.componentName = componentName;
        this.props = props;
        this.scope = scope;
        this.value = value;
    }
}
