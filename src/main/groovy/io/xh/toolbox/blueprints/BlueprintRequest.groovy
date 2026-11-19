package io.xh.toolbox.blueprints

import io.xh.hoist.data.filter.Filter

/** A data request checked against the catalog, with param values resolved to their types. */
class BlueprintRequest {
    String dataset
    Map<String, Object> params
    List<String> fields
    List<FieldInstance> instances
    Filter filter
}

/** A parameterized catalog field, requested under its own name. */
class FieldInstance {
    String name
    String field
    Map<String, Object> params
}
