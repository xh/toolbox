import {HoistService, XH} from '@xh/hoist/core';
import {LocalDate} from '@xh/hoist/utils/datetime';

@HoistService
export class PortfolioService {

    async initAsync() {
        this.lookups = await XH.fetchJson({url: 'portfolio/lookups'});
    }

    async getSymbolsAsync() {
        return XH.fetchJson({url: 'portfolio/symbols'});
    }

    /**
     * Return a portfolio of hierarchically grouped positions for the selected dimension(s).
     * @param {string[]} dims - field names for dimensions on which to group.
     * @param {boolean} [includeSummary] - true to include a root summary node
     * @return {Promise<Array>}
     */
    async getPortfolioAsync(dims, includeSummary = false) {
        const portfolio = await XH.fetchJson({
            url: 'portfolio/positions',
            params: {
                dims: dims.join(',')
            }
        });

        return includeSummary ? portfolio : portfolio[0].children;
    }

    /**
     * Return a list of flat position data.
     * @returns {Promise<Array>}
     */
    async getPositionsAsync() {
        return XH.fetchJson({url: 'portfolio/rawPositions'});
    }

    /**
     * Return a single grouped position, uniquely identified by drilldown ID.
     * @param positionId - ID installed on each position returned by `getPortfolioAsync()`.
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
            data: mktData.map(it => [LocalDate.from(it.day).timestamp, it[dimension]])
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
            data: mktData.map(it => [LocalDate.from(it.day).timestamp, it.open, it.high, it.low, it.close])
        };
    }
}