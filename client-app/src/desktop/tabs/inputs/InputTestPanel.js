import {Compiler, Error, Knobs, PropTypes as PT, useView} from 'react-view';
import {wrapper} from '../../common';
import {span} from '@xh/hoist/cmp/layout';
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
            bind: {value: 'value', type: PT.Custom},
            disabled: {value: false, type: PT.Boolean, description:
                    'True to disable user interaction. Can be set by parent FormField. '},
            onChange: {value: null, type: PT.Function, description:
                    'Called when value changes - passed new and prior values. '},
            onCommit: {value: null, type: PT.Function, description:
                    'Called when value is committed to backing model - passed new and prior values. '},
            ...model.props
        };

        // If we do not set stateful to true, then react-view will break on false booleans.
        // Rather than passing in false, it will pass in nothing. The component may, then, default to true, breaking things.
        forEach(props, (v) => {if (v.type == PT.Boolean) v.stateful = true;});

        const viewParams = useView({
            componentName: model.componentName,
            customProps: {
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

        return wrapper(
            panel({
                title: model.componentName,
                items: [
                    span(String(model.value)),
                    compiler(viewParams.compilerProps),
                    knobs(viewParams.knobProps),
                    error(viewParams.errorProps)
                ]
            })
        );
    }
});

const compiler = elemFactory(Compiler);
const knobs = elemFactory(Knobs);
const error = elemFactory(Error);