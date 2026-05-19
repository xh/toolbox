import {HoistService, InitContext, LoadSpec, PlainObject, XH} from '@xh/hoist/core';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {PositionSession} from '../positions/PositionSession';
import {mapValues} from 'lodash';

export class PortfolioService extends HoistService {
    static instance: PortfolioService;

    MAX_POSITIONS = 950;
    lookups: PlainObject;

    override async initAsync(ctx: InitContext) {
        this.lookups = await this.runner(ctx.span).fetchJson({url: 'portfolio/lookups'});
    }

    async getSymbolsAsync({loadSpec}: {loadSpec?: LoadSpec} = {}) {
        return this.runner(loadSpec)
            .newSpan('toolbox.client.portfolio.getSymbols')
            .fetchJson({url: 'portfolio/symbols'});
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
        const positions = await this.newSpan('toolbox.client.portfolio.getPositions')
            .track('Loaded positions')
            .fetchJson({
                url: 'portfolio/positions',
                params: {
                    dims: dims.join(','),
                    maxPositions
                }
            });

        return includeSummary ? [positions.root] : positions.root.children;
    }

    /**
     * Return a single grouped position, uniquely identified by drilldown ID.
     * @param positionId - ID installed on each position returned by `getPositionsAsync()`.
     */
    async getPositionAsync(positionId: string): Promise<Position> {
        return this.newSpan('toolbox.client.portfolio.getPosition').fetchJson({
            url: 'portfolio/position',
            params: {positionId}
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
        const session = await this.newSpan('toolbox.client.portfolio.getLivePositions').fetchJson({
            url: 'portfolio/livePositions',
            params: {
                dims: dims.join(','),
                maxPositions,
                channelKey: XH.webSocketService.channelKey,
                topic
            }
        });

        return new PositionSession(session);
    }

    /**
     * Return a list of flat position data.
     */
    async getPricedRawPositionsAsync({loadSpec}: {loadSpec?: LoadSpec} = {}): Promise<
        PricedRawPosition[]
    > {
        return this.runner(loadSpec)
            .newSpan('toolbox.client.portfolio.getPricedRawPositions')
            .fetchJson({url: 'portfolio/pricedRawPositions'});
    }

    async getAllOrdersAsync({loadSpec}: {loadSpec?: LoadSpec} = {}): Promise<PlainObject[]> {
        return this.runner(loadSpec)
            .newSpan('toolbox.client.portfolio.getAllOrders')
            .fetchJson({url: 'portfolio/orders'});
    }

    async getOrdersAsync({
        positionId,
        loadSpec
    }: {
        positionId: string;
        loadSpec?: LoadSpec;
    }): Promise<PlainObject[]> {
        const ret: PlainObject[] = await this.runner(loadSpec)
            .newSpan('toolbox.client.portfolio.getOrdersForPosition')
            .fetchJson({
                url: 'portfolio/ordersForPosition',
                params: {positionId}
            });

        ret.forEach(it => {
            it.day = LocalDate.from(it.time);
        });

        return ret;
    }

    async getLineChartSeriesAsync({
        symbol,
        dimension = 'volume',
        loadSpec
    }: {
        symbol: string;
        dimension?: string;
        loadSpec?: LoadSpec;
    }) {
        const mktData = await this.runner(loadSpec)
            .newSpan('toolbox.client.portfolio.getLineChartSeriesAsync')
            .fetchJson({url: `portfolio/prices/${symbol}`});
        return {
            name: symbol,
            type: 'line',
            animation: false,
            data: mktData.map(it => [LocalDate.get(it.day).timestamp, it[dimension]])
        };
    }

    async getSparklineSeriesAsync({symbols, loadSpec}: {symbols: string[]; loadSpec?: LoadSpec}) {
        const data = await this.runner(loadSpec)
            .newSpan('toolbox.client.portfolio.getSparkline')
            .fetchJson({
                url: `portfolio/closingPriceHistory`,
                params: {symbols}
            });
        return mapValues(data, series => series.map(([date, price]) => [new Date(date), price]));
    }

    async getOHLCChartSeriesAsync({symbol, loadSpec}: {symbol: string; loadSpec?: LoadSpec}) {
        const mktData = await this.runner(loadSpec)
            .newSpan('toolbox.client.portfolio.getOHLCChart')
            .fetchJson({url: `portfolio/prices/${symbol}`});
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
