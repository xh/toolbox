import {XH} from '@xh/hoist/core';


export class PositionSession {

    id;
    channelKey;
    topic;
    positions;

    _subscription;

    constructor(config) {
        this.id = config.id;
        this.channelKey = config.channelKey;
        this.topic = config.topic;
        this.positions = config.positions;

        this._subscription = XH.webSocketService.subscribe(
            this.topic,
            (update) => this.handleUpdate(update)
        );
    }

    handleUpdate(update) {
        console.log(update);
    }

    destroy() {
        XH.webSocketService.unsubscribe(this._subscription);
    }
}