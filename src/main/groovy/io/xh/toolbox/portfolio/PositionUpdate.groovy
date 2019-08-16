package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormat

class PositionUpdate implements JSONFormat {
    Collection<Position> updates
    Collection<Map> adds
    Collection<String> deletes

    Object formatForJSON() {
        return [
                updates: updates.collect {it.formatForJSON(false)},
                adds: adds,
                deletes: deletes
        ]
    }
}
