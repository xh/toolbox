package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormat

class PositionUpdate implements JSONFormat {
    Collection<Position> update
    Collection<Map> add
    Collection<String> remove

    Object formatForJSON() {
        return [
                update: update.collect {it.formatForJSON(false)},
                add: add,
                remove: remove
        ]
    }
}
