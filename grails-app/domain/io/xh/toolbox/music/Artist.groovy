package io.xh.toolbox.music

import io.xh.hoist.json.JSONFormat
import io.xh.hoist.json.JSONParser

class Artist implements JSONFormat {

    String name
    String mbId
    String mbJson

    String getParsedMbJson() {
        return mbJson ? JSONParser.parseObject(mbJson) : null
    }

    static mapping = {
        cache true
        mbJson type: 'text'
    }

    Map formatForJSON() {
        [
            id    : id,
            name  : name,
            mbId  : mbId,
            mbJson: parsedMbJson
        ]
    }


}
