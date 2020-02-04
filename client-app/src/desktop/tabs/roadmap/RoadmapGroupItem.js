import {hoistCmp} from '@xh/hoist/core/index';
import {box} from '@xh/hoist/cmp/layout/index';
import {Icon} from '@xh/hoist/icon/index';
// import {span} from '@xh/hoist/cmp/layout';

export const roadmapGroupItem = hoistCmp.factory(({node}) => {

    // let statusIcon;
    // switch (node.key) {
    //     case 'MERGED':
    //         statusIcon = Icon.check({size: '1x', className: 'xh-green', prefix: 'fal'});
    //         break;
    //     case 'DEVELOPMENT':
    //         statusIcon = Icon.gear({size: '1x', className: 'xh-yellow', prefix: 'fal'});
    //         break;
    //     case 'RELEASED':
    //         statusIcon = Icon.bullhorn({size: '1x', className: 'xh-green', prefix: 'fal'});
    //         break;
    //     case 'PLANNED':
    //         statusIcon = Icon.clipboard({size: '1x', className: 'xh-blue', prefix: 'fal'});
    //         break;
    // }

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

