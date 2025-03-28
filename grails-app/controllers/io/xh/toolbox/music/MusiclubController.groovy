package io.xh.toolbox.music

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

@AccessAll
class MusiclubController extends BaseController {

    def meetings() {
        renderJSON(Meeting.list())
    }

    def plays() {
        renderJSON(SongPlay.list())
    }
}
