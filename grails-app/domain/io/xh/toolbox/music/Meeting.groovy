package io.xh.toolbox.music

import io.xh.hoist.json.JSONFormat

import java.time.LocalDate

class Meeting implements JSONFormat {

    String slug
    String location
    LocalDate date
    String year
    String notes

    static hasMany = [plays: SongPlay]

    static constraints = {
        slug blank: false, maxSize: 20
        location nullable: true, maxSize: 100
        year nullable: true, maxSize: 4
        notes nullable: true, maxSize: 1500
        plays cache: true
    }

    static mapping = {
        cache true
    }

    Map formatForJSON() {
        [
            id      : id,
            slug    : slug,
            location: location,
            date    : date,
            year    : year,
            notes   : notes,
            plays   : plays
        ]
    }
}
