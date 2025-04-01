package io.xh.toolbox.music

import io.xh.hoist.json.JSONFormat

import java.time.LocalDate

class SongPlay implements JSONFormat {

    String slug
    String member
    String title
    String artist
    String album

    // MusicBrainz IDs
    String trackMbId
    String releaseMbId
    String artistMbId

    // Intl. Standard Recording Code
    String isrc

    LocalDate releaseDate

    Boolean bonus
    String notes

    static belongsTo = [meeting: Meeting]

    static constraints = {
        slug blank: false, maxSize: 20
        member nullable: true
        title nullable: true
        artist nullable: true
        album nullable: true

        trackMbId nullable: true, maxSize: 36
        releaseMbId nullable: true, maxSize: 36
        artistMbId nullable: true, maxSize: 36
        isrc nullable: true, maxSize: 12

        releaseDate nullable: true

        notes nullable: true, maxSize: 1500
    }

    static mapping = {
        cache true
    }

    Map formatForJSON() {
        [
            id     : id,
            meeting: meeting.id,
            slug   : slug,
            member : member,
            title  : title,
            artist : artist,
            album  : album,
            bonus  : bonus,
            notes  : notes
        ]
    }

}
