import {DataViewModel} from '@xh/hoist/cmp/dataview';
import {div, h2, p} from '@xh/hoist/cmp/layout';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {computed, makeObservable} from '@xh/hoist/mobx';
import {albumIcon, artistIcon, trackIcon} from '../Icons';
import {Meeting, Play} from '../Types';

export class MeetingModel extends HoistModel {
    @managed dataViewModel: DataViewModel;

    @computed
    get meeting(): Meeting {
        const {slug} = this.componentProps;
        return XH.clubService.getMeeting(slug);
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
                    {name: 'bonus', type: 'bool'},
                    {name: 'notes', type: 'string'},
                    {name: 'bonusDisplay', type: 'string'}
                ]
            },
            groupBy: 'bonusDisplay',
            showHover: false,
            itemHeight: 130,
            selModel: null,
            showGroupRowCounts: false,
            renderer: (v, {record}) => {
                const play: Play = record.data as Play;
                return div({
                    className: 'mc-list__item mc-list__item--songPlay',
                    items: [
                        h2({
                            item: play.member,
                            className: 'mc-member'
                        }),
                        p(artistIcon(), play.artist),
                        p(albumIcon(), play.album),
                        p(trackIcon(), play.title)
                    ]
                });
            },
            groupSortFn: (a, b) => {
                return (a ? 0 : 1) - (b ? 0 : 1);
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
