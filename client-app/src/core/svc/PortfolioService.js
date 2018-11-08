import {HoistService} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {MINUTES} from '@xh/hoist/utils/datetime';
import {sumBy, castArray, forOwn, last, sortBy, groupBy, keys, values, find, filter, random, sample, times} from 'lodash';
import moment from 'moment';

@HoistService
export class PortfolioService {

    models = ['Ren', 'Vader', 'Beckett', 'Hutt', 'Maul'];
    sectors = ['Financials', 'Healthcare', 'Real Estate', 'Technology', 'Consumer Products', 'Manufacturing', 'Energy', 'Other', 'Utilities'];
    funds = ['Oak Mount', 'Black Crescent', 'Winter Star', 'Red River', 'Hudson Bay'];
    regions = ['US', 'BRIC', 'Emerging Markets', 'EU', 'Asia/Pac'];
    traders = ['Freda Klecko', 'London Rohan', 'Kennedy Hills', 'Linnea Trolley', 'Pearl Hellens', 'Jimmy Falcon', 'Fred Corn', 'Robert Greer', 'HedgeSys', 'Susan Major'];

    tradingDays = [];
    instData = {};
    orders = [];
    rawPositions = [];

    INITIAL_ORDERS = 15000;
    INITIAL_SYMBOLS = 300;

    // Public API around getPositions.
    async getPortfolioAsync(dims) {
        await wait(300);
        this.ensureLoaded();
        return this.getPositions(castArray(dims));
    }

    async getOrdersAsync(positionId) {
        if (!positionId) return [];
        return filter(this.orders, this.parsePositionId(positionId));
    }

    async getLineChartSeries(symbol) {
        const mktData = this.instData[symbol].mktData;
        return ([{
            name: symbol,
            type: 'line',
            animation: false,
            data: mktData.map(it => [it.day.valueOf(), it.volume])
        }]);
    }

    async getOLHCChartSeries(symbol) {
        const mktData = this.instData[symbol].mktData;

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
                mktData = find(this.instData[symbol].mktData, {day: tradingDay}),
                px = random(mktData.low, mktData.high, true);

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
            instData = this.instData = {};

        // Generate trading days.
        let tradingDay = moment('2017-01-02', 'YYYY-MM-DD'),
            today = moment();

        while (tradingDay < today) {
            const dayOfWeek = tradingDay.day();
            if (dayOfWeek != 0 && dayOfWeek != 6) days.push(tradingDay.valueOf());
            tradingDay.add(1, 'day');
        }

        // Generate symbols + market data map.
        while (keys(instData).length < this.INITIAL_SYMBOLS) {
            let symbol = '';
            times(random(1, 5), () => symbol += sample(alpha));
            if (!instData[symbol]) {
                instData[symbol] = {
                    sector: sample(this.sectors),
                    mktData: this.generateMarketData()
                };
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
                high: high,
                low: low,
                open: open,
                close: close,
                volume: random(80, maxVol) * 1000
            });
            startPx = close;
        });

        return ret;
    }

    getRandomPositionForPortfolio() {
        const symbol = sample(keys(this.instData));
        const ret = {
            symbol,
            sector: this.instData[symbol].sector,
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
                endPx = last(this.instData[symbol].mktData).close;

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
                pnl: sumBy(members, 'pnl'),
                mktVal: sumBy(members, 'mktVal')
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

}
