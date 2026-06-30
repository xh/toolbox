package io.xh.toolbox.datalab

import io.xh.hoist.BaseService

import java.time.LocalDate

/**
 * Seeded, shape-parameterized synthetic dataset generator for the Data 2.0 measurement harness.
 *
 * This is the out-of-process data substrate for the harness: synthetic generation MUST NOT run in
 * the measured browser JS thread (it would compete for the main thread and pollute results), so it
 * lives here, server-side, in Toolbox's Grails layer. The generator is a PURE FUNCTION of its input
 * params - the same (seed, shape params) always regenerates byte-identical data - which is the
 * reproducibility guarantee the harness relies on to compare runs apples-to-apples.
 *
 * Deliberately decoupled from the Portfolio demo domain (own `datalab` namespace, no shared mutable
 * state) so harness load never perturbs the existing portfolio example (RESEARCH Open Question 4).
 *
 * This is reusable server-side harness infrastructure (a HARN-06 byproduct - reusable, documented,
 * config-driven), not throwaway code. It produces both an initial snapshot (HARN-01: shape knobs)
 * and successive deterministic update batches (HARN-02: update knobs) that the HTTP controller and
 * the WebSocket push service both deliver against the invariant client ingest contract
 * (snapshot -> Cube.loadDataAsync, diff -> Cube.updateDataAsync).
 *
 * Each generated leaf row is a plain Map with a stable, unique `id` so the client can apply diffs by
 * id. Rows carry a configurable mix of number / string / date / object-valued fields plus a set of
 * low-cardinality dimension fields (so the client Cube produces a realistic aggregate-row count).
 */
class DataLabService extends BaseService {

    // Fixed pools for deterministic categorical/string generation.
    private static final List<String> DIM_TOKENS = [
        'Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel',
        'India', 'Juliet', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa'
    ]
    private static final List<String> WORD_POOL = [
        'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
        'sed', 'eiusmod', 'tempor', 'incididunt', 'labore', 'magna', 'aliqua', 'enim'
    ]
    private static final LocalDate EPOCH_DATE = LocalDate.of(2020, 1, 1)

    void init() {}

    //------------------------
    // Snapshot (HARN-01)
    //------------------------
    /**
     * Generate a full, seeded leaf-row snapshot whose shape is driven entirely by the request params.
     *
     * Supported shape params (all optional, sensible defaults applied):
     *  - leafRowCount  (int)            - number of leaf rows to emit. Default 1000.
     *  - fieldCount    (int)            - number of measure/value fields per row (excludes id + dims).
     *                                     Default 10.
     *  - fieldTypeMix  (Map<String,Number>) - relative weights for value-field types across
     *                                     'number' | 'string' | 'date' | 'object'. Object-valued fields
     *                                     are required (Phase-1 heap question) and always get at least
     *                                     one field if requested by weight. Default
     *                                     [number:5, string:3, date:1, object:1].
     *  - dimensions    (int|List)       - number of categorical dimension fields (each bounded
     *                                     cardinality), OR an explicit list of [name, cardinality]
     *                                     pairs. Few/coarse dimensions over many leaves yields the
     *                                     large-leaf-plus-aggregate shape. Default 3.
     *  - dimCardinality(int)            - default cardinality applied to dimensions specified by count.
     *                                     Default 8.
     *  - seed          (long)           - RNG seed; identical seed + params => identical data. Default 0.
     *
     * @return List<Map> - one Map per leaf row, each with a stable 'id'.
     */
    List<Map> generateSnapshot(Map shapeParams) {
        def spec = resolveSpec(shapeParams)

        // Seed deterministically; data is a pure function of (seed, params).
        Random rng = new Random(spec.seed)

        List<Map> rows = new ArrayList<>(spec.leafRowCount)
        for (int i = 0; i < spec.leafRowCount; i++) {
            rows << generateRow(i, spec, rng)
        }
        return rows
    }

