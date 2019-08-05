package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

class PositionQuery extends JSONFormatCached {

    List<String> dims
    Integer maxCount
    Boolean returnAllGroups

    Map formatForJSON() {
        return [
                dims: dims,
                maxCount: maxCount,
                returnAllGroups: returnAllGroups
        ]
    }
}
