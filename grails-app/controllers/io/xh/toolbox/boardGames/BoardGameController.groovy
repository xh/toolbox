package io.xh.toolbox.boardGames

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

@AccessAll
class BoardGameController extends BaseController {

    def boardGameService

    def highScores() {
        def game = params.game
        if (!game) throw new RuntimeException('Required parameter "game" not provided.')
        renderJSON(boardGameService.getHighScores(game))
    }

    def submitScore() {
        def body = parseRequestJSON()
        renderJSON(boardGameService.submitScore(
            body.game as String,
            body.score as int,
            body.difficulty as String
        ))
    }
}
