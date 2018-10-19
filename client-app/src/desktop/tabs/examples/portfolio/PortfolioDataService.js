import {action, observable} from '@xh/hoist/mobx';
import {HoistModel} from '@xh/hoist/core';
import faker from 'faker';
import moment from 'moment';
import {times} from 'lodash';
import {wait} from '@xh/hoist/promise';

@HoistModel
export class PortfolioDataService {

    models = ['Ren', 'Vader', 'Beckett', 'Hutt', 'Maul'];
    strategies = ['US Tech Long/Short', 'US Healthcare Long/Short', 'EU Long/Short', 'BRIC', 'Africa'];
    numOrders = 100;

    @observable.ref portfolioVersion = 0;
    portfolio = [];
    orders = [];
    marketData = [];

    constructor() {
    }

    getPortfolio() {
        return wait(500).then(() => {
            if (this.portfolio.length === 0) {
                this.initializePortfolio();
            }
            return (this.portfolio);
        });
    }

    getOrders(positionId) {
        return wait(250).then(() => {
            const orders = this.orders.filter(order => order.id.startsWith(positionId));
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

    initializePortfolio() {
        let a = 0;
        this.models.forEach(model => {
            a++;
            const modelLevel = {
                id: a,
                name: model,
                children: []
            };
            let b = 0;
            this.strategies.forEach(strategy => {
                b++;
                const strategyLevel = {
                    id: a + '-' + b,
                    name: strategy,
                    children: []
                };
                for (let x = 1; x < Math.floor(Math.random() * 6) + 2; x++) {
                    const symbol = this.generateSymbol();
                    strategyLevel.children.push({
                        id: a + '-' + b + '-' + x,
                        name: symbol,
                        volume: 0,
                        pnl:  0
                    });
                    this.marketData.push({symbol: symbol, data: this.generateMarketData()});
                }
                modelLevel.children.push(strategyLevel);
            });
            this.portfolio.push(modelLevel);
        });

        for (let x = 0; x < this.numOrders; x++) {
            const order = this.generateOrder();
            this.updatePortfolioWithOrder(order);
        }
    }

    generateMarketData() {
        const startDate = moment('2017-01-01', 'YYYY-MM-DD'),
            todayDate = moment(),
            numDays = todayDate.diff(startDate, 'days'),
            ret = [];

        let prevClose = Math.random() * 1000;

        times(numDays, () => {
            const valueDate = startDate.add(1, 'd');

            const low = prevClose - (Math.random() * (prevClose / 100));
            const high = prevClose + (Math.random() * (prevClose / 100));
            const open = prevClose;
            const close = (Math.random() * (high - low)) + low;

            if (valueDate.day() !== 0 && valueDate.day() !== 6) {
                ret.push({
                    valueDate: valueDate.format('YYYYMMDD'),
                    high: Number(high.toFixed(2)),
                    low: Number(low.toFixed(2)),
                    open: Number(open.toFixed(2)),
                    close: Number(close.toFixed(2)),
                    volume: Math.round(Math.random() * 1000000)
                });
                prevClose = close;
            }
        });

        return ret;
    }

    generateOrder() {
        const randomOrder =
            this.getRandomPositionFromPortfolio(this.portfolio),
            orderId = this.orders.length;

        return {
            id: randomOrder.id + '-' + orderId,
            model: randomOrder.model,
            strategy: randomOrder.strategy,
            symbol: randomOrder.symbol,
            time: moment.utc(Math.round(Math.random() * 23400000) + 34200000).format('HH:mm:ss'),
            trader: faker.name.findName(),
            dir: this.generateRandomDirection(),
            volume: this.generateRandomQuantity(),
            pnl: this.generateRandomPnl()
        };
    }

    updatePortfolioWithOrder(order) {
        const {portfolio} = this;
        this.orders.push(order);
        const model = portfolio.find(model => model.name === order.model),
            strategy = model.children.find(strategy => strategy.name === order.strategy),
            position = strategy.children.find(position => position.name === order.symbol);

        position.pnl += order.pnl;
        position.volume += order.volume;
    }

    getRandomPositionFromPortfolio(portfolio) {
        const modelIndex = Math.floor(Math.random() * portfolio.length),
            strategyIndex = Math.floor(Math.random() * portfolio[modelIndex].children.length),
            symbolIndex = Math.floor(Math.random() * portfolio[modelIndex].children[strategyIndex].children.length);

        return {
            model: portfolio[modelIndex].name,
            strategy: portfolio[modelIndex].children[strategyIndex].name,
            symbol: portfolio[modelIndex].children[strategyIndex].children[symbolIndex].name,
            id: portfolio[modelIndex].children[strategyIndex].children[symbolIndex].id
        };
    }

    generateSymbol() {
        const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const length = Math.floor(Math.random() * 2) + 3;
        let symbol = '';

        times(length, () => {
            symbol += alpha.charAt(Math.floor(Math.random() * 27));
        });

        return symbol;
    }

    generateRandomDirection() {
        return Math.floor(Math.random() * 2) === 0 ? 'SELL' : 'BUY';
    }

    generateRandomQuantity() {
        return Math.floor(Math.random() * 1000001);
    }

    generateRandomPnl() {
        return Math.floor(Math.random() * 1000001) * (Math.random() < 0.5 ? -1 : 1);
    }

    async loadOrdersAsync() {
        setInterval(() => {
            console.log('new order received');
            const order = this.generateOrder();
            this.updatePortfolioWithOrder(order);
            this.incrementPortfolioVersion();
        }, 1000);
    }

    @action
    incrementPortfolioVersion() {
        this.portfolioVersion++;
    }
}