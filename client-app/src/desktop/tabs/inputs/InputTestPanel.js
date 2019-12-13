import {Compiler, Error, Knobs, PropTypes as T, useView} from 'react-view';
import {wrapper} from '../../common';
import {div, hbox} from '@xh/hoist/cmp/layout';
import {elemFactory, hoistCmp} from '@xh/hoist/core';
import {uses} from '@xh/hoist/core/modelspec';
import template from '@babel/template';
import {forEach} from 'lodash';
import {InputTestModel} from './InputTestModel';
import './InputTestPanel.scss';
import {panel} from '@xh/hoist/desktop/cmp/panel';

export const inputTestPanel = hoistCmp.factory({

    model: uses(InputTestModel),

    render({model}) {
        const props = {
            bind: {
                value: 'value',
                type: T.Custom
            },
            disabled: {
                value: false,
                type: T.Boolean,
                description: 'True to disable user interaction. Can be set by parent FormField. '
            },
            onChange: {
                value: null,
                type: T.Function,
                description: 'Called when value changes - passed new and prior values. '
            },
            onCommit: {
                value: null,
                type: T.Function,
                description: 'Called when value is committed to backing model - passed new and prior values. '
            },
            ...model.props
        };

        // If we do not set stateful to true, then react-view will ignore false boolean props.
        // The input we are testing may use a default value of true, ignoring user input entirely.
        forEach(props, (v) => {if (v.type == T.Boolean) v.stateful = true;});

        const viewParams = useView({
            componentName: model.componentName,
            customProps: {
                ...model.customProps,
                bind: {
                    generate: () => {
                        return (template.ast('\'value\'', {plugins: ['jsx']}))
                            .expression;
                    },
                    parse: (code) => {}
                }
            },
            props,
            scope: model.scope
        });

        return wrapper({
            description: model.description,
            item: panel({
                title: model.componentName,
                className: 'input-test-panel',
                items: [
                    // TODO: move to two-column  format with input beside knobs
                    // TODO: add description to all panels
                    hbox(
                        div({
                            className: 'input-test-example',
                            items: [
                                // TODO: move displayValue to top right
                                div({className: 'input-test-example_value', item: displayValue(model.value)}),
                                div({className: 'input-test-example_input', item: compiler(viewParams.compilerProps)}),
                                div({className: 'input-test-example_error', item: error({...viewParams.errorProps})})
                            ]
                        }),
                        knobs(viewParams.knobProps)
                    )
                ]
            })
        });
    }
});

function displayValue(value) {
    let ret = String(value);
    if (value == null) {
        ret = '[Null Value]';
    } else if (ret.trim() === '') {
        ret = ret.length === 0 ? '[Empty String]' : '[Blank String]';
    }
    return ret;
}

const compiler = elemFactory(Compiler);
const knobs = elemFactory(Knobs);
const error = elemFactory(Error);