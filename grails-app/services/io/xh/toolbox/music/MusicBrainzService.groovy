package io.xh.toolbox.music

import io.xh.hoist.BaseService
import io.xh.hoist.http.JSONClient
import org.apache.hc.client5.http.classic.methods.HttpGet
import org.apache.hc.core5.net.URIBuilder

import static io.xh.hoist.util.Utils.isLocalDevelopment

class MusicBrainzService extends BaseService {

    private JSONClient _client

    Map enhanceMeeting(Long id) {
        def mtg = Meeting.get(id)
        if (!mtg) throw new RuntimeException("No meeting found with ID $id")

        logInfo("Enhancing meeting ${mtg.slug}", mtg.year, mtg.location, "${mtg.plays.size()} plays")
        def ePlays = mtg.plays.collect{
            try {
                enhancePlay(it.id)
            } catch (e) {
                logError("Error enhancing play ID $it.id", it.formatForJSON(), e)
            }
        }

        return [
            *:mtg.formatForJSON(),
            plays: ePlays
        ]
    }

    Map enhancePlay(Long id) {
        def play = SongPlay.get(id)
        if (!play) throw new RuntimeException("No play found with ID $id")
        if (!play.title) throw new RuntimeException("Cannot enhance play without title")

        def qParts = []
        [
            recording: play.title,
            date: play.meeting.year,
            release: play.album,
            artist: play.artist
        ].each {k, v ->
            if (v) {
                qParts << "$k:$v"
            }
        }

        def get = new HttpGet(buildUri('recording', [
            fmt: 'json',
            query: qParts.join(' AND ')
        ]))

        Map result = [:]
        withInfo(["Querying", qParts, get.uri]) {
            result = client.executeAsMap(get)
        }
        def recordings = result.recordings as List<Map>,
            matches = []

        if (!recordings) {
            logWarn("No recordings found")
        } else {
            def highScore = recordings*.score.max()
            matches = recordings.findAll{it.score == highScore}

            logInfo("Found ${matches.size()} matches with high score ${highScore}")
        }

        return [
            *:play.formatForJSON(),
            matches: matches
        ]
    }


    //------------------
    // Implementation
    //------------------
    private URI buildUri(String path, Map queryParams = [:]) {
        def uriBuilder = new URIBuilder("${baseApiUri}${path}")
        queryParams.each { k, v -> uriBuilder.addParameter(k.toString(), v.toString()) }
        return uriBuilder.build()
    }

    private getBaseApiUri() {
        return isLocalDevelopment ? "http://localhost:5000/ws/2/" : "https://musicbrainz.org/ws/2/"
    }

    private JSONClient getClient() {
        return _client ?= new JSONClient()
    }

    @Override
    void clearCaches() {
        super.clearCaches()
        _client = null
    }
}
