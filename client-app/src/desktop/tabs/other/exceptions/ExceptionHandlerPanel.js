import {creates, hoistCmp} from '@xh/hoist/core';
import {wrapper} from '../../../common';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {form} from '@xh/hoist/cmp/form';
import {vframe, hframe, div} from '@xh/hoist/cmp/layout';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {buttonGroupInput, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {button} from '@xh/hoist/desktop/cmp/button';
import {ExceptionHandlerModel} from './ExceptionHandlerModel';
import {capitalize} from 'lodash';
import './ExceptionHandlerPanel.scss';

export const exceptionHandlerPanel = hoistCmp.factory({
    model: creates(ExceptionHandlerModel),
    render() {
        return wrapper({
            description: (
                <div>
                    <p>
                        The <code>ExceptionHandler</code> class provides centralized exception handling for Hoist
                        Applications, including managing the logging and displaying of exceptions.
                    </p>
                    <p>
                        The <code>ExceptionHandler</code> is not typically used directly by an application. Instead,
                        <code>XH.handleException()</code> provides a convenient API for apps to handle exceptions.
                        It is typically called directly in <code>catch()</code> blocks.
                    </p>
                    <p>
                        See also <code>Promise.catchDefault()</code>. That method will delegate its arguments to
                        <code>XH.handleException()</code> and provides a more convenient interface for catching
                        exceptions in Promise chains.
                    </p>
                </div>),
            links: [
                {url: '$TB/client-app/src/desktop/tabs/other/exceptions/ExceptionHandler.js', notes: 'This example'},
                {url: '$HR/core/XH.js', notes: 'XH top-level Singleton model - see .handleException()'},
                {url: '$HR/core/ExceptionHandler.js', notes: 'ExceptionHandler Base Class'},
                {url: '$HR/promise/Promise.js', notes: 'Hoist promise enhancement methods - see .catchDefault()'}
            ],
            item: panel({
                title: 'Other > ExceptionHandler',
                icon: Icon.skull(),
                width: 700,
                item: hframe(
                    buttonContainer(),
                    displayOptions()
                )
            })
        });
    }
});

const buttonContainer = hoistCmp.factory(
    ({model}) => panel({
        flex: 1,
        item: vframe({
            items: [
                makeExceptionButton('fatal', model),
                makeExceptionButton('routine', model)
            ],
            alignItems: 'center',
            justifyContent: 'center',
            margin: 50,
            gap: 25
        })
    })
);

const displayOptions = hoistCmp.factory(
    ({model})=> panel({
        title: 'Display Options',
        className: 'tbox-display-opts',
        icon: Icon.settings(),
        compactHeader: true,
        model: {side: 'right', defaultSize: 240, resizable: false},
        item: form({
            fieldDefaults: {
                inline: true,
                commitOnChange: true
            },
            item: div({
                className: 'tbox-display-opts__inner',
                items: [
                    title(),
                    message(),
                    showAsError(),
                    requireReload(),
                    showAlert(),
                    alertType({disabled: !model.formModel.values.showAlert})
                ]
            })
        })
    })
);

const title = hoistCmp.factory(
    () => formField({
        field: 'title',
        inline: false,
        item: textInput({placeholder: 'Title for an alert dialog, if shown'}),
        margin
    })
);

const message = hoistCmp.factory(
    () => formField({
        field: 'message',
        inline: false,
        item: textInput({placeholder: 'Shown instead of exception msg'}),
        margin
    })
);

const showAsError = hoistCmp.factory(
    () => formField({
        field: 'showAsError',
        item: switchInput({label: 'Show As Error'}),
        label,
        margin
    })
);

const requireReload = hoistCmp.factory(
    () => formField({
        field: 'requireReload',
        item: switchInput({label: 'Require Reload'}),
        label,
        margin
    })
);

const showAlert = hoistCmp.factory(
    () => formField({
        field: 'showAlert',
        item: switchInput({label: 'Show Alert'}),
        label,
        margin
    })
);

const alertType = hoistCmp.factory(
    ({disabled}) => formField({
        field: 'alertType',
        item: buttonGroupInput({
            className: 'tbox-exception-handler-panel-button-group',
            disabled,
            margin,
            items: [
                button({
                    text: 'Dialog',
                    value: 'dialog'
                }),
                button({
                    text: 'Toast',
                    value: 'toast'
                })]
        })
    })
);


//--------------------
// Implementation
//--------------------

const label = '',
    margin = 0;

const makeExceptionButton = (type, model) => {
    const iconName = type === 'fatal' ? 'skull' : 'warning';
    return button({
        text: `Simulate a ${capitalize(type)} Exception`,
        icon: Icon[iconName]({size: 'lg'}),
        height: 100,
        width: 250,
        margin: 10,
        intent: type === 'fatal' ? 'danger' : 'warning',
        minimal: false,
        onClick: () => model.throwException(type)
    });
};