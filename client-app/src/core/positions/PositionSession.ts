import {PlainObject, XH} from '@xh/hoist/core';
import {WebSocketSubscription, WebSocketMessage} from '@xh/hoist/svc';

export class PositionSession {
    id: string;
    channelKey: string;
    topic: string;
    initialPositions: PlainObject;
    onUpdate: (msg: WebSocketMessage) => any;

    private subscription: WebSocketSubscription;

    constructor(config) {
        this.id = config.id;
        this.channelKey = config.channelKey;
        this.topic = config.topic;
        this.initialPositions = config.positions;

        this.subscription = XH.webSocketService.subscribe(this.topic, update =>
            this.handleUpdate(update)
        );
    }

    private handleUpdate(update) {
        this.onUpdate?.(update);
    }

    destroy() {
        XH.webSocketService.unsubscribe(this.subscription);
    }
}
