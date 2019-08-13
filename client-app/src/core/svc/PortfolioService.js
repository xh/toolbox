import {HoistService, XH} from '@xh/hoist/core';
import moment from 'moment';

import {PositionSession} from '../positions/PositionSession';

@HoistService
export class PortfolioService {

    MAX_POSITIONS = 950;

    async initAsync() {
        this.lookups = await XH.fetchJson({url: 'portfolio/lookups'});
    }

    async getSymbolsAsync() {
        return XH.fetchJson({url: 'portfolio/symbols'});
    }

    /**
     * Return a portfolio of hierarchically grouped positions for the selected dimension(s).
     * @param {string[]} dims - field names for dimensions on which to group.
     * @param {int} maxPositions - truncate position tree, by smallest pnl, until this number positions is reached
     * @param {boolean} [includeSummary] - true to include a root summary node
     * @return {Promise<Array>}
     */
    async getPositionsAsync(dims, maxPositions = this.MAX_POSITIONS, includeSummary = false) {
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
    async getRawPositionsAsync() {
        return XH.fetchJson({url: 'portfolio/rawPositions'});
    }

    async getAllOrdersAsync() {
        return XH.fetchJson({url: 'portfolio/orders'});
    }

    async getOrdersAsync(positionId) {
        return XH.fetchJson({
            url: 'portfolio/ordersForPosition',
            params: {
                positionId
            }
        });
    }

    async getLineChartSeriesAsync(symbol, dimension = 'volume') {
        const mktData = await XH.fetchJson({url: `portfolio/prices/${symbol}`});
        return {
            name: symbol,
            type: 'line',
            animation: false,
            data: mktData.map(it => [moment(it.day).valueOf(), it[dimension]])
        };
    }

    async getOLHCChartSeriesAsync(symbol) {
        const mktData = await XH.fetchJson({url: `portfolio/prices/${symbol}`});
        return {
            name: symbol,
            type: 'ohlc',
            color: 'rgba(219, 0, 1, 0.55)',
            upColor: 'rgba(23, 183, 0, 0.85)',
            animation: false,
            dataGrouping: {enabled: false},
            data: mktData.map(it => [moment(it.day).valueOf(), it.open, it.high, it.low, it.close])
        };
    }
}