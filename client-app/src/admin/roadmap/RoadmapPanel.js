import {hoistCmp, creates, XH} from '@xh/hoist/core';
import {grid} from '@xh/hoist/cmp/grid';
import {filler, p, span} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {buttonGroupInput, textArea, textInput} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';

import {RoadmapPanelModel} from './RoadmapPanelModel'

export const RoadmapPanel = hoistCmp.factory({
    model: creates(RoadmapPanelModel),
    render({model}) {
        const {RoadmapPanelModel} = model;

        return panel({
            tbar: [
                span('Group By: '),
                buttonGroupInput({
                    bind: 'groupBy',
                    enableClear: true,
                    items: [
                        button({
                            text: 'Phase',
                            value: 'phase'
                        }),
                        button({
                            text: 'Status',
                            value: 'status'
                        })
                    ]
                }),
                filler(),
                button({
                    title: 'About',
                    text: 'About the Roadmap',
                    icon: Icon.questionCircle()
                })
            ],
            item: grid()
        })
    }
})