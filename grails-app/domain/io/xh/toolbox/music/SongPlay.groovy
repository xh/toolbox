package io.xh.toolbox.music

import io.xh.hoist.json.JSONFormat

import java.time.LocalDate

class SongPlay implements JSONFormat {

    String slug
    String member

    // Provided/extracted values
    String artist
    String album
    String title

    // Resolved MusicBrainz IDs / Intl. Standard Recording Code
    String artistMbId
    String releaseGroupMbId
    String releaseMbId
    String recordingMbId
    String isrc

    LocalDate releaseDate
    Boolean bonus
    String notes

    static belongsTo = [meeting: Meeting]

    static constraints = {
        slug blank: false, maxSize: 20
        member nullable: true

        artist nullable: true
        album nullable: true
        title nullable: true

        artistMbId nullable: true, maxSize: 36
        releaseGroupMbId nullable: true, maxSize: 36
        releaseMbId nullable: true, maxSize: 36
        recordingMbId nullable: true, maxSize: 36
        isrc nullable: true, maxSize: 12

        releaseDate nullable: true
        notes nullable: true, maxSize: 1500
    }

    static mapping = {
        cache true
    }

    Map formatForJSON() {
        [
            id              : id,
            meeting         : meeting.id,
            slug            : slug,
            member          : member,
            artist          : artist,
            album           : album,
            title           : title,
            artistMbId      : artistMbId,
            releaseGroupMbId: releaseGroupMbId,
            releaseMbId     : releaseMbId,
            recordingMbId   : recordingMbId,
            isrc            : isrc,
            bonus           : bonus,
            notes           : notes
        ]
    }

}
