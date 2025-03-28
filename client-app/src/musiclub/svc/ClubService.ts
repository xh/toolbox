import {HoistService, PlainObject, XH} from '@xh/hoist/core';
import {observable, runInAction} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {Meeting, MeetingDim, MeetingGroup, Play} from '../Types';

export class ClubService extends HoistService {
    @observable.ref meetings: Meeting[] = [];

    getMeetingsBy(dim: MeetingDim): MeetingGroup[] {
        const map: {[key: string]: MeetingGroup} = {};
        this.meetings.forEach(mtg => {
            const val = mtg[dim];
            if (!map[val])
                map[val] = {
                    id: val,
                    title: val,
                    dimension: dim,
                    meetingCount: 0,
                    meetings: []
                };

            const grp = map[val];
            grp.meetingCount++;
            grp.meetings.push(mtg);
        });
        return Object.values(map);
    }

    getMeeting(slug: string): Meeting {
        return slug ? this.meetings.find(it => it.slug === slug) : null;
    }

    override async initAsync(): Promise<void> {
        await super.initAsync();

        try {
            const raw = await XH.fetchJson({url: 'musiclub/meetings'}),
                meetings: Meeting[] = [],
                rejected = [];

            raw.map(it => {
                try {
                    const mtg = this.processRawMeeting(it);
                    if (mtg.year) {
                        meetings.push(mtg);
                    } else {
                        rejected.push(mtg);
                    }
                } catch (e) {
                    this.logError('Error processing meeting', it, e);
                }
            });
            runInAction(() => (this.meetings = meetings));
            this.logInfo(`Loaded ${meetings.length} meetings`, meetings);
            if (rejected.length) {
                this.logWarn(`Rejected ${rejected.length} meetings`, rejected);
            }
        } catch (e) {
            XH.handleException(e, {title: 'Error loading Musiclub data'});
        }
    }

    processRawMeeting(raw: PlainObject): Meeting {
        const date = LocalDate.get(raw.date);
        return {
            id: raw.id,
            slug: raw.slug,
            date,
            dateYear: date ? parseInt(date.format('YYYY')) : null,
            year: raw.year,
            location: raw.location,
            notes: raw.notes,
            plays: raw.plays.map(it => this.processRawPlay(it))
        };
    }

    processRawPlay(raw: PlainObject): Play {
        return {
            id: raw.id,
            slug: raw.slug,
            member: raw.member ?? '[???]',
            artist: raw.artist ?? '[???]',
            title: raw.title ?? '[???]',
            album: raw.album ?? '[???]',
            bonus: raw.bonus,
            bonusDisplay: raw.bonus ? 'Bonus Round' : 'Main Picks',
            notes: raw.notes
        };
    }
}
