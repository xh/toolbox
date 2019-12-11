import {HoistModel} from '@xh/hoist/core';
import {bindable} from '@xh/hoist/mobx';

@HoistModel
export class InputTestModel {
    @bindable value = null;

    componentName;
    props;
    customProps;
    scope;
    description;

    constructor({componentName, props, customProps, scope, value, description}) {
        this.componentName = componentName;
        this.props = props;
        this.customProps = customProps;
        this.scope = scope;
        this.value = value;
        this.description = description;
    }
}
