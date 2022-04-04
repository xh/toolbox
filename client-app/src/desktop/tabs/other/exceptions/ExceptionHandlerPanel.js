import {creates, hoistCmp} from '@xh/hoist/core';
import {wrapper} from '../../../common';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {form} from '@xh/hoist/cmp/form';
import {vframe, vbox, hbox, div, filler} from '@xh/hoist/cmp/layout';
import {formField} from '@xh/hoist/desktop/cmp/form';
import {codeInput, radioInput, select, switchInput, textInput} from '@xh/hoist/desktop/cmp/input';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import './ExceptionHandlerPanel.scss';
import {ExceptionHandlerModel} from './ExceptionHandlerPanelModel';

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
                className: 'toolbox-exception-handler-panel',
                icon: Icon.skull(),
                width: 700,
                item: div({
                    className: 'toolbox-exception-handler-options',
                    item: optionsForm()
                }),
                bbar: bbar()
            })
        });
    }
});

const message = hoistCmp.factory(() => formField({
    field: 'message',
    item: textInput({placeholder: 'User-friendly text describing the error'})})
);

const title = hoistCmp.factory(() => formField({
    field: 'title',
    item: textInput({placeholder: 'Title for an alert dialog, if shown'})})
);

const showAsError = hoistCmp.factory(() => formField({
    field: 'showAsError',
    inline: false,
    item: switchInput({label: "Default true for most exceptions, false for those marked 'isRoutine'"})})
);

const logOnServer = hoistCmp.factory(() => formField({
    field: 'logOnServer',
    inline: false,
    item: switchInput({label: "Default true when 'showAsError' is true, excepting 'isAutoRefresh' fetch exceptions"})})
);

const showAlert = hoistCmp.factory(() => formField({
    field: 'showAlert',
    inline: false,
    item: switchInput({label: "Display an alert to the user (default true excepting 'isAutoRefresh' fetch exceptions)"})})
);

const alertType = hoistCmp.factory(({disabled}) => formField({
    field: 'alertType',
    item: radioInput({inline: true, options: ['dialog', 'toast'], disabled})})
);

const requireReload = hoistCmp.factory(() => formField({
    field: 'requireReload',
    inline: false,
    item: switchInput({
        label: 'Force user to fully refresh the app in order to dismiss (default false, excepting session-related exceptions'
    })})
);

const hideParams = hoistCmp.factory(
    () => formField({
        field: 'hideParams',
        item: select({
            enableMulti: true,
            enableCreate: true,
            placeholder: 'List of parameters that should be hidden from the exception alert'
        })
    })
);

const optionsForm = hoistCmp.factory(
    ({model})=> panel({
        flex: 1,
        item: form({
            fieldDefaults: {
                inline: true,
                commitOnChange: true
            },
            item: vframe({
                padding: 10,
                items: [
                    hbox({
                        flex: 'none',
                        items: [
                            vbox({
                                flex: 1,
                                marginRight: 30,
                                items: [
                                    message(),
                                    title(),
                                    showAsError(),
                                    logOnServer(),
                                    showAlert(),
                                    alertType({disabled: !model.formModel.fields.showAlert.value}),
                                    requireReload(),
                                    hideParams()
                                ]
                            })
                        ]
                    })
                ]
            })
        })})
);

const bbar = hoistCmp.factory(
    ({model}) => div(
        toolbar(
            button({
                text: 'Reset',
                icon: Icon.reset({className: 'xh-red'}),
                onClick: () => model.formModel.reset(),
                disabled: !model.formModel.isDirty
            }),
            switchInput({
                label: 'Show Source Code',
                bind: 'showSourceCode'
            }),
            filler(),
            button({
                text: 'Throw exception',
                icon: Icon.skull(),
                minimal: false,
                intent: 'danger',
                onClick: () => model.throwException()
            })
        ),
        !model.showSourceCode ? null :
            codeInput({
                flex: 1,
                width: null,
                height: null,
                value: getCodeSnippet(model),
                readonly: true,
                showCopyButton: true
            })

    )
);

const getCodeSnippet = (model) => `import {XH} from '@xh/hoist/core';

try {
  throw 'Simulated exception';
} catch (e) {
  XH.handleException(e, { 
${JSON.stringify(model.exceptionOptions, null, 4).slice(2, -2)}
  });
}
    `;