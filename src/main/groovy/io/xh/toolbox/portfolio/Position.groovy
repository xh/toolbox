package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

class Position extends JSONFormatCached {
    String id
    String name
    long pnl
    long mktVal
    List<Position> children

    Map formatForJSON() {
        return [
                id      : id,
                name    : name,
                pnl     : pnl,
                mktVal  : mktVal,
                children: children
        ]
    }
}
