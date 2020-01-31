import {elemFactory, hoistCmp, uses} from '@xh/hoist/core';
import {div, hframe, span} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import template from '@babel/template';
import {Compiler, Error, Knobs, PropTypes as T, useView} from 'react-view';
import './InputTestPanel.scss';
import {InputTestModel} from './InputTestModel';
import {wrapper} from '../../common';
import {Icon} from '@xh/hoist/icon';
import {button} from '@xh/hoist/desktop/cmp/button';
import {HoistInput} from '@xh/hoist/cmp/input';
import {warnIf} from '@xh/hoist/utils/js';

export const inputTestPanel = hoistCmp.factory({

    model: uses(InputTestModel),

    render({model}) {
        let props = {
            ...model.props,
            bind: {
                value: 'value',
                type: T.Custom
            },
            disabled: {
                value: false,
                type: T.Boolean,
                description: 'True to disable user interaction. Can be set by parent FormField. ',
                hidden: true
            },
            onChange: {
                value: null,
                type: T.Function,
                description: 'Called when value changes - passed new and prior values. ',
                hidden: true
            },
            onCommit: {
                value: null,
                type: T.Function,
                description: 'Called when value is committed to backing model - passed new and prior values. ',
                hidden: true
            }
        };

        // If we do not set stateful to true, then react-view will ignore false boolean props.
        // The input we are testing may use a default value of true, ignoring user input entirely.
        for (const key in props) props[key].stateful = (props[key].type == T.Boolean);

        // Put hidden props at the end of the list. This will avoid the existing list jumping around when hidden
        // props are displayed or hidden.
        let basicProps = {},
            hiddenProps = {};
        for (const key in props) {
            (props[key].hidden ? hiddenProps : basicProps)[key] = props[key];
        }
        props = {...basicProps, ...hiddenProps};

        for (const key in props) {
            warnIf(
                !(model.scope[model.componentName].propTypes[key]),
                `${key} found in react-view knobs but not found in ${model.componentName} propTypes.`
            );
        }

        for (const key in model.scope[model.componentName].propTypes) {
            warnIf(
                !(props[key]) && !(HoistInput.propTypes[key]),
                `${key} found in ${model.componentName} propTypes but not included in react-view knobs.`
            );
        }

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
            scope: {...model.scope, Icon, button}
        });

        return wrapper({
            description: model.description,
            links: [
                {
                    url: 'https://github.com/uber/react-view',
                    notes: 'The library that powers this page.'
                },
                {
                    url: 'https://github.com/uber/react-view/blob/master/LICENSE',
                    notes: 'The license for react-view.'
                }
            ],
            item: panel({
                title: model.componentName,
                className: 'input-test-panel',
                items: [
                    hframe(
                        div({
                            className: 'input-test-example',
                            items: [
                                div({
                                    className: 'input-test-example__container',
                                    items: [
                                        // TODO: move this to top right
                                        div({className: 'input-test-example__value', item: displayValue(model.value)}),
                                        div({className: 'input-test-example__input', item: compiler(viewParams.compilerProps)})
                                    ]
                                }),
                                div({className: 'input-test-example__error', item: error({...viewParams.errorProps})})
                            ]
                        }),
                        div({
                            className: 'input-test-controls',
                            items: [
                                span({
                                    className: 'input-test-controls_header',
                                    items: [
                                        Icon.code(),
                                        ' Props'
                                    ]
                                }),
                                knobs(viewParams.knobProps)
                            ]
                        })
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
    ret = 'Current Value: ' + ret;
    return ret;
}

const compiler = elemFactory(Compiler);
const knobs = elemFactory(Knobs);
const error = elemFactory(Error);