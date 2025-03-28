package io.xh.toolbox.music

import io.xh.hoist.RestController
import io.xh.hoist.security.Access

@Access(['MANAGE_MUSIC_CLUB_MEETING'])
class MusiclubMeetingController extends RestController {

    static restTarget = Meeting

    MusicService musicService
    MusicBrainzService musicBrainzService

    def enhance(Long id) {
        renderJSON(musicBrainzService.enhanceMeeting(id))
    }

    def importFromJson(String token, Boolean deleteExisting) {
        renderJSON(musicService.importFromJsonBlob(token, deleteExisting))
    }

}
