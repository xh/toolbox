import {observable} from '@xh/hoist/mobx';
import {HoistModel} from '@xh/hoist/core';
import faker from 'faker';
import moment from 'moment';
import {times} from 'lodash';

@HoistModel
export class PortfolioDataService {

    models = ['Ren', 'Vader', 'Beckett', 'Hutt', 'Maul'];
    strategies = ['US Tech Long/Short', 'US Healthcare Long/Short', 'EU Long/Short', 'BRIC', 'Africa'];
    numOrders = 50;

    @observable.ref portfolio = [];

    orders = [];
    marketData = [];

    constructor() {
        this.generatePortfolio();
        for (let x = 0; x < this.numOrders; x++) {
            const order = this.generateOrder();
            this.updatePortfolioWithOrder(order);
        }

        // this.loadOrdersAsync();
    }

    generatePortfolio() {
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
                    this.marketData.push([symbol, this.generateMarketData()]);
                }
                modelLevel.children.push(strategyLevel);
            });
            this.portfolio.push(modelLevel);
        });
    }

    generateMarketData() {
        const startDate = moment('2018-10-01', 'YYYY-MM-DD'),
            todayDate = moment(),
            numDays = todayDate.diff(startDate, 'days'),
            ret = [];

        times(numDays, () => {
            const valueDate = startDate.add(1, 'd');
            const low = Math.random() * 100;
            const high = (Math.random() * 5) + low;
            if (valueDate.day() !== 0 && valueDate.day() !== 6) {
                ret.push({
                    valueDate: valueDate.format('YYYYMMDD'),
                    high: high.toFixed(2),
                    low: low.toFixed(2),
                    open: ((Math.random() * (high - low)) + low).toFixed(2),
                    close: ((Math.random() * (high - low)) + low).toFixed(2)
                });
            }
        });

        return ret;
    }

    generateOrder() {


        const randomOrder =
            this.getRandomPositionFromPortfolio(this.portfolio),
            orderId = this.orders.length;

        // TODO: fake the execution time or remove from model
        return {
            id: randomOrder.id + '-' + orderId,
            model: randomOrder.model,
            strategy: randomOrder.strategy,
            symbol: randomOrder.symbol,
            time: '10:19:12',
            trader: faker.name.findName(),
            dir: this.generateRandomDirection(),
            volume: this.generateRandomQuantity(),
            pnl: this.generateRandomPnl()
        };
    }

    getOrdersForPosition(positionId) {
        return this.orders.filter(order => order.id.startsWith(positionId));
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
        }, 1000);
    }
}