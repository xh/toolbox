import {CallContextLike, HoistService, InitContext, PlainObject, XH} from '@xh/hoist/core';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {PositionSession} from '../positions/PositionSession';
import {mapValues} from 'lodash';

/** A node in a hierarchically-grouped portfolio position tree. */
export interface Position {
    id: string;
    name: string;
    pnl: number;
    mktVal: number;
    children: Position[];
}

/** A single flat, priced position - a leaf in the portfolio. */
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

export class PortfolioService extends HoistService {
    override telemetryPrefix = 'toolbox.client.portfolio';

    static instance: PortfolioService;

    MAX_POSITIONS = 950;
    lookups: PlainObject;

    override async initAsync(ctx: InitContext) {
        this.lookups = await this.runner({span: ctx.span}).fetchJson({url: 'portfolio/lookups'});
    }

    async getSymbolsAsync(ctx: CallContextLike) {
        return this.runner(ctx).span('getSymbols').fetchJson({url: 'portfolio/symbols'});
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
        return this.runner()
            .span('getPositions')
            .track('Loaded positions')
            .run(async ctx => {
                const positions = await XH.fetchJson(
                    {
                        url: 'portfolio/positions',
                        params: {
                            dims: dims.join(','),
                            maxPositions
                        }
                    },
                    ctx
                );
                return includeSummary ? [positions.root] : positions.root.children;
            });
    }

    /**
     * Return a single grouped position, uniquely identified by drilldown ID.
     * @param positionId - ID installed on each position returned by `getPositionsAsync()`.
     */
    async getPositionAsync(positionId: string): Promise<Position> {
        return this.runner().span('getPosition').fetchJson({
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
        return this.runner()
            .span('getLivePositions')
            .run(async ctx => {
                const session = await XH.fetchJson(
                    {
                        url: 'portfolio/livePositions',
                        params: {
                            dims: dims.join(','),
                            maxPositions,
                            channelKey: XH.webSocketService.channelKey,
                            topic
                        }
                    },
                    ctx
                );
                return new PositionSession(session);
            });
    }

    /**
     * Return a list of flat position data.
     */
    async getPricedRawPositionsAsync(ctx: CallContextLike): Promise<PricedRawPosition[]> {
        return this.runner(ctx)
            .span('getPricedRawPositions')
            .fetchJson({url: 'portfolio/pricedRawPositions'});
    }

    async getAllOrdersAsync(ctx: CallContextLike): Promise<PlainObject[]> {
        return this.runner(ctx).span('getAllOrders').fetchJson({url: 'portfolio/orders'});
    }

    async getOrdersAsync(positionId: string, ctx: CallContextLike): Promise<PlainObject[]> {
        return this.runner(ctx)
            .span('getOrdersForPosition')
            .run(async ctx => {
                const ret: PlainObject[] = await XH.fetchJson(
                    {
                        url: 'portfolio/ordersForPosition',
                        params: {positionId}
                    },
                    ctx
                );
                ret.forEach(it => {
                    it.day = LocalDate.from(it.time);
                });
                return ret;
            });
    }

    async getLineChartSeriesAsync(
        {symbol, dimension = 'volume'}: {symbol: string; dimension?: string},
        ctx: CallContextLike
    ) {
        return this.runner(ctx)
            .span('getLineChartSeriesAsync')
            .run(async ctx => {
                const mktData = await XH.fetchJson({url: `portfolio/prices/${symbol}`}, ctx);
                return {
                    name: symbol,
                    type: 'line',
                    animation: false,
                    data: mktData.map(it => [LocalDate.get(it.day).timestamp, it[dimension]])
                };
            });
    }

    async getSparklineSeriesAsync(symbols: string[], ctx: CallContextLike) {
        return this.runner(ctx)
            .span('getSparkline')
            .run(async ctx => {
                const data = await XH.fetchJson(
                    {
                        url: `portfolio/closingPriceHistory`,
                        params: {symbols}
                    },
                    ctx
                );
                return mapValues(data, series =>
                    series.map(([date, price]) => [new Date(date), price])
                );
            });
    }

    async getOHLCChartSeriesAsync(symbol: string, ctx: CallContextLike) {
        return this.runner(ctx)
            .span('getOHLCChart')
            .run(async ctx => {
                const mktData = await XH.fetchJson({url: `portfolio/prices/${symbol}`}, ctx);
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
            });
    }
}
