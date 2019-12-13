import {useLocalModel} from '@xh/hoist/core/hooks';
import {InputTestModel} from '../InputTestModel';
import {PropTypes as T} from 'react-view';
import {ButtonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {Icon} from '@xh/hoist/icon';
import {hoistCmp} from '@xh/hoist/core';
import template from '@babel/template';

import {inputTestPanel} from '../InputTestPanel';
import {button} from '@xh/hoist/desktop/cmp/button';

export const ButtonGroupInputPanel = hoistCmp({

    render() {
        const model = useLocalModel(createModel);
        return inputTestPanel({model});
    }
});

function createModel() {
    return new InputTestModel({
        componentName: 'ButtonGroupInput',
        customProps: {
            children: {
                generate: () => {
                    return (template.ast(children, {plugins: ['jsx']}))
                        .expression;
                },
                parse: (code) => {}
            }
        },
        props: {
            children: {
                value: children,
                type: T.Custom
            },
            fill: {
                value: false,
                type: T.Boolean,
                description: 'True to have all buttons fill available width equally.'
            },
            minimal: {
                value: false,
                type: T.Boolean,
                description: 'True to render each button with minimal surrounding chrome (default false).'
            },
            style: {
                value: null,
                type: T.Object,
                description: 'Style block.'
            },
            vertical: {
                value: false,
                type: T.Boolean,
                description: 'True to render in a vertical orientation.'
            },
            enableClear: {
                value: false,
                type: T.Boolean,
                description: 'True to allow buttons to be unselected (aka inactivated). Defaults to false.'
            }
        },
        scope: {
            button,
            ButtonGroupInput,
            Icon
        }
    });
}

const children =
    '{[' +
    '   button({' +
    '       icon: Icon.moon(),' +
    '       value: \'sleep\',' +
    '       key: \'button1`\'' +
    '   }),' +
    '   button({' +
    '       text: \'Create\',' +
    '       value: \'create\',' +
    '       key: \'button2\'' +
    '   }),' +
    '   button({' +
    '       icon: Icon.skull(),' +
    '       text: \'Delete\',' +
    '       value: \'delete\',' +
    '       key: \'button3\'' +
    '   })' +
    ']}';