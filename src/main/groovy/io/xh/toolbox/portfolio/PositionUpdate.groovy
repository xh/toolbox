package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormat

class PositionUpdate implements JSONFormat {
    boolean isFull
    List<Position> positions

    Object formatForJSON() {
        return [
                isFull: isFull,
                positions: positions
        ]
    }
}
