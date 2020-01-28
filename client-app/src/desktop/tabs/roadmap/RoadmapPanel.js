import {hoistCmp, creates, XH} from '@xh/hoist/core';
import {grid} from '@xh/hoist/cmp/grid';
import {filler, p, span} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';

import {RoadmapPanelModel} from './RoadmapPanelModel';

export const roadmapPanel = hoistCmp.factory({
    model: creates(RoadmapPanelModel),
    render({model}) {
        const aboutBlurb = 'At XH, we strive to keep our roadmap of upcoming Hoist features up-to-date.';

        return panel({
            title: 'Hoist Roadmap',
            icon: Icon.mapSigns(),
            mask: 'onLoad',
            margin: 20,
            tbar: [
                span('Group By: '),
                buttonGroupInput({
                    bind: 'groupBy',
                    enableClear: true,
                    items: [
                        button({
                            icon: Icon.grip({className: 'xh-blue-muted'}),
                            text: 'Category',
                            value: 'category'
                        }),
                        button({
                            icon: Icon.calendar({className: 'xh-orange-muted'}),
                            text: 'Phase',
                            value: 'phase'
                        }),
                        button({
                            icon: Icon.gauge({className: 'xh-green-muted'}),
                            text: 'Status',
                            value: 'status'
                        })
                    ]
                }),
                filler(),
                button({
                    title: 'About',
                    text: 'About the Roadmap',
                    icon: Icon.questionCircle(),
                    onClick: () => XH.alert({
                        message: p(aboutBlurb)
                    })
                })
            ],
            item: grid()
        });
    }
});