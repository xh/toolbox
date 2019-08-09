package io.xh.toolbox.portfolio

import io.xh.hoist.json.JSONFormat
import io.xh.hoist.util.Utils


class PositionSession implements JSONFormat {

    final String id
    final String channelKey
    final String topic

    private PositionResultSet positions


    PositionSession(PositionQuery query, String channelKey, String topic) {
        this.id = [channelKey, topic].join('||')
        this.channelKey = channelKey
        this.topic = topic
        this.positions = positionService.getPositions(query)
    }

    void pushUpdate() {
        Utils.webSocketService.pushToChannel(channelKey, topic, 'hola')
    }


    //--------------------
    // Implementation
    //--------------------

    private PositionService getPositionService() {
        Utils.appContext.positionService
    }

    void destroy() {

    }

    Object formatForJSON() {
        return [
                id: id,
                channelKey: channelKey,
                positions: positions
        ]
    }
}
