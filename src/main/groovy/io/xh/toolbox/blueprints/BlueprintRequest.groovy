package io.xh.toolbox.blueprints

import io.xh.hoist.data.filter.Filter

/** A data request checked against the catalog, with param values resolved to their types. */
class BlueprintRequest {
    String dataset
    Map<String, Object> params
    List<String> fields
    List<FieldInstance> instances
    Filter filter
    /** Grouping sets that need server values, each a sorted list of dimensions. */
    List<List<String>> groupBy = []
    /** Requested columns that roll up on the server, each as {name, field, params}. */
    List<Map> serverColumns = []
}

/** A parameterized catalog field, requested under its own name. */
class FieldInstance {
    String name
    String field
    Map<String, Object> params
}
