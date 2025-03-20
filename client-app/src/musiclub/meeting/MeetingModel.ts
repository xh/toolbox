import {DataViewModel} from '@xh/hoist/cmp/dataview';
import {div, h2, p} from '@xh/hoist/cmp/layout';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {computed, makeObservable} from '@xh/hoist/mobx';
import {Meeting, Play} from '../Types';

export class MeetingModel extends HoistModel {
    @managed dataViewModel: DataViewModel;

    @computed
    get meeting(): Meeting {
        const {id} = this.componentProps;
        return id ? XH.clubService.getMeeting(id) : null;
    }

    constructor() {
        super();
        makeObservable(this);

        this.dataViewModel = new DataViewModel({
            store: {
                fields: [
                    {name: 'member', type: 'string'},
                    {name: 'artist', type: 'string'},
                    {name: 'title', type: 'string'},
                    {name: 'album', type: 'string'},
                    {name: 'isBonus', type: 'bool'},
                    {name: 'notes', type: 'string'},
                    {name: 'trackDisplay', type: 'string'},
                    {name: 'memberDisplay', type: 'string'}
                ]
            },
            showHover: false,
            itemHeight: 100,
            selModel: null,
            renderer: (v, {record}) => {
                const play: Play = record.data as Play;
                return div({
                    className: 'mc-list__item',
                    items: [
                        h2({
                            item: play.member,
                            className: 'mc-member'
                        }),
                        p(play.artist + ': ' + play.album),
                        p(play.title)
                    ]
                });
            }
        });

        this.addReaction({
            track: () => this.meeting,
            run: () => {
                const {meeting} = this;
                if (meeting) {
                    this.dataViewModel.loadData(meeting.plays);
                } else {
                    this.dataViewModel.clear();
                }
            },
            fireImmediately: true
        });
    }
}
