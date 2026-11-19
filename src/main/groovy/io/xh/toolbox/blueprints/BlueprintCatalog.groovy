package io.xh.toolbox.blueprints

import io.xh.hoist.data.filter.Filter

import java.time.LocalDate
import java.time.format.DateTimeParseException

/**
 * A Blueprints Data Catalog, parsed from its JSON form. Resolves each dataset's fields and checks
 * data requests against them.
 */
class BlueprintCatalog {

    final Map json

    BlueprintCatalog(Map json) {
        this.json = json
    }

    /**
     * Merge catalogs into one, as for an app's single Data Catalog.
     * @throws IllegalStateException if they share a format, kind, field or dataset name, or differ in version.
     */
    static BlueprintCatalog merge(String label, List<Map> catalogs) {
        Set versions = catalogs*.version as Set
        if (versions.size() > 1) throw new IllegalStateException("Cannot merge catalogs of versions $versions")

        Map ret = [version: versions.first(), label: label]
        ['formats', 'kinds', 'datasets'].each { String section ->
            ret[section] = mergeUnique(section, catalogs.collect { (it[section] ?: [:]) as Map })
        }
        List<Map> fields = catalogs.collectMany { (it.fields ?: []) as List<Map> }
        Map byName = mergeUnique('fields', fields.collect { [(it.name): it] })
        ret.fields = byName.values() as List
        return new BlueprintCatalog(ret)
    }

    private static Map mergeUnique(String section, List<Map> maps) {
        Map ret = [:]
        maps.each { m ->
            m.each { k, v ->
                if (ret.containsKey(k)) throw new IllegalStateException("Catalogs both define $section '$k'")
                ret[k] = v
            }
        }
        return ret
    }

    Map<String, Map> getDatasets() {
        json.datasets as Map<String, Map>
    }

    /** A dataset's fields by name, with shared fields resolved from the catalog's `fields`. */
    Map<String, Map> fieldsFor(String dataset) {
        Map<String, Map> shared = (json.fields as List<Map>).collectEntries { [it.name, it] }
        return (datasets[dataset].fields as List).collectEntries {
            Map fd = it instanceof String ? shared[it] : it as Map
            if (!fd) throw new IllegalStateException("Catalog dataset '$dataset' names unknown shared field '$it'")
            [fd.name, fd]
        }
    }

    /**
     * Check a request against the catalog and resolve its param values to their types.
     * @throws BlueprintRequestException naming each problem found.
     */
    BlueprintRequest parseRequest(Map spec) {
        String dataset = spec.dataset
        if (!datasets[dataset]) {
            fail("Unknown dataset '$dataset'. Datasets: ${datasets.keySet().join(', ')}")
        }

        Map<String, Map> fieldDefs = fieldsFor(dataset)
        Map params = parseParams(datasets[dataset].params as Map, spec.params as Map, "dataset '$dataset'")

        List<String> fields = []
        List<FieldInstance> instances = []
        (spec.fields ?: []).each { f ->
            if (f instanceof String) {
                Map fd = fieldDefs[f]
                if (!fd) fail("Unknown field '$f' in dataset '$dataset'")
                if (fd.params) fail("Field '$f' takes parameters. Request it as an instance: {name, field, params}")
                fields << f
            } else if (f instanceof Map) {
                instances << parseInstance(f, fieldDefs, dataset)
            } else {
                fail("Each entry in fields must be a field name or an instance {name, field, params}, got '$f'")
            }
        }

        List<String> names = fields + instances*.name
        names.countBy { it }.findAll { k, v -> v > 1 }.each { k, v -> fail("Field '$k' is requested more than once") }

        Filter filter = null
        if (spec.filter) {
            try {
                filter = Filter.parse(spec.filter)
            } catch (Exception e) {
                fail("Invalid filter: ${e.message}")
            }
            Set<String> filterable = fieldDefs.keySet() + instances*.name
            filter.allFields.findAll { !(it in filterable) }.each {
                fail("Filter names unknown field '$it' in dataset '$dataset'")
            }
        }

        return new BlueprintRequest(
            dataset: dataset,
            params: params,
            fields: fields,
            instances: instances,
            filter: filter
        )
    }

    //------------------------
    // Implementation
    //------------------------
    private FieldInstance parseInstance(Map spec, Map<String, Map> fieldDefs, String dataset) {
        String name = spec.name, field = spec.field
        if (!name) fail("Field instance of '$field' needs a name")
        if (fieldDefs[name]) fail("Field instance '$name' has the name of a field in dataset '$dataset'")

        Map fd = fieldDefs[field]
        if (!fd) fail("Field instance '$name' names unknown field '$field' in dataset '$dataset'")
        if (!fd.params) fail("Field instance '$name' names '$field', which takes no parameters")

        return new FieldInstance(
            name: name,
            field: field,
            params: parseParams(fd.params as Map, spec.params as Map, "field instance '$name'")
        )
    }

    private Map parseParams(Map defs, Map values, String owner) {
        defs = defs ?: [:]
        values = values ?: [:]
        values.keySet().findAll { !defs.containsKey(it) }.each {
            fail("Unknown parameter '$it' for $owner. Parameters: ${defs.keySet().join(', ')}")
        }
        return defs.collectEntries { String name, Map fd ->
            def val = parseValue(values[name], fd.type as String, "Parameter '$name' of $owner")
            if (val == null && fd.required) fail("$owner requires parameter '$name'".capitalize())
            List allowed = fd.options?.values as List
            if (val != null && allowed && !(val in allowed)) {
                fail("Parameter '$name' of $owner must be one of ${allowed.join(', ')}, got '$val'")
            }
            [name, val]
        }
    }

    private static Object parseValue(Object val, String type, String desc) {
        if (val == null || val == '') return null
        switch (type) {
            case 'localDate':
                if (val instanceof LocalDate) return val
                try {
                    return LocalDate.parse(val as String)
                } catch (DateTimeParseException ignored) {
                    fail("$desc must be a localDate as YYYY-MM-DD, got '$val'")
                }
            case 'number':
                if (!(val instanceof Number)) fail("$desc must be a number, got '$val'")
                return (val as Number).doubleValue()
            case 'int':
                if (!(val instanceof Number) || val as long != val) fail("$desc must be an int, got '$val'")
                return (val as Number).intValue()
            case 'bool':
                if (!(val instanceof Boolean)) fail("$desc must be a bool, got '$val'")
                return val
            default:
                return val
        }
    }

    private static void fail(String msg) {
        throw new BlueprintRequestException(msg)
    }
}
