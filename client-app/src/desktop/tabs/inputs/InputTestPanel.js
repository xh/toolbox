import {elemFactory, hoistCmp, uses} from '@xh/hoist/core';
import {div, hframe} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import template from '@babel/template';
import {Compiler, Error, Knobs, PropTypes as T, useView} from 'react-view';
import {forEach} from 'lodash';

import './InputTestPanel.scss';
import {InputTestModel} from './InputTestModel';
import {wrapper} from '../../common';
import {Icon} from '@xh/hoist/icon';
import {button} from '@xh/hoist/desktop/cmp/button';

export const inputTestPanel = hoistCmp.factory({

    model: uses(InputTestModel),

    render({model}) {
        let props = {
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
            },
            ...model.props
        };

        // If we do not set stateful to true, then react-view will ignore false boolean props.
        // The input we are testing may use a default value of true, ignoring user input entirely.
        forEach(props, (v) => {if (v.type == T.Boolean) v.stateful = true;});

        props = Object.keys(props).sort((a, b) => {
            const hiddenA = props[a].hidden;
            const hiddenB = props[b].hidden;
            if (hiddenA == hiddenB) return 0;
            if (hiddenA && !hiddenB) return 1;
            return -1;
        }).reduce((r, k) => (r[k] = props[k], r), {});

        console.log(props);

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
                            // TODO: add title to knobs
                            className: 'input-test-controls',
                            item: knobs(viewParams.knobProps)
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