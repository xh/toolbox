/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2020 Extremely Heavy Industries Inc.
 */
import {box} from '@xh/hoist/cmp/layout';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

export const WipTab = hoistCmp({

    render() {
        const tabs = [];

        if (tabs.length) {
            return tabContainer({
                model: {
                    route: 'default.wip',
                    switcher: {orientation: 'left'},
                    tabs
                }
            });
        }

        return panel(
            box({
                margin: 20,
                item: 'No WIP examples at the moment...'
            })
        );
    }
});
