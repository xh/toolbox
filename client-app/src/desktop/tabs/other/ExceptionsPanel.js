import {wrapper} from '../../common';
import {hoistCmp} from '@xh/hoist/core';
import {box, p} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import './ExceptionsPanel.scss';
import {XH} from '@xh/hoist/core';
import {Field} from "@xh/hoist/data";
import {codeInput} from "@xh/hoist/desktop/cmp/input";

export const exceptionsPanel = hoistCmp.factory(
    () => wrapper({
        description: [p('Exception')],
        links: [{url: '$HR/core/ExceptionHandler.js', notes: 'Exception Handler'},
            {url: '$HR/exception/Exception.js', notes: 'Exceptions'}],
        items : [
            box({
                className: 'tb-exceptions',
                items: [
                    panel({
                        title: 'Exception Handling',
                        icon: Icon.warning(),
                        items: [
                            p('ReferenceErrors like the one below are typically treated as routine and will not normally trigger an Exception Dialog. However, we are explicitly using the XH.handleException method to show the error to the client.'
                            ),
                            codeInput({
                                width: 'fill',
                                height: 150,
                                value: `function fooBar { \n    const foo = {name: 'foo'}; \n    return foo.name + bar; // bar is not initialized.\n}`
                            }),
                            button({
                                text: 'Run fooBar()',
                                className: 'xh-button',
                                minimal: false,
                                icon: Icon.warningSquare({className: 'xh-red'}),
                                onClick: () => {
                                    const foo = {name: 'bar'};
                                    try {
                                        return foo.name + bar;
                                    } catch (e) {
                                        XH.handleException(e, {logOnServer: false});
                                    }
                                }
                                // onClick: () => XH.handleException('Bad request', {title: 'Message', message: 'Validation Exception Message', showAsError: false})
                            })]
                    }),
                    panel({
                        title: 'Reload Required Exceptions',
                        items: [
                            p('Exception Handling is an important feature of any app. Hoist makes error and exception handling informative yet simple for clients and logs all exception details to the server.'),
                            button({
                                text: 'Server Unavailable - Requires Reload',
                                className: 'xh-button',
                                minimal: false,
                                icon: Icon.warningCircle({className: 'xh-red'}),
                                onClick: () => XH.handleException('Server Unavailable', {
                                    name: 'Server Unavailable',
                                    message: `Unable to contact the server at ${window.location.origin}`,
                                    logOnServer: false,
                                    requireReload: true
                                })
                            }),
                            button({
                                text: 'Exception - Does Not Require Reload',
                                className: 'xh-button',
                                minimal: false,
                                icon: Icon.skull({className: 'xh-red'}),
                                onClick: () => XH.handleException('Bad request', {title: 'Bad Request', message: 'Validation Exception Message', logOnServer: false, requireReload: false})
                            })
                        ]
                    })
                ]
            })
        ]
    })
);