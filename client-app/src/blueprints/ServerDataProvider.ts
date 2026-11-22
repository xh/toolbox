import type {
    BlueprintDataProvider,
    BlueprintDataRequest,
    BlueprintDataResult,
    BlueprintDataUpdate
} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import type {LoadSpec} from '@xh/hoist/core';
import type {SuppliedAggregate} from '@xh/hoist/data';
import {when} from '@xh/hoist/mobx';
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
        const {webSocketService} = XH;
        if (!webSocketService.enabled) return this.loadOnce(req, onUpdate);

        const topic = XH.genId(),
            key = subscriptionKey(req),
            sub: Subscription = {channelKey: null, topic, subscribed: null};

        let pending: BlueprintDataUpdate[] = [],
            active = true;
        const subscription = webSocketService.subscribe(topic, ({data}) => {
            if (!active) return;
            if (pending) pending.push(data);
            else onUpdate(data);
        });

        // The server pushes to the socket's channel, which it has only once connected.
        const connected = webSocketService.connected
            ? null
            : when(() => webSocketService.connected);

        // Pushes can beat the snapshot, so hold them until it lands.
        sub.subscribed = Promise.resolve(connected)
            .then(() => {
                if (!active) return null;
                sub.channelKey = webSocketService.channelKey;
                return XH.postJson({
                    url: 'blueprints/subscribe',
                    body: {...req, channelKey: sub.channelKey, topic}
                });
            })
            .then((result: BlueprintDataResult) => {
                if (!active || !result) return;
                const {rows, aggregates} = result;
                onUpdate(aggregates ? {replace: rows, aggregates} : {replace: rows});
                pending.forEach(onUpdate);
                pending = null;
            })
            .catch(e => {
                if (active) XH.handleException(e);
            });
        this.subscriptions.set(key, sub);

        return () => {
            active = false;
            connected?.cancel();
            if (this.subscriptions.get(key)?.topic === topic) this.subscriptions.delete(key);
            webSocketService.unsubscribe(subscription);
            sub.subscribed.finally(() => {
                if (!sub.channelKey) return;
                XH.postJson({
                    url: 'blueprints/unsubscribe',
                    body: {channelKey: sub.channelKey, topic}
                }).catch(e => XH.handleException(e, {showAlert: false}));
            });
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

    // Without a socket nothing pushes, so take the rows once, as a replace.
    private loadOnce(req: BlueprintDataRequest, onUpdate: (u: BlueprintDataUpdate) => void) {
        let active = true;
        this.loadAsync(req)
            .then(({rows, aggregates}) => {
                if (active) onUpdate(aggregates ? {replace: rows, aggregates} : {replace: rows});
            })
            .catch(e => {
                if (active) XH.handleException(e);
            });
        return () => {
            active = false;
        };
    }
}

function subscriptionKey(req: BlueprintDataRequest): string {
    return JSON.stringify(omit(req, 'groupBy'));
}
