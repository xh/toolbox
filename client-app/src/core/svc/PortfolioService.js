import {HoistService} from '@xh/hoist/core';
import {action, observable} from '@xh/hoist/mobx';
import {wait} from '@xh/hoist/promise';
import {sumBy, isNil, castArray, forOwn, last, sortBy, groupBy, keys, values, find, random, sample, sampleSize, times} from 'lodash';
import moment from 'moment';

@HoistService
export class PortfolioService {

    models = ['Ren', 'Vader', 'Beckett', 'Hutt', 'Maul'];
    strategies = ['Tech Long/Short', 'Healthcare', 'Long/Short', 'Bond', 'Financials Long / Short'];
    sectors = ['Financials', 'Healthcare', 'Real Estate', 'Technology', 'Consumer Products', 'Manufacturing'];
    funds = ['Oak Mount', 'Black Crescent', 'Winter Star', 'Red River', 'Hudson Bay'];
    regions = ['US', 'BRIC', 'Africa', 'EU', 'Japan'];
    traders = ['Freda Klecko', 'London Rohan', 'Kennedy Hills', 'Linnea Trolley', 'Pearl Hellens', 'Jimmy Falcon', 'Fred Corn'];

    tradingDays = [];
    instData = {};
    rawOrders = [];
    rawPositions = [];


    @observable.ref portfolioVersion = 0;
    portfolio = [];
    orders = [];

    dimensions = ['model'];

    INITIAL_ORDERS = 5000;
    INITIAL_SYMBOLS = 40;

    constructor() {
        this.populateRefData();
        this.rawOrders = this.generateRawOrders();
        this.rawPositions = this.calculateRawPositions();
    }

    async getPortfolioAsync(dims) {
        return this.getPositions(castArray(dims));
    }

    getPositions(dims, positions = this.rawPositions, id = 'root') {
        const dim = dims.shift(),
            byDim = groupBy(positions, it => it[dim]),
            ret = [];

        console.log(dim);

        forOwn(byDim, (members, dimVal) => {
            const groupPos = {
                id: id + `>>${dim}:${dimVal}`,
                name: dimVal,
                pnl: sumBy(members, 'pnl'),
                mktVal: sumBy(members, 'mktVal')
            };

            if (dims.length) groupPos.children = this.getPositions([...dims], members, groupPos.id);
            ret.push(groupPos);
        });

        return ret;
    }

    getOrders(positionId) {
        return wait(250).then(() => {
            const orders = this.orders.filter(order => order.id.startsWith(positionId + '-'));
            return orders;
        });
    }

    getLineChartSeries(symbol) {
        return wait(250).then(() => {
            const marketData = this.marketData.find(record => record.symbol === symbol);
            const prices = marketData.data.map(it => {
                const date = moment(it.valueDate).valueOf();
                return [date, it.volume];
            });
            return ([{
                name: symbol,
                type: 'area',
                data: prices
            }]);
        });
    }

    getOLHCChartSeries(symbol) {
        return wait(250).then(() => {
            const marketData = this.marketData.find(record => record.symbol === symbol);
            const prices = marketData.data.map(it => {
                const date = moment(it.valueDate).valueOf();
                return [date, it.open, it.high, it.low, it.close];
            });
            return ([
                {
                    name: symbol,
                    type: 'ohlc',
                    color: 'rgba(219, 0, 1, 0.55)',
                    upColor: 'rgba(23, 183, 0, 0.85)',
                    dataGrouping: {
                        enabled: true,
                        groupPixelWidth: 5
                    },
                    data: prices
                }
            ]);
        });
    }


