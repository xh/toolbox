import {wrapper} from '../../common';
import {hoistCmp} from '@xh/hoist/core';
import {box, filler, p} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import './ExceptionsPanel.scss';
import {XH} from '@xh/hoist/core';
import {codeInput, jsonInput} from '@xh/hoist/desktop/cmp/input';
import {roadmapViewItem} from "../home/roadmap/RoadmapViewItem";
import {bindable} from "@xh/hoist/mobx";

export const exceptionsPanel = hoistCmp.factory(
    () => wrapper({
        description: [p('Hoist\'s Exception Handler can render an Exception Dialog that presents the error in a readable format and offer more details, like the http status code, error message, and stack trace.'),
            p('Users also have the option to send a message to support@xh.io to report additional information about the error.'),],
        links: [{url: '$HR/core/ExceptionHandler.js', notes: 'Exception Handler'},
            {url: '$HR/exception/Exception.js', notes: 'Exceptions'}],
        items: [
            box({
                className: 'tb-exceptions',
                items: [
                    panel({
                        title: 'Exception Handling Example',
                        icon: Icon.warning(),
                        items: [
                            p('In the `fooBar` function below, the Exception Handler catches the error and returns the error message in a readable format. Since `bar` has not been defined, a Reference Error will be thrown.'),
                            codeInput({
                                width: 'fill',
                                height: 100,
                                editorProps: {
                                    readOnly: true
                                },
                                mode: 'javascript',
                                value: fooBar.toString()
                            }),
                            filler(),
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
                        title: 'Server Down',
                        icon: Icon.warning(),
                        items: [
                            p('When a fetch request does not receive a server response, Hoist will throw an exception and require an app reload. By default, these errors are tracked in our admin logger.'),
                            codeInput({
                                value: null,
                                editorProps: {
                                    readOnly: true
                                },
                                mode: 'javascript'
                            }),
                            button({
                                text: 'Ping Server',
                                className: 'xh-button',
                                minimal: false,
                                icon: Icon.checkCircle({className: 'xh-green'}),
                                onClick: async () => console.log(await XH.fetchService.getJson({url: pingURL}))
                            }),
                            button({
                                text: 'Kill Server',
                                className: 'xh-button',
                                minimal: false,
                                icon: Icon.skull({className: 'xh-red'}),
                                onClick: () => XH.handleException('Server Unavailable', {
                                    name: 'Server Unavailable',
                                    message: `Unable to contact the server at ${window.location.origin}`,
                                    logOnServer: false,
                                    requireReload: true
                                })
                            })]
                    }),
                    panel({
                        title: 'Promise Exceptions',
                        icon: Icon.warning(),
                        items: [
                            p('Instead of wrapping fetch requests in try/catch blocks, Hoist provides a .catchDefault() method that will handle exceptions and smart decode HTTP responses.'),
                            p('In the call to route \'/badRequest\', the 404 error code is parsed by the exception handler and does not provide a detailed stack trace because it is marked as a routine client-side error.'),
                            filler(),
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


function fooBar() {
    const foo = 'foo';
    return foo + bar;
}


const pingURL = XH.isDevelopmentMode ?
    `${XH.baseUrl}ping` :
    `${window.location.origin}${XH.baseUrl}ping`;