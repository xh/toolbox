import {vframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, HoistModel} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {errorMessage} from '@xh/hoist/cmp/error';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {makeObservable, bindable} from '@xh/hoist/mobx';
import React from 'react';
import {wrapper} from '../../common';
import './ClockPanel.scss';

export const errorMessagePanel = hoistCmp.factory({
    model: creates(() => ErrorMessagePanelModel),

    render({model}) {
        const {error} = model;

        return wrapper({
            description: [
                <p>
                    The <code>ErrorMessage</code> component displays an exception or other custom
                    error message. It supports an optional button to trigger an action that might
                    resolve the error, such as retrying a failed data load.
                </p>,
                <p>
                    Consider using an <code>ErrorMessage</code> to replace another, primary
                    component in your app when an error prevents that component from displaying as
                    it should.
                </p>
            ],
            links: [
                {
                    url: '$TB/client-app/src/desktop/tabs/other/ErrorMessagePanel.tsx',
                    notes: 'This example'
                },
                {url: '$HR/desktop/cmp/error/ErrorMessage.ts', notes: 'ErrorMessage source'}
            ],
            item: panel({
                title: 'Other › Error Message',
                icon: Icon.skull(),
                width: 700,
                height: 350,
                items: [
                    errorMessage({
                        error,
                        title: 'Something went wrong:',
                        actionButtonProps: {
                            icon: Icon.refresh(),
                            onClick: () => model.toggleError()
                        }
                    }),
                    vframe({
                        omit: error,
                        items: [
                            'Everything is OK right now, but....',
                            button({
                                text: 'Simulate an Error',
                                icon: Icon.skull({size: 'lg'}),
                                height: 100,
                                width: 200,
                                marginTop: 10,
                                intent: 'danger',
                                minimal: false,
                                onClick: () => model.toggleError()
                            })
                        ],
                        alignItems: 'center',
                        justifyContent: 'center'
                    })
                ]
            })
        });
    }
});

class ErrorMessagePanelModel extends HoistModel {
    @bindable.ref error = null;

    constructor() {
        super();
        makeObservable(this);
    }

    // Manufacture an error. In the real world, this code would do something that might break
    // like load/process data from an API, but still follow pattern of setting and clearing an
    // observable error on the backing model
    toggleError() {
        if (this.error) {
            this.error = null;
            return;
        }

        try {
            const foo = {};
            // @ts-ignore
            return foo.bar.baz;
        } catch (e) {
            this.error = e;
        }
    }
}
