package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

class GroupedPosition extends JSONFormatCached {
    String id
    String name
    long pnl
    long mktVal
    List<GroupedPosition> children

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
