import {HoistModel, managed, XH} from '@xh/hoist/core';
import {bindable, makeObservable, runInAction} from '@xh/hoist/mobx';
import {MultiZoneGridModel} from '@xh/hoist/mobile/cmp/multiZoneGrid';
import {wait} from '@xh/hoist/promise';
import {
    activeCol,
    cityCol,
    companyCol,
    profitLossCol,
    tradeDateCol,
    tradeVolumeCol,
    winLoseCol
} from '../../core/columns';

export class MultiZoneGridPageModel extends HoistModel {
    @bindable.ref
    dateLoaded: Date = null;

    @managed
    multiZoneGridModel: MultiZoneGridModel = new MultiZoneGridModel({
        persistWith: {localStorageKey: 'toolboxSampleMultiZoneGrid'},
        sortBy: ['profit_loss|desc|abs'],
        multiZoneMapperModel: true,
        onRowClicked: ({data: record}) => {
            const {id} = record;
            XH.appendRoute('gridDetail', {id});
        },
        store: {
            processRawData: r => {
                const pnl = r.profit_loss;
                return {
                    winLose: pnl > 0 ? 'Winner' : pnl < 0 ? 'Loser' : 'Flat',
                    ...r
                };
            }
        },
        columns: [
            companyCol,
            winLoseCol,
            cityCol,
            profitLossCol,
            {...tradeVolumeCol, headerName: 'Vol'},
            tradeDateCol,
            activeCol
        ],
        mappings: {
            tl: 'company',
            tr: 'profit_loss',
            bl: ['city', 'trade_date'],
            br: {field: 'trade_volume', showLabel: true}
        },
        limits: {
            tl: {min: 1, max: 1, only: ['company', 'city']},
            tr: {max: 1},
            bl: {max: 4},
            br: {max: 1}
        }
    });

    constructor() {
        super();
        makeObservable(this);
    }

    override async doLoadAsync() {
        await wait(500);
        const {trades} = await XH.fetchJson({url: 'trade'});
        this.multiZoneGridModel.loadData(trades);
        runInAction(() => (this.dateLoaded = new Date()));
    }
}