    //------------------------
    // Update batch (HARN-02)
    //------------------------
    /**
     * Generate a single deterministic update batch of changed-row maps for a given iteration.
     *
     * Both the HTTP diff endpoint and the WebSocket push service call this so the two transports carry
     * the IDENTICAL batch shape - the client ingest adapter resolves either to Cube.updateDataAsync.
     * Each returned map carries the row 'id' plus only the changed value fields (count driven by
     * `breadth`), except for a 'fullReplace' update which signals a full re-snapshot.
     *
     * Supported update params (orthogonal axes - see UpdateConfig client-side):
     *  - cadence    (String) - 'steady' | 'burst'. Default 'steady'. Temporal shape: 'burst' spikes
     *                          every 5th tick to 10x batch, lighter between. Orthogonal to breadth.
     *  - updateMode (String) - 'incremental' | 'fullReplace'. Default 'incremental'. 'fullReplace'
     *                          emits a re-snapshot signal; batch/breadth/cadence do not apply.
     *  - breadth   (int)    - number of value fields changed per updated row. Default 1.
     *  - batchSize (int)    - base number of rows changed per batch. Default 10.
     *  - iteration (int)    - monotonic cursor; successive iterations return successive deterministic
     *                          batches (the HTTP-poll equivalent of a stream). Default 0.
     *  - seed      (long)   - base seed; combined with iteration for per-batch determinism. Default 0.
     *  - plus the snapshot shape params (leafRowCount, fieldCount, fieldTypeMix, dimensions, seed) so
     *    the generator knows the universe of rows/fields it is mutating.
     *
     * @return Map with keys:
     *  - 'op'        : 'update' | 'replace' - 'replace' signals the client to reload a full snapshot
     *                  (drives Cube.loadDataAsync), 'update' drives Cube.updateDataAsync.
     *  - 'iteration' : echoed cursor.
     *  - 'rows'      : List<Map> of changed rows (each {id, ...changedFields}); empty for 'replace'.
     */
    Map generateBatch(Map updateParams) {
        def spec = resolveSpec(updateParams)
        String cadence = (updateParams.cadence ?: 'steady') as String
        String updateMode = (updateParams.updateMode ?: 'incremental') as String
        int breadth = asInt(updateParams.breadth, 1)
        int baseBatch = asInt(updateParams.batchSize, 10)
        int iteration = asInt(updateParams.iteration, 0)

        // fullReplace: emit a re-snapshot signal rather than a diff. The client reloads the full
        // snapshot (Cube.loadDataAsync) on this op; no per-row diff is carried. Batch size, breadth,
        // and cadence do not apply - every tick is the whole dataset.
        if (updateMode == 'fullReplace') {
            return [op: 'replace', iteration: iteration, rows: []]
        }

        // Cadence shapes the effective per-tick batch size, orthogonal to breadth:
        //  - steady: constant baseBatch every tick.
        //  - burst : every 5th tick spikes to 10x baseBatch; the ticks between run a light trough.
        int effectiveBatch
        switch (cadence) {
            case 'burst':
                effectiveBatch = (iteration % 5 == 0) ? baseBatch * 10 : Math.max(1, (int) (baseBatch / 5))
                break
            case 'steady':
            default:
                effectiveBatch = baseBatch
                break
        }
        int effectiveBreadth = breadth

        // Per-batch RNG seeded from (seed, iteration) so each successive poll/push is deterministic
        // yet distinct - reproducible across HTTP and WS paths for the same (seed, iteration).
        Random rng = new Random(spec.seed * 1000003L + iteration)

        // Identify which value fields exist and are mutable (number/date are perturbed; string/object
        // are regenerated). Build once from the resolved spec field plan.
        List<Map> valueFields = spec.valueFields

        List<Map> rows = new ArrayList<>(effectiveBatch)
        Set<Integer> touched = new HashSet<>()
        int universe = spec.leafRowCount
        while (rows.size() < effectiveBatch && touched.size() < universe) {
            int rowIdx = rng.nextInt(universe)
            if (!touched.add(rowIdx)) continue

            Map changed = [id: rowId(rowIdx)]
            // Choose `effectiveBreadth` distinct value fields to mutate for this row.
            List<Map> fieldsToChange = pickFields(valueFields, effectiveBreadth, rng)
            fieldsToChange.each { Map f ->
                changed[f.name] = generateValue(f, rowIdx, rng)
            }
            rows << changed
        }

        return [op: 'update', iteration: iteration, rows: rows]
    }

    //------------------------
    // Implementation
    //------------------------

    /**
     * Resolve raw request params into a normalized, fully-defaulted spec, including a deterministic
     * field plan. Both snapshot and batch generation share this so the field universe is identical
     * across the two paths for a given set of params.
     */
    private Map resolveSpec(Map params) {
        params = params ?: [:]
        long seed = asLong(params.seed, 0L)
        int leafRowCount = asInt(params.leafRowCount, 1000)
        int fieldCount = asInt(params.fieldCount, 10)
        int dimCardinality = asInt(params.dimCardinality, 8)

        // Dimensions: either an explicit count or a list of [name, cardinality].
        List<Map> dimFields = resolveDimensions(params.dimensions, dimCardinality)

        // Field-type mix -> a concrete, ordered field plan of `fieldCount` value fields.
        Map mix = resolveFieldTypeMix(params.fieldTypeMix)
        List<Map> valueFields = planValueFields(fieldCount, mix)

        return [
            seed         : seed,
            leafRowCount : leafRowCount,
            fieldCount   : fieldCount,
            dimFields    : dimFields,
            valueFields  : valueFields
        ]
    }

    private List<Map> resolveDimensions(Object dimensionsParam, int defaultCardinality) {
        if (dimensionsParam instanceof List) {
            return (dimensionsParam as List).withIndex().collect { entry, idx ->
                if (entry instanceof List) {
                    [name: (entry[0] as String), cardinality: asInt(entry[1], defaultCardinality)]
                } else {
                    [name: "dim${idx}".toString(), cardinality: asInt(entry, defaultCardinality)]
                }
            }
        }
        int count = asInt(dimensionsParam, 3)
        return (0..<count).collect { idx -> [name: "dim${idx}".toString(), cardinality: defaultCardinality] }
    }

