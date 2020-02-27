import {wrapper} from '../../common';
import {hoistCmp} from '@xh/hoist/core';
import {box, p} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import './ExceptionsPanel.scss';
import {XH} from '@xh/hoist/core';

export const exceptionsPanel = hoistCmp.factory(
    () => wrapper({
        description: [p('Exception')],
        links: [{url: '$HR/core/ExceptionHandler.js', notes: 'Exception Handler'},
            {url: '$HR/exception/Exception.js', notes: 'Exceptions'}],
        item: box({
            className: 'tb-exceptions',
            item: panel({
                title: 'Exception Handling',
                icon: Icon.warning(),
                items: [
                    p('Exception Handling is an important feature of any app. Hoist makes error and exception handling informative yet simple for clients and logs all exception details to the server.'),
                    button({
                        text: 'Authorization Error - Requires Re-Login',
                        className: 'xh-button',
                        minimal: false,
                        icon: Icon.error({className: 'xh-red'}),
                        onClick: () => window.open('/admin')
                        // XH.handleException('You threw an error!', {title: 'Invalid request', message: 'Continue to use app without refreshing', logOnServer: false})
                    }),
                    button({
                        text: 'Error requires refresh',
                        className: 'xh-button',
                        minimal: false,
                        icon: Icon.skull({className: 'xh-red'}),
                        onClick: () => XH.handleException('Bad request', {title: 'Fatal Error', message: 'Refresh app to continue', logOnServer: false, requireReload: true})
                    }),
                    button({
                        text: 'Server unavailable message',
                        className: 'xh-button',
                        minimal: false,
                        icon: Icon.warningCircle({className: 'xh-red'}),
                        onClick: () => XH.handleException('Server Unavailable', {
                            name: 'Server Unavailable',
                            message: `Unable to contact the server at ${window.location.origin}`,
                            logOnServer: false
                        })
                    })]
            })
        })
    })
);