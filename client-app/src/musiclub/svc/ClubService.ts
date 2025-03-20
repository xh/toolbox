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

    getMeeting(id: string): Meeting {
        return id ? this.meetings.find(it => it.id.toString() === id.toString()) : null;
    }

    override async initAsync(): Promise<void> {
        await super.initAsync();

        try {
            const raw = await XH.jsonBlobService.getAsync(XH.getConf('musiclubToken', 'b127ae12')),
                meetings: Meeting[] = [],
                rejected = [];

            raw.value.map(it => {
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
            date,
            dateYear: date ? parseInt(date.format('YYYY')) : null,
            year: raw.year,
            location: raw.location,
            notes: raw.notes,
            plays: raw.plays.map(it => this.processRawPlay(it))
        };
    }

    processRawPlay(raw: PlainObject): Play {
        const ret = {
            id: raw.id,
            member: raw.member ?? '[???]',
            artist: raw.artist ?? '[???]',
            title: raw.title ?? '[???]',
            album: raw.album ?? '[???]',
            isBonus: raw.isBonus,
            bonusDisplay: raw.isBonus ? 'Extra Credit' : 'For Reals',
            notes: raw.notes
        };

        // Observed in data - AI seems to have made this assumption.
        if (ret.member === ret.artist) {
            ret.member = '[???]';
        }

        return ret;
    }
}
