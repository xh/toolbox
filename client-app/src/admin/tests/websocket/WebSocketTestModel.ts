import {GridModel} from '@xh/hoist/cmp/grid';
import {HoistModel, managed, XH} from '@xh/hoist/core';
import {dateRenderer} from '@xh/hoist/format';
import {action, observable, makeObservable} from '@xh/hoist/mobx';
import { WebSocketSubscription } from '@xh/hoist/svc';

export class WebSocketTestModel extends HoistModel {

    @managed gridModel: GridModel;
    @managed updateSub: WebSocketSubscription;
    @observable subscribed = false;
    @action setSubscribed(v: boolean) {this.subscribed = v}

    constructor() {
        super();
        makeObservable(this);
        this.gridModel = new GridModel({
            sortBy: [{colId: 'timestamp', sort: 'desc'}],
            emptyText: 'No updates received',
            columns: [
                {field: 'id', headerName: 'ID', width: 80},
                {field: 'timestamp', width: 200, renderer: dateRenderer({fmt: 'h:mm:ssa'})}
            ]
        });

        this.updateSub = XH.webSocketService.subscribe('mockUpdate', (msg) => this.onUpdateMessage(msg));
    }

    private onUpdateMessage(msg) {
        this.gridModel.updateData({add: [msg.data]});
    }

    async subscribeAsync() {
        await XH.fetchJson({
            url: 'mockUpdates/subscribe',
            params: {channelKey: XH.webSocketService.channelKey}
        });

        XH.toast({message: 'Subscribed to updates.'});
        this.setSubscribed(true);
    }

    async unsubscribeAsync() {
        await XH.fetchJson({
            url: 'mockUpdates/unsubscribe',
            params: {channelKey: XH.webSocketService.channelKey}
        });

        XH.toast({message: 'Unsubscribed from updates.', intent: 'danger'});
        this.setSubscribed(false);
    }

}