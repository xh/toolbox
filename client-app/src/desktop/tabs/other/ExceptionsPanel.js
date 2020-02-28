import {wrapper} from '../../common';
import {hoistCmp} from '@xh/hoist/core';
import {box, p} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import './ExceptionsPanel.scss';
import {XH} from '@xh/hoist/core';
import {codeInput} from '@xh/hoist/desktop/cmp/input';

export const exceptionsPanel = hoistCmp.factory(
    () => wrapper({
        description: [p('Exception')],
        links: [{url: '$HR/core/ExceptionHandler.js', notes: 'Exception Handler'},
            {url: '$HR/exception/Exception.js', notes: 'Exceptions'}],
        items: [
            box({
                className: 'tb-exceptions',
                items: [
                    panel({
                        title: 'Exception Handling',
                        icon: Icon.warning(),
                        items: [
                            p('Hoist\'s Exception Handler can render an Exception Dialog that presents the error in a readable format and offer more details, like the stack trace.'),
                            p('Users also have the option to send a message to support@xh.io to report additional information about the error.'),
                            codeInput({
                                width: 'fill',
                                height: 150,
                                editorProps: {
                                    readOnly: true
                                },
                                mode: 'javascript',
                                value: fooBar.toString()
                            }),
                            button({
                                text: 'Run fooBar()',
                                className: 'xh-button',
                                minimal: false,
                                icon: Icon.warningCircle({className: 'xh-red'}),
                                onClick: () => {
                                    try {
                                        fooBar();
                                    } catch (e) {
                                        XH.handleException(e, {logOnServer: false});
                                    }
                                }
                            })]
                    }),
                    panel({
                        title: 'Server Exceptions',
                        icon: Icon.warning(),
                        items: [
                            p('When a fetch request does not receive a server response, Hoist will throw an exception and require an app reload. By default, these errors are tracked in our admin logger.'),
                            button({
                                text: 'Kill the server',
                                className: 'xh-button',
                                minimal: false,
                                icon: Icon.skull({className: 'xh-red'}),
                                onClick: () => XH.handleException('Server Unavailable', {
                                    name: 'Server Unavailable',
                                    message: `Unable to contact the server at ${window.location.origin}`,
                                    logOnServer: false,
                                    requireReload: true
                                })
                            }),
                            p('When a fetch call goes bad, Hoist can mark them as routine and smart decode HTTP responses. In the call to route \'/badRequest\', the 404 error code is parsed by the exception handler and does not provide a detailed stack trace.'),
                            button({
                                text: 'Visit xh.io/badRequest',
                                className: 'xh-button',
                                minimal: false,
                                icon: Icon.warningCircle({className: 'xh-red'}),
                                onClick: () => XH.fetch({url: 'badRequest'}).catchDefault()
                            })
                        ]
                    })
                ]
            })
        ]
    })
);


function fooBar () {
    const foo = {name: 'foo'};
    return foo.name + bar;
} // bar has not been defined and\n// therefore will return a ReferenceError.`