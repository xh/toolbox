import {HoistService, PlainObject, XH} from '@xh/hoist/core';
import {observable, runInAction} from '@xh/hoist/mobx';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {Meeting, MeetingGroup, Play} from '../Types';

export class ClubService extends HoistService {
    @observable.ref meetings: Meeting[] = [];

    getByYear(): MeetingGroup[] {
        const map: {[key: string]: MeetingGroup} = {};
        this.meetings.forEach(mtg => {
            if (!map[mtg.year])
                map[mtg.year] = {
                    id: mtg.year,
                    title: mtg.year,
                    dimension: 'year',
                    meetingCount: 0,
                    meetings: []
                };

            const grp = map[mtg.year];
            grp.meetingCount++;
            grp.meetings.push(mtg);
        });
        return Object.values(map);
    }

    override async initAsync(): Promise<void> {
        await super.initAsync();

        try {
            const raw = await XH.jsonBlobService.getAsync('28892a6a'),
                meetings: Meeting[] = [];
            raw.value.map(it => {
                try {
                    const mtg = this.processRawMeeting(it);
                    meetings.push(mtg);
                } catch (e) {
                    this.logError('Error processing meeting', it, e);
                }
            });
            runInAction(() => (this.meetings = meetings));
            this.logInfo(`Loaded ${meetings.length} meetings`, meetings);
        } catch (e) {
            XH.handleException(e, {title: 'Error loading Musiclub data'});
        }
    }

    processRawMeeting(raw: PlainObject): Meeting {
        return {
            id: raw.meeting_number,
            date: LocalDate.get(raw.date),
            year: raw.year_featured,
            location: raw.location,
            notes: raw.notes,
            plays: raw.song_plays.map(it => this.processRawPlay(it))
        };
    }

    processRawPlay(raw: PlainObject): Play {
        return {
            id: raw.song_play_id,
            member: raw.member,
            artist: raw.artist,
            title: raw.title,
            album: raw.album,
            isBonus: raw.is_bonus_song,
            notes: raw.notes
        };
    }
}