    private Map resolveFieldTypeMix(Object mixParam) {
        if (mixParam instanceof Map && mixParam) {
            return [
                number: asInt(mixParam.number, 0),
                string: asInt(mixParam.string, 0),
                date  : asInt(mixParam.date, 0),
                object: asInt(mixParam.object, 0)
            ]
        }
        // Default mix - number-heavy with at least one of each other type, incl. object-valued.
        return [number: 5, string: 3, date: 1, object: 1]
    }

    /**
     * Expand the type-mix weights into a concrete, stable, ordered list of `fieldCount` value-field
     * descriptors. Deterministic: the same (fieldCount, mix) always yields the same plan.
     */
    private List<Map> planValueFields(int fieldCount, Map mix) {
        // Allocate field slots proportionally to weights, guaranteeing at least one field of any
        // type with a positive weight (so a requested object-valued field is never dropped to 0).
        def types = ['number', 'string', 'date', 'object']
        int totalWeight = types.sum { asInt(mix[it], 0) } as int
        if (totalWeight <= 0) {
            // Degenerate request - fall back to all-number so we still emit `fieldCount` fields.
            return (0..<fieldCount).collect { idx -> [name: "field${idx}".toString(), type: 'number'] }
        }

        Map<String, Integer> counts = [:]
        types.each { t ->
            int w = asInt(mix[t], 0)
            counts[t] = w > 0 ? Math.max(1, (int) Math.floor(fieldCount * w / (double) totalWeight)) : 0
        }
        // Adjust to hit exactly `fieldCount` (trim or pad against the highest-weight type).
        int assigned = counts.values().sum() as int
        String dominant = types.max { asInt(mix[it], 0) }
        if (assigned > fieldCount) {
            // Trim from non-positive-floor overflow, preferring the dominant type but never below 1
            // for a positive-weight type.
            int over = assigned - fieldCount
            for (String t : types.reverse()) {
                if (over <= 0) break
                int reducible = counts[t] - (asInt(mix[t], 0) > 0 ? 1 : 0)
                int take = Math.min(reducible, over)
                if (take > 0) { counts[t] -= take; over -= take }
            }
        } else if (assigned < fieldCount) {
            counts[dominant] += (fieldCount - assigned)
        }

        // Build an interleaved, stable field plan.
        List<Map> plan = []
        int idx = 0
        types.each { t ->
            int n = counts[t] ?: 0
            for (int k = 0; k < n; k++) {
                plan << [name: "field${idx}".toString(), type: t]
                idx++
            }
        }
        return plan
    }

    private Map generateRow(int rowIdx, Map spec, Random rng) {
        Map row = [id: rowId(rowIdx)]

        // Dimension fields: bounded-cardinality categorical tokens.
        spec.dimFields.each { Map dim ->
            int card = dim.cardinality as int
            int bucket = rng.nextInt(Math.max(1, card))
            row[dim.name] = dimToken(dim.name as String, bucket)
        }

        // Value fields per the planned type mix.
        spec.valueFields.each { Map f ->
            row[f.name] = generateValue(f, rowIdx, rng)
        }

        return row
    }

    private Object generateValue(Map field, int rowIdx, Random rng) {
        switch (field.type) {
            case 'number':
                // Bounded double with 2 decimals for stable JSON.
                return Math.round(rng.nextDouble() * 1_000_000) / 100.0d
            case 'string':
                int words = 1 + rng.nextInt(3)
                return (0..<words).collect { WORD_POOL[rng.nextInt(WORD_POOL.size())] }.join(' ')
            case 'date':
                // Date within ~10 years of EPOCH_DATE.
                return EPOCH_DATE.plusDays(rng.nextInt(3650)).toString()
            case 'object':
                // Object-valued field (Phase-1 heap question) - a small nested map.
                return [
                    code : dimToken('code', rng.nextInt(16)),
                    score: Math.round(rng.nextDouble() * 10000) / 100.0d,
                    flag : rng.nextBoolean()
                ]
            default:
                return null
        }
    }

    private List<Map> pickFields(List<Map> valueFields, int n, Random rng) {
        if (valueFields.isEmpty()) return []
        int take = Math.min(n, valueFields.size())
        // Deterministic selection of `take` distinct fields by index.
        Set<Integer> picks = new LinkedHashSet<>()
        while (picks.size() < take) {
            picks.add(rng.nextInt(valueFields.size()))
        }
        return picks.collect { valueFields[it] }
    }

    private static String rowId(int idx) {
        "leaf-${idx}".toString()
    }

    private static String dimToken(String dimName, int bucket) {
        // Stable, human-readable categorical value, deterministic in (dimName, bucket).
        "${DIM_TOKENS[bucket % DIM_TOKENS.size()]}-${bucket}".toString()
    }

    private static int asInt(Object v, int dflt) {
        if (v == null || v == '') return dflt
        try { return (v as BigDecimal).intValue() } catch (ignored) { return dflt }
    }

    private static long asLong(Object v, long dflt) {
        if (v == null || v == '') return dflt
        try { return (v as BigDecimal).longValue() } catch (ignored) { return dflt }
    }

    Map getAdminStats() {[
        info: 'Stateless seeded generator for the Data 2.0 measurement harness (datalab namespace).'
    ]}
}
