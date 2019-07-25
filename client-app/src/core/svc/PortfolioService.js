import {HoistService, XH} from '@xh/hoist/core';
import moment from 'moment';

@HoistService
export class PortfolioService {

    async initAsync() {
        this.lookups = await this.getLookupsAsync();
    }

    async getLookupsAsync() {
        return await XH.fetchJson({
            url: 'portfolio/lookups'
        });
    }

    async getSymbolsAsync() {
        return await XH.fetchJson({
            url: 'portfolio/symbols'
        });
    }

    async getInstrumentAsync(symbol) {
        return await XH.fetchJson({
            url: `portfolio/instrument/${symbol}`
        });
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
        return await XH.fetchJson({
            url: 'portfolio/rawPositions'
        });
    }

    /**
     * Return a single grouped position, uniquely identified by drilldown ID.
     * @param positionId - ID installed on each position returned by `getPortfolioAsync()`.
     * @return {Promise<*>}
     */
    async getPositionAsync(positionId) {
        return await XH.fetchJson({
            url: 'portfolio/position',
            params: {
                positionId
            }
        });
    }

    async getOrdersAsync(positionId) {
        return await XH.fetchJson({
            url: 'portfolio/ordersForPosition',
            params: {
                positionId
            }
        });
    }

    async getLineChartSeries(symbol, dimension = 'volume') {
        const mktData = await XH.fetchJson({
            url: `portfolio/prices/${symbol}`
        });
        return ([{
            name: symbol,
            type: 'line',
            animation: false,
            data: mktData.map(it => [moment(it.day).valueOf(), it[dimension]])
        }]);
    }

    async getOLHCChartSeries(symbol) {
        const mktData = await XH.fetchJson({
            url: `portfolio/prices/${symbol}`
        });
        return ([{
            name: symbol,
            type: 'ohlc',
            color: 'rgba(219, 0, 1, 0.55)',
            upColor: 'rgba(23, 183, 0, 0.85)',
            animation: false,
            dataGrouping: {enabled: false},
            data: mktData.map(it => [moment(it.day).valueOf(), it.open, it.high, it.low, it.close])
        }]);
    }

    /**
     * Available as a general function to generate a collection of mock orders of any given size.
     * Called internally (lazily) to generate a reference set of orders from which positions are
     * built to populate the demo portfolio viewer app.
     *
     * @returns {Promise<Object[]>}
     */
    async getAllOrders() {
        return await XH.fetchJson({
            url: 'portfolio/orders'
        });
    }
}