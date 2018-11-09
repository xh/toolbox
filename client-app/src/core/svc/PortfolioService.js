import {HoistService} from '@xh/hoist/core';
import {wait} from '@xh/hoist/promise';
import {MINUTES} from '@xh/hoist/utils/datetime';
import {sumBy, castArray, forOwn, last, sortBy, groupBy, values, find, filter, random, sample, times, round, isEmpty} from 'lodash';
import moment from 'moment';

@HoistService
export class PortfolioService {

    models = ['Ren', 'Vader', 'Beckett', 'Hutt', 'Maul', 'Ren II', 'Vader II', 'Beckett II', 'Hutt II', 'Maul II', 'Ren III', 'Vader III', 'Beckett III', 'Hutt III', 'Maul III'];
    sectors = ['Financials', 'Healthcare', 'Real Estate', 'Technology', 'Consumer Products', 'Manufacturing', 'Energy', 'Other', 'Utilities'];
    funds = ['Oak Mount', 'Black Crescent', 'Winter Star', 'Red River', 'Hudson Bay'];
    regions = ['US', 'BRIC', 'Emerging Markets', 'EU', 'Asia/Pac'];
    traders = ['Freda Klecko', 'London Rohan', 'Kennedy Hills', 'Linnea Trolley', 'Pearl Hellens', 'Jimmy Falcon', 'Fred Corn', 'Robert Greer', 'HedgeSys', 'Susan Major'];

    tradingDays = [];
    instData = [];
    orders = [];
    rawPositions = [];

    INITIAL_ORDERS = 15000;
    INITIAL_SYMBOLS = 300;

    // Public API around getPositions.
    async getPortfolioAsync(dims, initialSymbols = this.INITIAL_SYMBOLS, initialOrders = this.INITIAL_ORDERS) {
        this.INITIAL_SYMBOLS = initialSymbols;
        this.INITIAL_ORDERS = initialOrders;

        await wait(300);
        this.ensureLoaded();
        const getPositions = this.getPositions(castArray(dims));
        return getPositions;
    }

    async getOrdersAsync(positionId) {
        if (!positionId) return [];
        return filter(this.orders, this.parsePositionId(positionId));
    }

    async getLineChartSeries(symbol) {
        const mktData = this.findInstrument(symbol).mktData;
        return ([{
            name: symbol,
            type: 'line',
            animation: false,
            data: mktData.map(it => [it.day.valueOf(), it.volume])
        }]);
    }

    async getOLHCChartSeries(symbol) {
        const mktData = this.findInstrument(symbol).mktData;

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
                pos = this.getRandomPositionForPortfolio();
            // console.log('pos', pos);
            const
                dir = sample(['Sell', 'Buy']),
                qty = random(300, 10000) * (dir == 'Sell' ? -1 : 1),
                mktData = find(pos.instrument.mktData, {day: tradingDay}),
                px = isEmpty(mktData) ? 0.00 : random(mktData.low, mktData.high, true).toFixed(2);

            orders.push({
                symbol: pos.instrument.symbol,
                sector: pos.instrument.sector,
                model: pos.model,
                fund: pos.fund,
                region: pos.region,
                trader: pos.trader,
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
            instData = this.instData = [];

        // Generate trading days.
        let tradingDay = moment('2017-01-01', 'YYYY-MM-DD'),
            today = moment();

        while (tradingDay < today) {
            const dayOfWeek = tradingDay.day();
            if (dayOfWeek != 0 && dayOfWeek != 6) days.push(tradingDay.valueOf());
            tradingDay.add(1, 'day');
        }

        // Generate symbols + market data map.
        while (instData.length < this.INITIAL_SYMBOLS) {
            let symbol = '';
            times(random(1, 5), () => symbol += sample(alpha));
            if (!this.findInstrument(symbol)) {
                instData.push({
                    symbol: symbol,
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
                high: high.toFixed(2),
                low: low.toFixed(2),
                open: open.toFixed(2),
                close: close.toFixed(2),
                volume: random(80, maxVol) * 1000
            });
            startPx = close;
        });

        return ret;
    }

    getRandomPositionForPortfolio() {
        const instrument = sample(this.instData);
        const ret = {
            instrument: instrument,
            model: sample(this.models),
            fund: sample(this.funds),
            region: sample(this.regions),
            trader: sample(this.traders)
        };

        // Generate unique key for leaf-level grouping within calculateRawPositions.
        ret.id = values(ret).join('||');

        // console.log('getRandomPositionForPortfolio', ret);
        return ret;
    }

    // Calculate lowest-level leaf positions with P&L.
    calculateRawPositions() {
        const byPosId = groupBy(this.orders, 'id'),
            positions = [];

        forOwn(byPosId, (orders) => {
            const first = orders[0],
                instrument = this.findInstrument(first.symbol);
            const
                endPx = isEmpty(instrument.mktData) ? 0 : last(instrument.mktData).close;

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
                symbol: first.symbol,
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


    findInstrument(symbol) {
        return this.instData.find(instDatum => instDatum.symbol === symbol);
    }

}
