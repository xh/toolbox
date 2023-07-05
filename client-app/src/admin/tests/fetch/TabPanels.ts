import {hoistCmp} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {hframe, vframe} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';

import {codes} from './Codes';
import {FetchApiTestModel} from './FetchApiTestModel';

export const individualBtns = hoistCmp.factory<FetchApiTestModel>(({model}) =>
    vframe({
        style: {overflowY: 'scroll'},
        items: codes.map(it =>
            hframe({
                className: 'http-status-code-frame',
                overflow: 'unset',
                items: [
                    button({
                        flexGrow: 1,
                        className: 'http-status-code-button',
                        text: `${it.code}: ${it.description}`,
                        onClick: () => model.testCodeAsync(it.code),
                        minimal: false
                    }),
                    button({
                        icon: Icon.info(),
                        onClick: () => window.open(`${model.referenceSite}${it.code}`),
                        minimal: false
                    })
                ]
            })
        )
    })
);

export const codeGroupBtns = hoistCmp.factory<FetchApiTestModel>(({model}) =>
    vframe({
        style: {overflowY: 'scroll'},
        items: codes
            .filter(it => !(it.code % 100))
            .map(it =>
                button({
                    className: 'http-status-code-group-button',
                    text: `${it.code.toString().replace(/00$/, 'XX')}: Test all ${it.code}s`,
                    onClick: () => model.testCodeGroupAsync(it.code),
                    minimal: false
                })
            )
    })
);

export const fetchServiceFeatures = hoistCmp.factory<FetchApiTestModel>(({model}) =>
    vframe({
        style: {overflowY: 'scroll'},
        items: [
            button({
                className: 'fetchservice-feature-button',
                text: `Aborted`,
                onClick: () => model.testAbortAsync(),
                minimal: false
            }),
            button({
                className: 'fetchservice-feature-button',
                text: `Timeout (5s)`,
                onClick: () => model.testTimeoutAsync(),
                minimal: false
            })
        ]
    })
);
