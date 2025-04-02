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

    def enhanceArtist(Long id) {
        renderJSON(musicBrainzService.enhanceArtist(id))
    }

    def enhanceArtists() {
        def ids = parseRequestJSON().ids as List<Long>,
            ret = ids.collect {
                try {
                    musicBrainzService.enhanceArtist(it)
                } catch (e) {
                    logError("Error enhancing play ID $it", e)
                    return [id: it, error: e.message]
                }
            }
        renderJSON(ret)
    }

    def lookupData() {
        renderJSON(
            meetings: Meeting.list().collect {
                [
                    value: it.id,
                    label: it.displayName
                ]
            },
            artists: Artist.list().collect{
                [
                    value: it.mbId,
                    label: it.name
                ]
            }
        )
    }

}
