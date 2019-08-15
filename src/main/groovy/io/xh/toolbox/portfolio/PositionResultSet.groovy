package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

class PositionResultSet extends JSONFormatCached {

    PositionQuery query
    Position root

    Map formatForJSON() {
        return [
                query: query,
                root: root
        ]
    }
}
