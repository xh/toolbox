import {HoistService} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {MINUTES} from '@xh/hoist/utils/datetime';
import {sumBy, castArray, forOwn, last, sortBy, groupBy, keys, values, find, filter, random, sample, times, round} from 'lodash';
import moment from 'moment';

@HoistService
export class PortfolioService {

    models = ['Ren', 'Vader', 'Beckett', 'Hutt', 'Maul'];
    sectors = ['Financials', 'Healthcare', 'Real Estate', 'Technology', 'Consumer Products', 'Manufacturing', 'Energy', 'Other', 'Utilities'];
    funds = ['Oak Mount', 'Black Crescent', 'Winter Star', 'Red River', 'Hudson Bay'];
    regions = ['US', 'BRIC', 'Emerging Markets', 'EU', 'Asia/Pac'];
    traders = ['Freda Klecko', 'London Rohan', 'Kennedy Hills', 'Linnea Trolley', 'Pearl Hellens', 'Jimmy Falcon', 'Fred Corn', 'Robert Greer', 'HedgeSys', 'Susan Major'];

    tradingDays = [];
    symbols = [];
    instData = new Map();
    orders = [];
    rawPositions = [];

    INITIAL_ORDERS = 20000;
    INITIAL_SYMBOLS = 500;

    /**
     * Return a portfolio of hierarchically grouped positions for the selected dimension(s).
     * @param dims
     * @param {number} [delay] - optional delay in ms - allows masks and page transitions to fully
     *      render before kicking off a locally compute-intensive process that could stall them.
     * @return {Promise<Array>}
     */
    async getPortfolioAsync(dims, delay = 300) {
        await wait(delay);
        this.ensureLoaded();
        return this.getPositions(castArray(dims));
    }

    /**
     * Return a list of flat position data.
     * @param delay - optional delay in ms, as above.
     * @returns {Promise<Array>}
     */
    async getPositionsAsync(delay = 300) {
        await wait(delay);
        this.ensureLoaded();
        return this.rawPositions;
    }

    /**
     * Return a single grouped position, uniquely identified by drilldown ID.
     * @param positionId - as generated/installed on each position returned by `getPorfolioAsync()`.
     * @param delay - optional delay in ms, as above.
     * @return {Promise<*>}
     */
    async getPositionAsync(positionId, delay = 100) {
        await wait(delay);
        this.ensureLoaded();

        const parsedId = this.parsePositionId(positionId),
            dims = keys(parsedId),
            dimVals = values(parsedId);

        let positions = this.getPositions(dims),
            ret = null;

        dimVals.forEach(dimVal => {
            ret = find(positions, {name: dimVal});
            if (ret.children) positions = ret.children;
        });

        return ret;
    }

    async getOrdersAsync(positionId) {
        if (!positionId) return [];
        return filter(this.orders, this.parsePositionId(positionId));
    }

    async getLineChartSeries(symbol) {
        const mktData = this.getMktData(symbol);
        return ([{
            name: symbol,
            type: 'line',
            animation: false,
            data: mktData.map(it => [it.day.valueOf(), it.volume])
        }]);
    }

    async getOLHCChartSeries(symbol) {
        const mktData = this.getMktData(symbol);

        return ([{
            name: symbol,
            type: 'ohlc',
            color: 'rgba(219, 0, 1, 0.55)',
            upColor: 'rgba(23, 183, 0, 0.85)',
            animation: false,
            dataGrouping: {enabled: false},
            data: mktData.map(it => [it.day.valueOf(), it.open, it.high, it.low, it.close])
        }]);
    }

    // Available as a general function to generate a collection of mock orders of any given size.
    // Called internally (lazily) to generate a reference set of orders from which positions are
    // built to populate the demo portfolio viewer app.
    generateOrders(count = this.INITIAL_ORDERS) {
        const orders = [];

        times(count, (idx) => {
            const tradingDay = sample(this.tradingDays),
                time = tradingDay + (random(540, 960) * MINUTES), // random time during market hours
                pos = this.getRandomPositionForPortfolio(),
                symbol = pos.symbol,
                dir = sample(['Sell', 'Buy']),
                qty = random(300, 10000) * (dir == 'Sell' ? -1 : 1),
                mktData = find(this.getMktData(symbol), {day: tradingDay}),
                px = round(random(mktData.low, mktData.high, true), 2);

            orders.push({
                ...pos,
                id: `order-${idx}`,
                dir: dir,
                quantity: qty,
                price: px,
                mktVal: qty * px,
                time
            });
        });

        return sortBy(orders, [it => it.time]);
    }


    //------------------------
    // Implementation
    //------------------------
    ensureLoaded() {
        if (!this.tradingDays.length) {
            this.populateRefData();
            this.orders = this.generateOrders();
            this.rawPositions = this.calculateRawPositions();
        }
    }

