import type {
    BlueprintDataProvider,
    BlueprintDataRequest,
    BlueprintDataResult,
    BlueprintDataUpdate
} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import type {LoadSpec} from '@xh/hoist/core';
import type {SuppliedAggregate} from '@xh/hoist/data';
import {omit} from 'lodash';

interface Subscription {
    channelKey: string;
    topic: string;
    subscribed: Promise<unknown>;
}

/** Loads blueprint data from Toolbox's `blueprints/*` endpoints, with live updates. */
export class ServerDataProvider implements BlueprintDataProvider {
    /** Live subscriptions, by their request without `groupBy`. */
    private subscriptions = new Map<string, Subscription>();

    async loadAsync(req: BlueprintDataRequest, loadSpec?: LoadSpec): Promise<BlueprintDataResult> {
        return XH.postJson({url: 'blueprints/data', body: req}, {loadSpec});
    }

    subscribe(req: BlueprintDataRequest, onUpdate: (u: BlueprintDataUpdate) => void): () => void {
        const {webSocketService} = XH,
            {channelKey} = webSocketService,
            topic = XH.genId(),
            key = subscriptionKey(req);

        let pending: BlueprintDataUpdate[] = [],
            active = true;
        const subscription = webSocketService.subscribe(topic, ({data}) => {
            if (!active) return;
            if (pending) pending.push(data);
            else onUpdate(data);
        });

        // Pushes can beat the snapshot, so hold them until it lands.
        const subscribed = XH.postJson({
            url: 'blueprints/subscribe',
            body: {...req, channelKey, topic}
        })
            .then(({rows, aggregates}: BlueprintDataResult) => {
                if (!active) return;
                onUpdate(aggregates ? {replace: rows, aggregates} : {replace: rows});
                pending.forEach(onUpdate);
                pending = null;
            })
            .catch(e => XH.handleException(e));
        this.subscriptions.set(key, {channelKey, topic, subscribed});

        return () => {
            active = false;
            if (this.subscriptions.get(key)?.topic === topic) this.subscriptions.delete(key);
            webSocketService.unsubscribe(subscription);
            subscribed.finally(() =>
                XH.postJson({url: 'blueprints/unsubscribe', body: {channelKey, topic}}).catch(e =>
                    XH.handleException(e, {showAlert: false})
                )
            );
        };
    }

    async loadAggregatesAsync(
        req: BlueprintDataRequest,
        loadSpec?: LoadSpec
    ): Promise<{aggregates: SuppliedAggregate[]}> {
        const sub = this.subscriptions.get(subscriptionKey(req));
        // The server adds the sets to a session that exists only once its subscribe settles.
        if (sub) await sub.subscribed;
        const body = sub ? {...req, channelKey: sub.channelKey, topic: sub.topic} : req;
        return XH.postJson({url: 'blueprints/aggregates', body}, {loadSpec});
    }
}

function subscriptionKey(req: BlueprintDataRequest): string {
    return JSON.stringify(omit(req, 'groupBy'));
}
