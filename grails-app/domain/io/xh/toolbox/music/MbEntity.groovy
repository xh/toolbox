package io.xh.toolbox.music

import io.xh.hoist.json.JSONFormat
import io.xh.hoist.json.JSONParser

/**
 * Generic domain object to represent a persisted entity from MusicBrainz.
 * Type is discriminator - will be one of:
 *      - artist
 *      - releaseGroup
 *      - release
 *      - recording
 */
class MbEntity implements JSONFormat {

    String type
    String name
    String mbId
    String mbJson

    String getDisplayName() {
        if (type == 'releaseGroup') {
            return "${name} (${parsedMbJson['primary-type']})"
        }
        return name
    }

    Map getParsedMbJson() {
        return mbJson ? JSONParser.parseObject(mbJson) : null
    }

    static mapping = {
        cache true
        mbJson type: 'text'
    }

    Map formatForJSON() {
        [
            id    : id,
            type  : type,
            name  : name,
            mbId  : mbId,
            mbJson: parsedMbJson
        ]
    }

    Map formatForAdminJSON() {
        [
            id    : id,
            type  : type,
            name  : name,
            mbId  : mbId,
            mbJson: mbJson
        ]
    }


}
