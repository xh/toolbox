package io.xh.toolbox.boardGames

import io.xh.hoist.BaseService
import io.xh.hoist.pref.PrefService

class BoardGameService extends BaseService {

    PrefService prefService

    List getHighScores(String game) {
        def all = getAllScores()
        return all[game] ?: []
    }

    Map submitScore(String game, int score, String difficulty) {
        def all = getAllScores()
        def scores = (all[game] ?: []) as List
        def newEntry = [
            username: username,
            score   : score,
            difficulty: difficulty,
            date    : new Date().format('yyyy-MM-dd')
        ]
        scores << newEntry
        scores.sort { it.score }
        if (scores.size() > 10) scores = scores.take(10)
        all[game] = scores
        saveAllScores(all)
        return newEntry
    }

    //------------------------
    // Implementation
    //------------------------
    private Map getAllScores() {
        return prefService.getClientPreference('boardGameHighScores')?.jsonValue ?: [:]
    }

    private void saveAllScores(Map all) {
        prefService.setClientPreference('boardGameHighScores', all)
    }
}
