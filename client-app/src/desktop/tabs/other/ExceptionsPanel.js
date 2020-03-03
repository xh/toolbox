import {wrapper} from '../../common';
import {hoistCmp, HoistModel} from '@xh/hoist/core';
import {box, filler, p, vbox} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import './ExceptionsPanel.scss';
import {XH} from '@xh/hoist/core';
import {codeInput} from '@xh/hoist/desktop/cmp/input';
import {bindable} from '@xh/hoist/mobx';
import {creates} from '@xh/hoist/core/modelspec';

export const exceptionsPanel = hoistCmp.factory({
    model: creates(() => new Model()),
    render: ({model}) => wrapper({
        description: [
            p('Hoist\'s Exception Handler standardizes and facilitates catching exceptions and errors on server and client sides. When an exception is caught, the Exception Dialog component is able to present the error in a stringified, human-readable format and offer more details, like the HTTP status code, error message, and stack trace. Some errors may require an app refresh, while others do not. Errors can also be marked as routine and need not reveal further details to the user beyond the stringified error message.'),
            p('Users also have the option to send a message to support@xh.io to report additional information about the error.')
        ],
        links: [
            {url: '$HR/core/ExceptionHandler.js', notes: 'Exception Handler'},
            {url: '$HR/exception/Exception.js', notes: 'Standardized Hoist Exception/Error Class'},
            {url: '$HR/promise/Promise.js', notes: 'See Error Handling methods like catchDefault() or catchDefaultWhen()'}
        ],
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
                                height: 120,
                                showFullscreenButton: false,
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
                                onClick: () => model.onFooBarClicked()
                            })]
                    }),
                    panel({
                        title: 'Promise Exceptions',
                        icon: Icon.warning(),
                        items: [
                            p('Hoist provides neat .catchDefault() and .catchDefaultWhen() methods that will handle exceptions and smart decode HTTP responses. (No need to wrap in try/catch logic!)'),
                            codeInput({
                                height: 120,
                                showFullscreenButton: false,
                                editorProps: {
                                    readOnly: true
                                },
                                mode: 'javascript',
                                bind: 'catchMethod'
                            }),
                            vbox({
                                items: [
                                    button({
                                        text: 'catchDefault()',
                                        minimal: false,
                                        icon: Icon.warningCircle({className: 'xh-red'}),
                                        onClick: () => model.onCatchDefaultClicked()
                                    }),
                                    button({
                                        text: 'catchDefaultWhen()',
                                        minimal: false,
                                        icon: Icon.warningCircle({className: 'xh-red'}),
                                        onClick: () => model.onCatchDefaultWhenClicked()
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    })
});

/* eslint-disable */
function fooBar() {
    const foo = 'foo';
    return foo + bar;
}
/* eslint-enable */
@HoistModel
class Model {
    @bindable
    catchMethod = `// See what happens when you make a bad request`;

    async onPingClicked() {
        const pingURL = XH.isDevelopmentMode ?
            `${XH.baseUrl}ping` :
            `${window.location.origin}${XH.baseUrl}ping`;
        await XH.fetchJson({url: pingURL}).then(
            (res) => this.setPing(JSON.stringify(res, null, '  '))
        );
    }
    onFooBarClicked() {
        try {
            fooBar();
        } catch (e) {
            XH.handleException(e, {logOnServer: false});
        }
    }
    onCatchDefaultClicked() {
        this.setCatchMethod(this.catchDefault);
        XH.fetch({url: 'badRequest'}).catchDefault();
    }
    onCatchDefaultWhenClicked() {
        this.setCatchMethod(this.catchDefaultWhen);
        XH.fetch({url: 'badRequest'}).catchDefaultWhen(e => e.message !=='Not Found');
    }

    catchDefault = `function badRequest() {\n  XH.fetch({url: 'badRequest'})\n  .catchDefault();\n}`;
    catchDefaultWhen = `function badRequest() {\n  XH.fetch({url: 'badRequest'})\n  .catchDefaultWhen(e => {\n    e.message !== 'Not Found'\n  })\n}`;
}