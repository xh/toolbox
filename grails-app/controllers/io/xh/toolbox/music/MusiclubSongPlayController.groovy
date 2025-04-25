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

    def enhancePlays() {
        def req = parseRequestJSON(),
            ids = req.ids as List<Long>,
            ignoreCurrent = req.ignoreCurrent as boolean,
            minScore = (req.minScore ?: 90) as int,
            ret = ids.collect {
                try {
                    musicBrainzService.enhancePlay(it, ignoreCurrent, minScore)
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
                [value: it.id, label: it.displayName]
            },
            artists: getLookup('artist'),
            releaseGroups: getLookup('releaseGroup'),
            releases: getLookup('release'),
            recordings: getLookup('recording')
        )
    }

    protected void preprocessSubmit(Map submit) {
        if (submit.artistMbId) musicBrainzService.ensureArtistCreated(submit.artistMbId as String)
        if (submit.releaseGroupMbId) musicBrainzService.ensureReleaseGroupCreated(submit.releaseGroupMbId as String)
        if (submit.releaseMbId) musicBrainzService.ensureReleaseCreated(submit.releaseMbId as String)
        if (submit.recordingMbId) musicBrainzService.ensureRecordingCreated(submit.recordingMbId as String)
    }

    private List<Map> getLookup(String entity) {
        def list = MbEntity.findAllByType(entity)
        return list.collect {
            [
                value: it.mbId,
                label: it.displayName
            ]
        }
    }

}
