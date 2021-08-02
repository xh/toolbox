import React from 'react';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {action, bindable, makeObservable, observable} from '@xh/hoist/mobx';
import {div, filler, p} from '@xh/hoist/cmp/layout';
import {textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {button} from '@xh/hoist/desktop/cmp/button';
import {wrapper} from '../../common';

export const errorPanel = hoistCmp.factory({
    model: creates(() => new Model()),

    render: function({model}) {
        return wrapper({
            description: [
                <p>
                    Panels can be configured to display error messages via the <code>error</code> property. This
                    prop can accept a string, a custom <code>ReactElement</code> or be bound to the panel's
                    <code>ContextModel</code>.
                </p>
            ],
            links: [
                {url: '$TB/client-app/src/desktop/tabs/panels/ErrorPanel.js', notes: 'This example.'},
                {url: '$HR/desktop/cmp/error/ErrorMessage.js', notes: 'ErrorMessage component.'}
            ],
            item: panel({
                title: 'Panels › Error',
                icon: Icon.error({prefix: 'fas'}),
                width: 800,
                height: 400,
                items: [
                    div({
                        className: 'toolbox-panel-text-reader',
                        items: [
                            p('In the unlikely event of an error, panels can be configured to display an error message rather than their usual contents.'),
                            p('Rather than masking or disabling a grid or form when in error state, Hoist panels can load alternate components via the error prop. A common design pattern is to simply link the error prop to the panel\'s context model by passing the string \'onLoadException\'. The panel will extract the associated error message, and display it as an ErrorMessage, but any valid React Component can be displayed.')
                        ]
                    }),
                    filler()
                ],
                bbar: [
                    textInput({
                        bind: 'customMessage',
                        placeholder: 'Set custom error message'
                    }),
                    filler(),
                    button({
                        text: 'Simulate an error',
                        onClick: () => model.simulateError()
                    }),
                    button({
                        text: 'Clear the error',
                        onClick: () => model.clearError(),
                        disabled: !model.error
                    })
                ],
                error: model.error
            })
        });
    }
});

class Model extends HoistModel {
    @observable
    error = null;

    @bindable
    customMessage = null;

    constructor() {
        super();
        makeObservable(this);
    }

    simulateError() {
        try {
            const foo = {};
            return foo.bar.baz;
        } catch (e) {
            this.setError(e);
        }
    }

    @action
    setError(e) {
        this.error = this.customMessage ?? e.message;
    }

    @action
    clearError() {
        this.error = null;
    }
}