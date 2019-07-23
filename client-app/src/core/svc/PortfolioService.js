import {HoistService, XH} from '@xh/hoist/core';
import {round, sumBy} from 'lodash';
import moment from 'moment';

@HoistService
export class PortfolioService {

    /**
     * Return a portfolio of hierarchically grouped positions for the selected dimension(s).
     * @param {string[]} dims - field names for dimensions on which to group.
     * @param {boolean} [includeSummary] - true to include a root summary node
     * @return {Promise<Array>}
     */
    async getPortfolioAsync(dims, includeSummary = false) {
        const positions = await XH.fetchJson({
            url: 'portfolio',
            params: {
                dims: dims.join(',')
            }
        });

        return !includeSummary ? positions : [
            {
                id: 'summary',
                name: 'Total',
                pnl: round(sumBy(positions, 'pnl')),
                mktVal: round(sumBy(positions, 'mktVal')),
                children: positions
            }
        ];
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
                positionId: positionId
            }
        });
    }

    async getOrdersAsync(positionId) {
        return await XH.fetchJson({
            url: 'portfolio/filteredOrders',
            params: {
                positionId: positionId
            }
        });
    }

    async getLineChartSeries(symbol) {
        const mktData = await XH.fetchJson({
            url: 'market',
            params: {
                symbol: symbol
            }
        });
        return ([{
            name: symbol,
            type: 'line',
            animation: false,
            data: mktData.map(it => [moment(it.day).valueOf(), it.volume])
        }]);
    }

    async getOLHCChartSeries(symbol) {
        const mktData = await XH.fetchJson({
            url: 'market',
            params: {
                symbol: symbol
            }
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
     * @param count - desired number of synthetic orders to generate.
     * @returns {Promise<Object[]>}
     */
    async getAllOrders() {
        return await XH.fetchJson({
            url: 'portfolio/orders'
        });
    }
}