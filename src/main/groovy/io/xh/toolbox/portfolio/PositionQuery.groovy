package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

class PositionQuery extends JSONFormatCached {

    List<String> dims
    int maxCount
    boolean returnAllGroups

    Map formatForJSON() {
        return [
                dims: dims,
                maxCount: maxCount,
                returnAllGroups: returnAllGroups
        ]
    }
}
