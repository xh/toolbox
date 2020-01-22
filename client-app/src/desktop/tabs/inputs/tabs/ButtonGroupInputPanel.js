import {useLocalModel} from '@xh/hoist/core/hooks';
import {InputTestModel} from '../InputTestModel';
import {PropTypes as T} from 'react-view';
import {ButtonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {hoistCmp} from '@xh/hoist/core';
import template from '@babel/template';

import {inputTestPanel} from '../InputTestPanel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {p} from '@xh/hoist/cmp/layout';

export const buttonGroupInputPanel = hoistCmp.factory({

    render() {
        const model = useLocalModel(createModel);
        return inputTestPanel({model});
    }
});

function createModel() {
    return new InputTestModel({
        description:
            [
                p('A segmented group of buttons, one of which is depressed to indicate the input\'s current value.'),
                p('Should receive a list of Buttons as children. Each Button requires a \'value\' prop.' +
                    'The buttons are automatically configured to set this value on click and appear pressed if the ' +
                    'ButtonGroupInput\'s value matches.')
            ],
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
                description: 'Style block.',
                hidden: true
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
            ButtonGroupInput
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