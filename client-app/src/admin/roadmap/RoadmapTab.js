/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2020 Extremely Heavy Industries Inc.
 */

import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';

export const RoadmapTab = hoistCmp(
    () => tabContainer({
        model: {
            route: 'default.roadmap',
            tabs: [
            ],
            switcherPosition: 'left'
        }
    })
);