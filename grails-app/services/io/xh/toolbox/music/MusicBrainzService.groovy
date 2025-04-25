package io.xh.toolbox.music

import grails.gorm.transactions.Transactional
import groovy.transform.NamedParam
import groovy.transform.NamedVariant
import io.xh.hoist.BaseService
import io.xh.hoist.http.JSONClient
import io.xh.hoist.json.JSONSerializer
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

    @Transactional
    ResResults enhancePlay(Long id, boolean ignoreCurrent, int minScore = 90) {
        def play = SongPlay.get(id)

        if (!play) {
            return new ResResults(
                play: play,
                error: "No play found with ID $id"
            )
        }

        def artistResults = resolveArtist(play, ignoreCurrent, minScore)
        if (artistResults.error) return artistResults

        def releaseGroupResults = resolveReleaseGroup(play, ignoreCurrent, minScore).withPriorResults(artistResults)
        if (releaseGroupResults.error) return releaseGroupResults

        def releaseResults = resolveRelease(play, ignoreCurrent, minScore).withPriorResults(releaseGroupResults)
        if (releaseResults.error) return releaseResults

        return resolveRecording(play, ignoreCurrent, minScore).withPriorResults(releaseResults)

        // 0)  use artistName to find artist

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

    @Transactional
    ensureArtistCreated(String mbId) {
        getOrFetchAndCreateMbEntity(mbId, 'artist')
    }

    @Transactional
    ensureReleaseGroupCreated(String mbId) {
        getOrFetchAndCreateMbEntity(mbId, 'releaseGroup')
    }

    @Transactional
    ensureReleaseCreated(String mbId) {
        getOrFetchAndCreateMbEntity(mbId, 'release')
    }

    @Transactional
    ensureRecordingCreated(String mbId) {
        getOrFetchAndCreateMbEntity(mbId, 'recording')
    }

    @Transactional
    ResResults resolveArtist(SongPlay play, boolean ignoreCurrent, Integer minScore) {
        resolveEntity(
            play: play,
            entityType: 'artist',
            requiredProps: ['artist'],
            queryBuilder: { SongPlay p -> "artist:${p.artist}" },
            minScore: minScore,
            ignoreCurrent: ignoreCurrent
        )
    }

    @Transactional
    ResResults resolveReleaseGroup(SongPlay play, boolean ignoreCurrent, Integer minScore) {
        def ret = resolveEntity(
            play: play,
            entityType: 'releaseGroup',
            requiredProps: ['albumOrTitle', 'artistMbId'],
            queryBuilder: { SongPlay p ->
                "release:${p.albumOrTitle} AND arid:${p.artistMbId} AND firstreleasedate:${p.meeting.year}"
            },
            fallbackQueries: [
                { SongPlay p -> "release:${p.albumOrTitle} AND arid:${p.artistMbId}" },
                { SongPlay p -> "release:${p.albumOrTitle} AND artist:${p.artistName}" }
            ],
            minScore: minScore,
            ignoreCurrent: ignoreCurrent
        )

//        if (ret.mbEntity && !play.coverArtUrl) {
//
//        }

        return ret

    }

    Map getReleaseGroupCoverArtData(String mbId) {
        def get = new HttpGet("https://coverartarchive.org/release-group/${mbId}")
        client.executeAsMap(get)
    }

    @Transactional
    ResResults resolveRelease(SongPlay play, boolean ignoreCurrent, Integer minScore) {
        resolveEntity(
            play: play,
            entityType: 'release',
            requiredProps: ['releaseGroupMbId'],
            queryBuilder: { SongPlay p -> "rgid:${p.releaseGroupMbId} AND date:${p.meeting.year}" },
            fallbackQueries: [
                { SongPlay p -> "rgid:${p.releaseGroupMbId}" }
            ],
            minScore: minScore,
            ignoreCurrent: ignoreCurrent
        )
    }

    @Transactional
    ResResults resolveRecording(SongPlay play, boolean ignoreCurrent, Integer minScore) {
        resolveEntity(
            play: play,
            entityType: 'recording',
            requiredProps: ['releaseMbId', 'title'],
            queryBuilder: { SongPlay p -> "reid:${p.releaseMbId} AND recording:${p.title}" },
            minScore: minScore,
            ignoreCurrent: ignoreCurrent
        )
    }

    @NamedVariant
    private ResResults resolveEntity(
        @NamedParam SongPlay play,
        @NamedParam String entityType,
        @NamedParam Collection<String> requiredProps,
        @NamedParam Closure<SongPlay> queryBuilder,
        @NamedParam List<Closure<SongPlay>> fallbackQueries,
        @NamedParam Integer minScore,
        @NamedParam boolean ignoreCurrent = false
    ) {
        withInfo(["Resolving $entityType", [playId: play.id]]) {
            ResResults ret = new ResResults(entityType: entityType, play: play)

            def missingProps = requiredProps.findAll { play[it] == null }
            if (missingProps) {
                return ret.withError("Missing required properties: ${missingProps.join(', ')}")
            }

            def mbIdProp = "${entityType}MbId",
                currMbId = play[mbIdProp] as String

            if (currMbId && !ignoreCurrent) {
                def mbEntity = MbEntity.findByMbId(currMbId)
                if (mbEntity) {
                    return ret.withEntity(mbEntity)
                } else {
                    logWarn("Play $mbIdProp $currMbId set but entity not found - will attempt to lookup")
                }
            }

            def query = queryBuilder(play)
            ret.query = query

            def apiEndpointPath = entityType == 'releaseGroup' ? 'release-group' : entityType,
                apiResponsePath = "${apiEndpointPath}s",
                uri = buildUri(apiEndpointPath, [query: query]),
                results = client.executeAsMap(new HttpGet(uri))

            ret = withMatches(ret, results[apiResponsePath] as List, minScore)

            if (ret.error && fallbackQueries) {
                fallbackQueries.eachWithIndex { f, idx ->
                    if (!ret.error) return // prior fallback might have worked

                    logWarn("No $entityType found for play ${play.id} so far - trying fallback query ${idx}")
                    query = f(play)
                    ret.query = query
                    ret.isFallback = true

                    uri = buildUri(apiEndpointPath, [query: query])
                    results = client.executeAsMap(new HttpGet(uri))
                    ret = withMatches(ret, results[apiResponsePath] as List, minScore)
                }
            }

            return ret
        }
    }

    private ResResults withMatches(ResResults results, List<Map> rawMatches, int minScore) {
        def matches = evalMatches(rawMatches, results.entityType, minScore)

        results.matchResults = matches
        results.mbEntity = matches.mbEntity
        results.error = matches.error

        if (matches.mbId) {
            results.play["${results.entityType}MbId"] = matches.mbId
            results.play.save()
        }

        results
    }

    private MatchResults evalMatches(List<Map> matches, String entityType, int minScore) {
        def ret = new MatchResults()

        if (!matches) {
            ret.error = 'No matches found'
        } else {
            ret.possibleMatches = matches.take(5)

            def bestMatch = matches.first(),
                bestScore = bestMatch.score,
            // Count as tie if within two points ("Phoenix" artist search)
                ties = matches.findAll { it.score >= (bestScore - 2) },
                tiedMatch = ties.size() > 1

            // Favor groups over people for artist matches
            if (tiedMatch && entityType == 'artist') {
                bestMatch = ties.find { it['type'] == 'Group' } ?: bestMatch
            }

            // Favor albums over singles for releaseGroup matches
            if (tiedMatch && entityType == 'releaseGroup') {
                bestMatch = ties.find { it['primary-type'] == 'Album' } ?: bestMatch
            }

            if (bestScore >= minScore) {
                if (tiedMatch) {
                    ret.notes = "Multiple matches found with same top score $bestScore - taking first one"
                    ret.mbEntity = getOrCreateMbEntity(bestMatch, entityType)
                } else {
                    ret.mbEntity = getOrCreateMbEntity(bestMatch, entityType)
                }
            } else {
                ret.error = "No good match found - best score ${bestScore}"
            }
        }

        return ret
    }

    @Transactional
    private MbEntity getOrFetchAndCreateMbEntity(String mbId, String entityType) {
        def mbEntity = MbEntity.findByMbId(mbId)
        if (!mbEntity) {
            try {
                withInfo("No $entityType found with MBID $mbId - looking up and creating new record") {
                    Map raw = getRawEntityData(mbId, entityType)
                    String name = raw[entityType == 'artist' ? 'name' : 'title']
                    mbEntity = new MbEntity(
                        type: entityType,
                        name: name,
                        mbId: mbId,
                        mbJson: JSONSerializer.serialize(raw)
                    ).save(flush: true)
                }
            } catch (Exception e) {
                logError("Error fetching $entityType with MBID $mbId", e)
            }
        }
        return mbEntity
    }

    // Create a MbEntity if needed from raw data that's already been acquired - eg from a search hit.
    @Transactional
    private MbEntity getOrCreateMbEntity(Map raw, String type) {
        String id = raw.id
        String name = raw[type == 'artist' ? 'name' : 'title']
        MbEntity ret = MbEntity.findByMbId(id)

        if (!ret) {
            logInfo("No $type found with MBID $id - creating new record now for $name")
            ret = new MbEntity(
                type: type,
                name: name,
                mbId: id,
                mbJson: JSONSerializer.serialize(raw)
            ).save(flush: true)
        }

        return ret
    }

    private getRawEntityData(String mbId, String entityType) {
        def mbType = entityType == 'releaseGroup' ? 'release-group' : entityType,
            uri = buildUri("$mbType/$mbId"),
            ret = client.executeAsMap(new HttpGet(uri))

        if (ret.error) throw new RuntimeException("Error fetching $mbId from MB: ${ret.error}")
        return ret
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

class ResResults {
    SongPlay play
    String entityType
    /** Entity from match results, or pre-existing */
    MbEntity mbEntity
    String query
    boolean isFallback
    String error
    MatchResults matchResults
    ResResults priorResults

    ResResults withError(String error) {
        this.error = error
        this
    }

    ResResults withEntity(MbEntity mbEntity) {
        this.mbEntity = mbEntity
        this
    }

    ResResults withPriorResults(ResResults priorResults) {
        this.priorResults = priorResults
        this
    }
}

class MatchResults {
    MbEntity mbEntity
    String error
    String notes
    List<Map> possibleMatches = []

    String getMbId() { mbEntity?.mbId }
}
