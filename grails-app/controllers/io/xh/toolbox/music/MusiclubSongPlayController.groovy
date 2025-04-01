package io.xh.toolbox.music

import io.xh.hoist.RestController
import io.xh.hoist.security.Access

@Access(['MANAGE_MUSIC_CLUB_SONG_PLAY'])
class MusiclubSongPlayController extends RestController {

    static restTarget = SongPlay

    def musicBrainzService

    def enhance(Long id) {
        renderJSON(musicBrainzService.enhancePlay(id))
    }

    def lookupData() {
        renderJSON(
            meetings: Meeting.list().collect {
                [
                    value: it.id,
                    label: it.displayName
                ]
            }
        )
    }

}
