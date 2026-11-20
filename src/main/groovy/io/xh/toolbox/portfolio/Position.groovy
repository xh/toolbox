package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormatCached

class Position extends JSONFormatCached {
    String id
    String name
    long pnl
    long dayPnl
    long mktVal
    long longMktVal
    long shortMktVal
    long cost
    long commission
    List<Position> children

    /** Roll up metrics from members - child Positions or PricedRawPositions. */
    static Position rollup(String id, String name, List members, List<Position> children = null) {
        return new Position(
                id: id,
                name: name,
                children: children,
                pnl: members.sum { it.pnl } as long,
                dayPnl: members.sum { it.dayPnl } as long,
                mktVal: members.sum { it.mktVal } as long,
                longMktVal: members.sum { it.longMktVal } as long,
                shortMktVal: members.sum { it.shortMktVal } as long,
                cost: members.sum { it.cost } as long,
                commission: members.sum { it.commission } as long
        )
    }

    Map formatForJSON(boolean includeChildren = true) {
        return [
                id         : id,
                name       : name,
                pnl        : pnl,
                dayPnl     : dayPnl,
                mktVal     : mktVal,
                longMktVal : longMktVal,
                shortMktVal: shortMktVal,
                cost       : cost,
                commission : commission,
                children   : includeChildren ? children : null
        ]
    }
}
