import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {dateRenderer} from '@xh/hoist/format';
import {makeObservable, bindable} from '@xh/hoist/mobx';
import {WebSocketSubscription} from '@xh/hoist/svc';

export class WebSocketTestModel extends HoistModel {
    @managed gridModel: GridModel;
    @managed updateSub: WebSocketSubscription;
    @bindable subscribedLocal = false;
    @bindable subscribedCluster = false;

    constructor() {
        super();
        makeObservable(this);
        this.gridModel = new GridModel({
            sortBy: [{colId: 'timestamp', sort: 'desc'}],
            emptyText: 'No updates received',
            columns: [
                {field: 'id', headerName: 'ID', width: 120},
                {field: 'timestamp', width: 200, renderer: dateRenderer({fmt: 'h:mm:ssa'})}
            ]
        });

        this.updateSub = XH.webSocketService.subscribe('mockUpdate', msg =>
            this.onUpdateMessage(msg)
        );
    }

    private onUpdateMessage(msg) {
        this.gridModel.updateData({add: [msg.data]});
    }

    async subscribeLocalAsync() {
        await XH.fetchJson({
            url: 'mockUpdates/subscribeLocal',
            params: {channelKey: XH.webSocketService.channelKey}
        });

        XH.toast({message: 'Subscribed to updates from local server instance.'});
        this.subscribedLocal = true;
    }

    async unsubscribeLocalAsync() {
        await XH.fetchJson({
            url: 'mockUpdates/unsubscribeLocal',
            params: {channelKey: XH.webSocketService.channelKey}
        });

        XH.toast({
            message: 'Unsubscribed from updates from local server instance.',
            intent: 'danger'
        });
        this.subscribedLocal = false;
    }

    async subscribeClusterAsync() {
        await XH.fetchJson({
            url: 'mockUpdates/subscribeCluster',
            params: {channelKey: XH.webSocketService.channelKey}
        });

        XH.toast({message: 'Subscribed to updates from all servers in cluster.'});
        this.subscribedCluster = true;
    }

    async unsubscribeClusterAsync() {
        await XH.fetchJson({
            url: 'mockUpdates/unsubscribeCluster',
            params: {channelKey: XH.webSocketService.channelKey}
        });

        XH.toast({
            message: 'Unsubscribed from updates from all servers in cluster.',
            intent: 'danger'
        });
        this.subscribedCluster = false;
    }
}
