import {HoistService, XH} from '@xh/hoist/core';
import {LocalDate} from '@xh/hoist/utils/datetime';
import {PositionSession} from '../positions/PositionSession';
import {mapValues} from 'lodash';

export class PortfolioService extends HoistService {

    MAX_POSITIONS = 950;

    async initAsync() {
        this.lookups = await XH.fetchJson({url: 'portfolio/lookups'});
    }

    async getSymbolsAsync({loadSpec} = {}) {
        return XH.fetchJson({url: 'portfolio/symbols', loadSpec});
    }

    /**
     * Return a portfolio of hierarchically grouped positions for the selected dimension(s).
     * @param {string[]} dims - field names for dimensions on which to group.
     * @param {boolean} [includeSummary] - true to include a root summary node
     * @param {int} maxPositions - truncate position tree, by smallest pnl, until this number of
     *     positions is reached.
     * @return {Promise<Array>}
     */
    async getPositionsAsync(dims, includeSummary = false, maxPositions = this.MAX_POSITIONS) {
        const positions = await XH.fetchJson({
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
     * @return {Promise<*>}
     */
    async getPositionAsync(positionId) {
        return XH.fetchJson({
            url: 'portfolio/position',
            params: {
                positionId
            }
        });
    }

    /**
     *  Return a PositionSession that will receive live updates.
     *  See getPositionsAsync(), the static form of this method, for more details.
     *
     * @returns {Promise<PositionSession>}
     */
    async getLivePositionsAsync(dims, topic, maxPositions = this.MAX_POSITIONS) {
        const session = await XH.fetchJson({
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
     * @returns {Promise<Array>}
     */
    async getRawPositionsAsync({loadSpec} = {}) {
        return XH.fetchJson({url: 'portfolio/rawPositions', loadSpec});
    }

    async getAllOrdersAsync({loadSpec} = {}) {
        return XH.fetchJson({url: 'portfolio/orders', loadSpec});
    }

    async getOrdersAsync({positionId, loadSpec}) {
        return XH.fetchJson({
            url: 'portfolio/ordersForPosition',
            params: {positionId},
            loadSpec
        });
    }

    async getLineChartSeriesAsync({symbol, dimension = 'volume', loadSpec}) {
        const mktData = await XH.fetchJson({url: `portfolio/prices/${symbol}`, loadSpec});
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
            loadSpec,
            params: {symbols}
        });
        return mapValues(data, series => series.map(([date, price]) => [new Date(date), price]));
    }

    async getOHLCChartSeriesAsync({symbol, loadSpec}) {
        const mktData = await XH.fetchJson({url: `portfolio/prices/${symbol}`, loadSpec});
        return {
            name: symbol,
            type: 'ohlc',
            color: 'rgba(219, 0, 1, 0.55)',
            upColor: 'rgba(23, 183, 0, 0.85)',
            animation: false,
            dataGrouping: {enabled: false},
            data: mktData.map(it => [LocalDate.get(it.day).timestamp, it.open, it.high, it.low, it.close])
        };
    }
}
