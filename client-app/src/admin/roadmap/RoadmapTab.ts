import {hoistCmp} from '@xh/hoist/core';
import {tabContainer} from '@xh/hoist/cmp/tab';
import {Icon} from '@xh/hoist/icon/Icon';
import {projectRestPanel} from './ProjectRestPanel';
import {phaseRestPanel} from './PhaseRestPanel';

export const roadmapTab = hoistCmp.factory(() =>
    tabContainer({
        modelConfig: {
            route: 'default.roadmap',
            tabs: [
                {id: 'projects', icon: Icon.checkCircle(), content: projectRestPanel},
                {id: 'phases', icon: Icon.calendar(), content: phaseRestPanel}
            ],
            switcher: {orientation: 'left'}
        }
    })
);
