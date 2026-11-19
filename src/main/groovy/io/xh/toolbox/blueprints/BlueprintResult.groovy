package io.xh.toolbox.blueprints

import io.xh.hoist.json.JSONFormat

/** The rows of a data request, plus its server aggregates when it asks for any. */
class BlueprintResult implements JSONFormat {
    List<Map> rows
    /** Each {dims, values}. Null unless the request names a server field and a grouping set. */
    List<Map> aggregates

    Map formatForJSON() {
        aggregates == null ? [rows: rows] : [rows: rows, aggregates: aggregates]
    }
}
