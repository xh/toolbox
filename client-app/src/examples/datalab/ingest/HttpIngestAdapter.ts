import {PlainObject, XH} from '@xh/hoist/core';
import {ScenarioConfig} from '@xh/hoist/data';

/**
 * Client-side HTTP delivery adapter for the Data Lab measurement harness.
 *
 * This adapter owns ALL transport/endpoint knowledge for the HTTP path - the framework
 * measurement harness (hoist-react) fetches nothing itself. It pulls the seeded, out-of-process
 * test data served by the Toolbox Grails `dataLab` API (snapshot + diff endpoints) and hands back
 * plain row arrays. The caller (DataLabModel) then feeds those rows to the framework
 * `CandidateAdapter` at the two invariant ingest ops - `loadSnapshotAsync` and `applyDiffAsync` -
 * so only the delivery mechanism differs from the WebSocket adapter; the ingest contract is shared.
 *
 * The adapter does not measure and does not touch the Cube directly - it only translates HTTP
 * responses into row batches.
 */
export class HttpIngestAdapter {
    /** Monotonic cursor handed to the server so successive polls return successive batches. */
    private iteration = 0;

    /**
     * Fetch the initial full snapshot for the given scenario shape. Returns the leaf rows; the
     * caller pre-loads them into the baseline adapter via `baselineAdapter.loadSnapshotAsync(rows)`.
     */
    async loadSnapshotAsync(scenario: ScenarioConfig): Promise<PlainObject[]> {
        this.iteration = 0;
        const rows = await XH.fetchJson({
            url: 'dataLab/snapshot',
            params: this.shapeParams(scenario)
        });
        return rows as PlainObject[];
    }

    /**
     * Fetch the next deterministic update batch (an HTTP poll). Returns the batch's `rows` array -
     * each successive call advances the iteration cursor, so the server returns the next batch.
     * A `broadReplace` batch arrives with `op: 'replace'`; the caller decides whether to re-snapshot.
     */
    async nextDiffAsync(scenario: ScenarioConfig): Promise<PlainObject[]> {
        const batch = await XH.fetchJson({
            url: 'dataLab/diff',
            params: {
                ...this.shapeParams(scenario),
                ...this.updateParams(scenario),
                iteration: this.iteration++
            }
        });
        return (batch?.rows ?? []) as PlainObject[];
    }

    //------------------------------------------------------------------------------------------------
    // Implementation
    //------------------------------------------------------------------------------------------------

    /** Shape params common to snapshot + diff (mirrors the 02-02 server contract). */
    private shapeParams(scenario: ScenarioConfig): PlainObject {
        const {dataset} = scenario;
        return {
            leafRowCount: dataset.leafRowCount,
            fieldCount: dataset.fieldCount,
            dimensions: dataset.dimensions.length,
            seed: dataset.seed
        };
    }

    /** Update params specific to the diff endpoint. */
    private updateParams(scenario: ScenarioConfig): PlainObject {
        const {update} = scenario;
        return {
            pattern: update.pattern,
            breadth: update.breadth,
            batchSize: update.batchSize
        };
    }
}