    //------------------------
    // Implementation
    //------------------------
    populateRefData() {
        const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            days = this.tradingDays = [],
            instData = this.instData = {};

        // Generate trading days.
        let tradingDay = moment('2017-01-02', 'YYYY-MM-DD'),
            today = moment();

        while (tradingDay < today) {
            const dayOfWeek = tradingDay.day();
            if (dayOfWeek != 0 && dayOfWeek != 6) days.push(tradingDay);
            tradingDay = tradingDay.add(1, 'd');
        }

        // Generate symbols + market data map.
        while (keys(instData).length < this.INITIAL_SYMBOLS) {
            let symbol = '';
            times(random(1, 4), () => symbol += sample(alpha));
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

        // Randomly give some days a spike in trading volume.
        times(random(0, 30), () => spikeDayIdxs.push(random(0, tradingDays.length - 1)));

        // Set a seed price and generate a series from there.
        let startPx = random(10, 100, true);
        tradingDays.forEach((tradingDay, idx) => {
            const pctDown = random(0, 0.06, true),
                pctUp = random(0, 0.08, true),
                open = startPx,
                high = startPx + (pctUp * startPx),
                low = startPx - (pctDown * startPx),
                close = (Math.random() * (high - low)) + low;

            let volMultiplier;
            if (spikeDayIdxs.includes(idx)) {
                volMultiplier = 1000000;
            } else if (spikeDayIdxs.includes(idx - 1) || spikeDayIdxs.includes(idx + 1)) {
                volMultiplier = 500000;
            } else {
                volMultiplier = 100000;
            }

            ret.push({
                day: tradingDay,
                high: high,
                low: low,
                open: open,
                close: close,
                volume: Math.round(Math.random() * volMultiplier)
            });
            startPx = close;
        });

        return ret;
    }

    generateRawOrders() {
        const orders = [];

        times(this.INITIAL_ORDERS, () => {
            const tradingDay = sample(this.tradingDays),
                pos = this.getRandomPositionForPortfolio(),
                symbol = pos.symbol,
                dir = sample(['Sell', 'Buy']),
                qty = random(300, 10000) * (dir == 'Sell' ? -1 : 1),
                mktData = find(this.instData[symbol].mktData, {day: tradingDay}),
                px = random(mktData.low, mktData.high, true);

            orders.push({
                ...pos,
                time: tradingDay.add(random(540, 960), 'minutes'), // random trading-hours time on the day
                dir: dir,
                quantity: qty,
                price: px,
                mktVal: qty * px
            });
        });

        return sortBy(orders, [it => it.time.valueOf()]);
    }

    getRandomPositionForPortfolio() {
        const ret = {
            // model: sample(this.models),
            // strategy: sample(this.strategies),
            fund: sample(this.funds),
            region: sample(this.regions),
            trader: sample(this.traders),
            symbol: sample(keys(this.instData))
        };

        ret.id = values(ret).join('||');
        return ret;
    }

    calculateRawPositions() {
        const byPosId = groupBy(this.rawOrders, 'id'),
            positions = [];

        forOwn(byPosId, (orders, id) => {
            const first = orders[0],
                symbol = first.symbol,
                endPx = last(this.instData[symbol].mktData).close;

            let endQty = 0, netCashflow = 0;

            orders = sortBy(orders, [it => it.time.valueOf()]);  // Do we need this again?
            orders.forEach(it => {
                endQty += it.quantity;
                netCashflow -= it.mktVal;
            });

            const endMktVal = endQty * endPx,
                pnl = netCashflow + endMktVal;

            positions.push({
                // model: first.model,
                // strategy: first.strategy,
                fund: first.fund,
                region: first.region,
                trader: first.trader,
                symbol: symbol,
                sector: this.instData[symbol].sector,
                mktVal: endMktVal,
                pnl: pnl
            });
        });

        return positions;
    }

    // portfolio builder
    updatePortfolioWithOrder(keySet, order) {
        let level = this.portfolio;
        let id = (isNil(level) ? '0' : level.length).toString();
        keySet.forEach((key, index) => {
            let entry = level.find(level => level.name === key);
            if (isNil(entry)) {
                if (index === keySet.length - 1) {
                    entry = {
                        id: id,
                        name: key,
                        quantity: 0,
                        pnl: 0
                    };
                } else {
                    entry = {
                        id: id,
                        name: key,
                        children: []
                    };
                }
                level.push(entry);
            }
            level = entry.children;
            id = entry.id + '-' + (isNil(level) ? '0' : level.length).toString();

            if (index === keySet.length - 1) {
                entry.quantity += order.quantity;
                entry.pnl += order.pnl;
                this.orders.push({id: (entry.id + '-' + (isNil(this.orders) ? '0' : this.orders.length).toString()), ...order});
            }
        });
    }

    generatePortfolioFromOrders(orders, dimensions) {
        orders.forEach((order) => {
            const key = [];
            dimensions.forEach((dimension) => {
                key.push(order[dimension]);
            });
            this.updatePortfolioWithOrder(key, order);
        });
    }

}
