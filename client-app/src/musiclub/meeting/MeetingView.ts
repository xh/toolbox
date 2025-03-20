import {dataView} from '@xh/hoist/cmp/dataview';
import {div, h1, h2, placeholder} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {panel} from '@xh/hoist/mobile/cmp/panel';
import {MeetingModel} from './MeetingModel';
import './Meeting.scss';

export const meetingView = hoistCmp.factory({
    displayName: 'MeetingView',
    model: creates(MeetingModel),
    className: 'mc-meeting-view',

    render({model, id, className}) {
        const {meeting: mtg} = model;
        if (!mtg) return placeholder(`Mystery meeting ID:${id} - unknown`);

        return panel({
            className,
            items: [
                div({
                    className: 'mc-meeting-view__header',
                    items: [h1(`#${mtg.id} - ${mtg.year}`), h2(`${mtg.location} - ${mtg.date}`)]
                }),
                dataView({className: 'mc-list'})
            ]
        });
    }
});
