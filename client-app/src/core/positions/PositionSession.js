import {XH} from '@xh/hoist/core';


export class PositionSession {

    id;
    channelKey;
    topic;
    initialPositions;
    onUpdate;


    _subscription;

    constructor(config) {
        this.id = config.id;
        this.channelKey = config.channelKey;
        this.topic = config.topic;
        this.initialPositions = config.positions;

        this._subscription = XH.webSocketService.subscribe(
            this.topic,
            (update) => this.handleUpdate(update)
        );
    }

    handleUpdate(update) {
        if (this.onUpdate) this.onUpdate(update);
    }

    destroy() {
        XH.webSocketService.unsubscribe(this._subscription);
    }
}