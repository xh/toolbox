import type {
    BlueprintDataProvider,
    BlueprintDataRequest,
    BlueprintDataUpdate
} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import type {LoadSpec, PlainObject} from '@xh/hoist/core';

/** Loads blueprint data from Toolbox's `blueprints/*` endpoints, with live updates. */
export class ServerDataProvider implements BlueprintDataProvider {
    async loadAsync(
        req: BlueprintDataRequest,
        loadSpec?: LoadSpec
    ): Promise<{rows: PlainObject[]}> {
        return XH.postJson({url: 'blueprints/data', body: req}, {loadSpec});
    }

    subscribe(req: BlueprintDataRequest, onUpdate: (u: BlueprintDataUpdate) => void): () => void {
        const {webSocketService} = XH,
            {channelKey} = webSocketService,
            topic = XH.genId();

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
            .then(({rows}) => {
                if (!active) return;
                onUpdate({replace: rows});
                pending.forEach(onUpdate);
                pending = null;
            })
            .catch(e => XH.handleException(e));

        return () => {
            active = false;
            webSocketService.unsubscribe(subscription);
            subscribed.finally(() =>
                XH.postJson({url: 'blueprints/unsubscribe', body: {channelKey, topic}}).catch(e =>
                    XH.handleException(e, {showAlert: false})
                )
            );
        };
    }
}
