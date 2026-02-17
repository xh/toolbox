import {HoistService, XH} from '@xh/hoist/core';

export interface HighScore {
    score: number;
    difficulty: string;
    date: string;
}

/**
 * Service to manage high scores for board games.
 * Scores are persisted per-user via Hoist preferences.
 */
export class BoardGameService extends HoistService {
    getHighScores(game: string): HighScore[] {
        const all = XH.getPref('boardGameHighScores') ?? {};
        return all[game] ?? [];
    }

    submitScore(game: string, score: number, difficulty: string) {
        const all = XH.getPref('boardGameHighScores') ?? {},
            scores = all[game] ?? [];

        scores.push({score, difficulty, date: new Date().toISOString()});
        scores.sort((a, b) => a.score - b.score);
        all[game] = scores.slice(0, 10);
        XH.setPref('boardGameHighScores', all);
    }
}
