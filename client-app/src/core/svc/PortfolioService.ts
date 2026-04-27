import {HoistService, InitContext, PlainObject, XH} from '@xh/hoist/core';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {PositionSession} from '../positions/PositionSession';
import {mapValues} from 'lodash';

export class PortfolioService extends HoistService {
    static instance: PortfolioService;

    MAX_POSITIONS = 950;
    lookups: PlainObject;

    override async initAsync(ctx: InitContext) {
        this.lookups = await XH.fetchJson({url: 'portfolio/lookups', span: ctx.span});
    }

    async getSymbolsAsync({loadSpec}: any = {}) {
        return XH.fetchJson({
            url: 'portfolio/symbols',
            span: 'toolbox.client.portfolio.getSymbols',
            loadSpec
        });
    }

    /**
     * Return a portfolio of hierarchically grouped positions for the selected dimension(s).
     * @param dims - field names for dimensions on which to group.
     * @param includeSummary - true to include a root summary node
     * @param maxPositions - truncate position tree, by smallest pnl, until this number of
     *     positions is reached.
     */
    async getPositionsAsync(
        dims: string[],
        includeSummary = false,
        maxPositions = this.MAX_POSITIONS
    ): Promise<Position[]> {
        const positions = await XH.fetchJson({
            url: 'portfolio/positions',
            params: {
                dims: dims.join(','),
                maxPositions
            },
            span: 'toolbox.client.portfolio.getPositions',
            track: 'Loaded positions'
        });

        return includeSummary ? [positions.root] : positions.root.children;
    }

    /**
     * Return a single grouped position, uniquely identified by drilldown ID.
     * @param positionId - ID installed on each position returned by `getPositionsAsync()`.
     */
    async getPositionAsync(positionId: string): Promise<Position> {
        return XH.fetchJson({
            url: 'portfolio/position',
            params: {
                positionId
            },
            span: 'toolbox.client.portfolio.getPosition'
        });
    }

    /**
     *  Return a PositionSession that will receive live updates.
     *  See getPositionsAsync(), the static form of this method, for more details.
     */
    async getLivePositionsAsync(
        dims: string[],
        topic: string,
        maxPositions: number = this.MAX_POSITIONS
    ) {
        const session = await XH.fetchJson({
            url: 'portfolio/livePositions',
            params: {
                dims: dims.join(','),
                maxPositions,
                channelKey: XH.webSocketService.channelKey,
                topic
            },
            span: 'toolbox.client.portfolio.getLivePositions'
        });

        return new PositionSession(session);
    }

    /**
     * Return a list of flat position data.
     */
    async getPricedRawPositionsAsync({loadSpec}: any = {}): Promise<PricedRawPosition[]> {
        return XH.fetchJson({
            url: 'portfolio/pricedRawPositions',
            span: 'toolbox.client.portfolio.getPricedRawPositions',
            loadSpec
        });
    }

    async getAllOrdersAsync({loadSpec}: any = {}): Promise<PlainObject[]> {
        return XH.fetchJson({
            url: 'portfolio/orders',
            span: 'toolbox.client.portfolio.getAllOrders',
            loadSpec
        });
    }

    async getOrdersAsync({positionId, loadSpec}): Promise<PlainObject[]> {
        const ret: PlainObject[] = await XH.fetchJson({
            url: 'portfolio/ordersForPosition',
            params: {positionId},
            span: 'toolbox.client.portfolio.getOrdersForPosition',
            loadSpec
        });

        ret.forEach(it => {
            it.day = LocalDate.from(it.time);
        });

        return ret;
    }

    async getLineChartSeriesAsync({symbol, dimension = 'volume', loadSpec}) {
        const mktData = await XH.fetchJson({
            url: `portfolio/prices/${symbol}`,
            span: 'toolbox.client.portfolio.getLineChartSeriesAsync',
            loadSpec
        });
        return {
            name: symbol,
            type: 'line',
            animation: false,
            data: mktData.map(it => [LocalDate.get(it.day).timestamp, it[dimension]])
        };
    }

    async getSparklineSeriesAsync({symbols, loadSpec}) {
        const data = await XH.fetchJson({
            url: `portfolio/closingPriceHistory`,
            span: 'toolbox.client.portfolio.getSparkline',
            loadSpec,
            params: {symbols}
        });
        return mapValues(data, series => series.map(([date, price]) => [new Date(date), price]));
    }

    async getOHLCChartSeriesAsync({symbol, loadSpec}) {
        const mktData = await XH.fetchJson({
            url: `portfolio/prices/${symbol}`,
            span: 'toolbox.client.portfolio.getOHLCChart',
            loadSpec
        });
        return {
            name: symbol,
            type: 'ohlc',
            color: 'rgba(219, 0, 1, 0.55)',
            upColor: 'rgba(23, 183, 0, 0.85)',
            animation: false,
            dataGrouping: {enabled: false},
            data: mktData.map(it => [
                LocalDate.get(it.day).timestamp,
                it.open,
                it.high,
                it.low,
                it.close
            ])
        };
    }
}

export interface Position {
    id: string;
    name: string;
    pnl: number;
    mktVal: number;
    children: Position[];
}

export interface PricedRawPosition {
    symbol: string;
    model: string;
    fund: string;
    sector: string;
    region: string;
    trader: string;
    mktVal: number;
    pnl: number;
}
