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
        links: [],
        item: box({
            className: 'tb-exceptions',
            item: panel({
                title: 'Exception Handling',
                icon: Icon.warning(),

                item: button({
                    text: 'Click me to throw an error',
                    icon: Icon.error(),
                    onClick: () => XH.handleException('You threw an error!', {logOnServer: false})
                })
            })
        })
    })
);