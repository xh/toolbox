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
        description:
            'A Calendar Control for choosing a Date.\n' +
            'By default this control emits dates with the time component cleared (set to midnight), but this\n' +
            'can be customized via the timePrecision prop to support editing of a date and time together.\n' +
            'The calendar popover can be opened via the built-in button or up/down arrow keyboard shortcuts.',
        componentName: 'ButtonGroupInput',
        customProps: {
            items: {
                generate: () => {
                    return (template.ast(
                        '[' +
                        '   button({' +
                        '       text: \'Button 1\',' +
                        '       value: \'button1\'' +
                        '   }),' +
                        '   button({' +
                        '       icon: Icon.moon(),' +
                        '       value: \'button2\'' +
                        '   }),' +
                        '   button({' +
                        '       icon: Icon.skull(),' +
                        '       text: \'Button 2\',' +
                        '       value: \'button3\'' +
                        '   })' +
                        ']',
                        {plugins: ['jsx']}))
                        .expression;
                },
                parse: (code) => {}
            }
        },
        props: {
            items: {value: 'true', type: T.Custom},
            minimal: {value: false, type: T.Boolean}
        },
        scope: {
            button,
            ButtonGroupInput,
            Icon
        }
    });
}