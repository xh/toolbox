/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2020 Extremely Heavy Industries Inc.
 */

import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {projectRestPanel} from './ProjectRestPanel';
import {phaseRestPanel} from './PhaseRestPanel';


export const roadmapTab = hoistCmp(
    () => tabContainer({
        model: {
            route: 'default.roadmap',
            tabs: [
                {id: 'project', title: 'Projects', content: projectRestPanel},
                {id: 'phase', title: 'Phases', content: phaseRestPanel}
            ],
            switcherPosition: 'left'
        }
    })
);