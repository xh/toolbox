package io.xh.toolbox.music

import grails.gorm.transactions.Transactional
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
        def ePlays = mtg.plays.collect {
            try {
                enhancePlay(it.id)
            } catch (e) {
                logError("Error enhancing play ID $it.id", it.formatForJSON(), e)
            }
        }

        return [
            *    : mtg.formatForJSON(),
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
            date     : play.meeting.year,
            release  : play.album,
            artist   : play.artist
        ].each { k, v ->
            if (v) {
                qParts << "$k:$v"
            }
        }

        def get = new HttpGet(buildUri('recording', [
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
            matches = recordings.findAll { it.score == highScore }

            logInfo("Found ${matches.size()} matches with high score ${highScore}")
        }

        return [
            *      : play.formatForJSON(),
            matches: matches
        ]
    }

    @Transactional
    Map enhanceArtist(Long playId, Integer minScore = 90) {
        withInfo(["Enhancing artist", [playId: playId]]) {
            SongPlay play = SongPlay.get(playId)
            Map<String, Object> ret = [play: play, error: null]

            if (!play) {
                ret.error = "Play ID $playId not found"
            } else if (!play.artist) {
                ret.error = "Missing artist name"
            } else if (play.artistMbId) {
                ret.error = "Artist mbId already set"
            } else {
                def uri = buildUri('artist', [query: "artist:${play.artist}"]),
                    results = client.executeAsMap(new HttpGet(uri)),
                    matches = results.artists as List

                if (!matches) {
                    ret.error = "No matches found for [${play.artist}]"
                } else {
                    def bestMatch = matches.first(),
                        bestId = bestMatch.id,
                        bestName = bestMatch.name,
                        bestScore = bestMatch.score,
                        ties = matches.findAll { it.score == bestScore }

                    if (bestScore >= minScore) {
                        if (ties.size() > 1) {
                            ret.error = "Multiple matches found with same top score $bestScore"
                            ret.possibleArtists = ties
                        } else {
                            // We have a match that we will take!
                            if (!Artist.findByMbId(bestId)) {
                                logInfo("Creating new artist", [name: bestName, mbId: bestId])
                                def artist = new Artist(
                                    name: bestName,
                                    mbId: bestId,
                                    mbJson: bestMatch.toString()
                                )
                                artist.save()
                            }

                            play.artistMbId = bestId
                            play.save()
                            ret.artist = bestMatch
                        }
                    } else {
                        ret.error = "No good match found for ${play.artist} - best score ${bestScore}"
                        ret.possibleArtists = matches.take(5)
                    }
                }
            }

            return ret
        }
    }

    @Transactional
    enhanceRelease(Long playId) {

        // 1)  use [album name, artist mbId, meeting year] to find release-group
        //     http://localhost:5000/ws/2/release-group/?fmt=json&query=release:unrest%20AND%20arid:6ba2f6ce-50be-47df-b5a3-298ef032f476%20AND%20firstreleasedate:1974

        // 2)  use [rgId, meeting year] to find release - could also do status:Official
        //     http://localhost:5000/ws/2/release/?fmt=json&query=rgid:d1fac684-703d-3fed-90f6-24ef55aca4ae%20AND%20date:1974
        // 2a) Browse release-group, inc releases
        //     http://localhost:5000/ws/2/release-group/d1fac684-703d-3fed-90f6-24ef55aca4ae?fmt=json&inc=releases

        // 3)  use [releaseId, track title] to find recording
        //     http://localhost:5000/ws/2/recording/?fmt=json&query=reid:ad485e54-8780-4a66-9429-14dbdee258c5%20AND%20recording:Bittern%20Storm%20Over%20Ulm
        // 3a) browse release, inc recordings
        //     http://localhost:5000/ws/2/release/ad485e54-8780-4a66-9429-14dbdee258c5?fmt=json&inc=recordings

        // 4) browse recording, inc isrcs
        //    http://localhost:5000/ws/2/recording/b37797ec-f3cc-4797-a229-9826d49f939e?fmt=json&inc=isrcs


    }


    //------------------
    // Implementation
    //------------------
    private URI buildUri(String path, Map queryParams = [:]) {
        def uriBuilder = new URIBuilder("${baseApiUri}${path}")

        [
            *  : queryParams,
            fmt: 'json'
        ].each { k, v -> uriBuilder.addParameter(k.toString(), v.toString()) }
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
