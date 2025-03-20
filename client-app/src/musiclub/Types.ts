import {LocalDate} from '@xh/hoist/utils/datetime';

export interface Meeting {
    id: string;
    date: LocalDate;
    dateYear: number;
    year: string;
    location: string;
    notes: string;
    plays: Play[];
}

export interface Play {
    id: string;
    member: string;
    artist: string;
    title: string;
    album: string;
    isBonus: boolean;
    bonusDisplay: string;
    notes: string;
}

export interface MeetingGroup {
    id: string;
    title: string;
    dimension: MeetingDim;
    meetingCount: number;
    meetings: Meeting[];
}

export type MeetingDim = 'year' | 'location' | 'meeting' | 'dateYear';
