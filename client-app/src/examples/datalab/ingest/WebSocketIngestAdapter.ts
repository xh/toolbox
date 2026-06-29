import {PlainObject, XH} from '@xh/hoist/core';
import {ScenarioConfig} from '@xh/hoist/data';
import {WebSocketSubscription} from '@xh/hoist/svc';

/** WebSocket topic the server (02-02 `DataLabPushService.TOPIC`) pushes update batches on. */
const TOPIC = 'xhDataLab/updates';

/**
 * Client-side WebSocket-push delivery adapter for the Data Lab measurement harness.
 *
 * This is the WS-push twin of {@link HttpIngestAdapter}: it carries the SAME batch shape into the
 * SAME two-op ingest contract - only the delivery differs (the clean `transport` knob). The harness
 * core fetches nothing; this adapter owns the WebSocket transport. The server pushes batches on the
 * dedicated `xhDataLab/updates` topic; this adapter subscribes, buffers them, and exposes a
 * pull-style `nextBatchAsync()` so the harness's injected per-iteration callback works identically
 * for HTTP and WS. The snapshot itself is still pulled over HTTP (the snapshot is a one-shot full
 * load, not a push); only the streamed diffs arrive over the socket.
 *
 * The adapter does not measure and does not touch the Cube directly.
 */
export class WebSocketIngestAdapter {
    private subscription: WebSocketSubscription = null;

    /** Buffer of batches received from the socket but not yet consumed by the harness. */
    private buffer: PlainObject[][] = [];

    /** Pending resolver when the harness has asked for a batch before one has arrived. */
    private waiter: (rows: PlainObject[]) => void = null;

    /**
     * Fetch the initial full snapshot over HTTP (the snapshot is a one-shot full load, not pushed),
     * then begin the server-side push stream so diff batches start arriving on the topic. Returns
     * the snapshot rows for the caller to pre-load into the baseline adapter.
     */
    async loadSnapshotAsync(scenario: ScenarioConfig): Promise<PlainObject[]> {
        const rows = await XH.fetchJson({
            url: 'dataLab/snapshot',
            params: this.shapeParams(scenario)
        });

        this.subscribe();
        await this.startStreamAsync(scenario);
        return rows as PlainObject[];
    }

    /**
     * Resolve with the next pushed batch's rows. If a batch is already buffered it returns
     * immediately; otherwise it waits for the next push. Mirrors {@link HttpIngestAdapter.nextDiffAsync}
     * so the harness's injected `nextBatchAsync` callback is transport-agnostic.
     */
    nextBatchAsync(): Promise<PlainObject[]> {
        if (this.buffer.length) {
            return Promise.resolve(this.buffer.shift());
        }
        return new Promise<PlainObject[]>(resolve => {
            this.waiter = resolve;
        });
    }

    /** Stop the server stream and tear down the subscription/buffers. */
    async stopAsync(): Promise<void> {
        if (this.subscription) {
            XH.webSocketService.unsubscribe(this.subscription);
            this.subscription = null;
        }
        await XH.fetchJson({
            url: 'dataLab/streamStop',
            params: {channelKey: XH.webSocketService.channelKey}
        }).catchDefault();
        this.buffer = [];
        this.waiter = null;
    }

    //------------------------------------------------------------------------------------------------
    // Implementation
    //------------------------------------------------------------------------------------------------

    private subscribe() {
        if (this.subscription) return;
        this.subscription = XH.webSocketService.subscribe(TOPIC, msg => this.onBatch(msg));
    }

    private async startStreamAsync(scenario: ScenarioConfig) {
        const {update} = scenario;
        await XH.fetchJson({
            url: 'dataLab/streamStart',
            params: {
                channelKey: XH.webSocketService.channelKey,
                ...this.shapeParams(scenario),
                pattern: update.pattern,
                breadth: update.breadth,
                batchSize: update.batchSize,
                ratePerSec: update.ratePerSec,
                durationSec: update.durationSec
            }
        });
    }

    /** Handle one pushed batch - hand it straight to a waiting consumer, else buffer it. */
    private onBatch(msg: PlainObject) {
        const rows = (msg?.data?.rows ?? []) as PlainObject[];
        if (this.waiter) {
            const resolve = this.waiter;
            this.waiter = null;
            resolve(rows);
        } else {
            this.buffer.push(rows);
        }
    }

    private shapeParams(scenario: ScenarioConfig): PlainObject {
        const {dataset} = scenario;
        return {
            leafRowCount: dataset.leafRowCount,
            fieldCount: dataset.fieldCount,
            dimensions: dataset.dimensions.length,
            seed: dataset.seed
        };
    }
}