    populateRefData() {
        const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            days = this.tradingDays = [],
            symbols = this.symbols = [],
            instData = this.instData = new Map();

        // Generate trading days.
        let tradingDay = moment('2017-01-02', 'YYYY-MM-DD'),
            today = moment();

        while (tradingDay < today) {
            const dayOfWeek = tradingDay.day();
            if (dayOfWeek != 0 && dayOfWeek != 6) days.push(tradingDay.valueOf());
            tradingDay.add(1, 'day');
        }

        // Generate symbols + market data map.
        while (symbols.length < this.INITIAL_SYMBOLS) {
            let symbol = '';
            times(random(1, 5), () => symbol += sample(alpha));
            if (!instData.has(symbol)) {
                symbols.push(symbol);
                instData.set(symbol, {
                    sector: sample(this.sectors),
                    mktData: this.generateMarketData()
                });
            }
        }
    }

    generateMarketData() {
        const tradingDays = this.tradingDays,
            spikeDayIdxs = [],
            ret = [];

        // Give some random number of days a spike in trading volume to make that chart interesting.
        times(random(0, 30), () => spikeDayIdxs.push(random(0, tradingDays.length)));

        // Set a seed price and generate a series from there.
        let startPx = random(10, 100, true);
        tradingDays.forEach((tradingDay, idx) => {
            const bigDown = Math.random() > 0.95,  // Allow for a few bigger swings.
                bigUp = Math.random() > 0.95,
                pctDown = random(0, bigDown ? 0.1 : 0.02, true),
                pctUp = random(0, bigUp ? 0.1 : 0.025, true),  // We can rig the game here...
                open = startPx,
                high = startPx + (pctUp * startPx),
                low = startPx - (pctDown * startPx),
                close = (Math.random() * (high - low)) + low;

            let maxVol;
            if (spikeDayIdxs.includes(idx)) {
                maxVol = 200;
            } else if (spikeDayIdxs.includes(idx - 1) || spikeDayIdxs.includes(idx + 1)) {
                maxVol = 150;
            } else {
                maxVol = 100;
            }

            ret.push({
                day: tradingDay,
                high: round(high, 2),
                low: round(low, 2),
                open: round(open, 2),
                close: round(close, 2),
                volume: random(80, maxVol) * 1000
            });
            startPx = close;
        });

        return ret;
    }

    getRandomPositionForPortfolio() {
        const symbol = sample(this.symbols);
        const ret = {
            symbol,
            sector: this.getSector(symbol),
            model: sample(this.models),
            fund: sample(this.funds),
            region: sample(this.regions),
            trader: sample(this.traders)
        };

        // Generate unique key for leaf-level grouping within calculateRawPositions.
        ret.id = values(ret).join('||');
        return ret;
    }

    // Calculate lowest-level leaf positions with P&L.
    calculateRawPositions() {
        const byPosId = groupBy(this.orders, 'id'),
            positions = [];

        forOwn(byPosId, (orders) => {
            const first = orders[0],
                symbol = first.symbol,
                endPx = last(this.getMktData(symbol)).close;

            let endQty = 0, netCashflow = 0;

            orders = sortBy(orders, [it => it.time]);  // Do we need this again?
            orders.forEach(it => {
                endQty += it.quantity;
                netCashflow -= it.mktVal;
            });

            // Crude P&L calc.
            const endMktVal = endQty * endPx,
                pnl = netCashflow + endMktVal;

            positions.push({
                symbol: symbol,
                sector: first.sector,
                model: first.model,
                fund: first.fund,
                region: first.region,
                trader: first.trader,
                mktVal: endMktVal,
                pnl: pnl
            });
        });

        return positions;
    }

    // Generate grouped, hierarchical position rollups for a list of one or more dimensions.
    getPositions(dims, positions = this.rawPositions, id = 'root') {
        dims = [...dims];  // Avoid mutating our input array.

        const dim = dims.shift(),
            byDimVal = groupBy(positions, it => it[dim]),
            ret = [];

        forOwn(byDimVal, (members, dimVal) => {
            const groupPos = {
                // Generate a drilldown ID that encodes the path to this row.
                id: id + `>>${dim}:${dimVal}`,
                name: dimVal,
                pnl: round(sumBy(members, 'pnl')),
                mktVal: round(sumBy(members, 'mktVal'))
            };

            // Recurse to create children for this node if additional dimensions remain.
            if (dims.length) {
                groupPos.children = this.getPositions(dims, members, groupPos.id);
            }

            ret.push(groupPos);
        });

        return ret;
    }

    // Parse a drilldown ID from a rolled-up position into a map of all
    // dimensions -> dim values contained within the rollup.
    parsePositionId(id) {
        const dims = id.split('>>').slice(1),
            ret = {};

        dims.forEach(dimStr => {
            const dimParts = dimStr.split(':');
            ret[dimParts[0]] = dimParts[1];
        });

        return ret;
    }

    getMktData(symbol) {
        return this.instData.get(symbol).mktData;
    }

    getSector(symbol) {
        return this.instData.get(symbol).sector;
    }

}
