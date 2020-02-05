import {hoistCmp} from '@xh/hoist/core/index';
import {box} from '@xh/hoist/cmp/layout/index';
import {Icon} from '@xh/hoist/icon/index';


export const roadmapGroupItem = hoistCmp.factory(({node}) => {

    return box(
        {
            className: 'roadmap-group-row',
            onClick: () => node.setExpanded(!node.expanded),
            items: [
                Icon.calendar({ize: '1x', className: 'xh-white', prefix: 'fal'}),
                node.key
            ]
        }
    );
});

