import {action, observable} from '@xh/hoist/mobx';
import {HoistModel} from '@xh/hoist/core';
import faker from 'faker';
import moment from 'moment';

@HoistModel
export class PortfolioDataGenerator {

    models = ['Ren', 'Vader', 'Beckett', 'Hutt', 'Maul'];
    strategies = ['US Tech Long/Short', 'US Healthcare Long/Short', 'EU Long/Short', 'BRIC', 'Africa'];
    numOrders = 50;

    @observable.ref portfolio = [];
    @observable.ref selectedOrders = [];
    @observable.ref selectedLineData = [];

    orders = [];
    marketData = [];

    constructor() {
        this.generatePortfolio();
        for (let x = 0; x < this.numOrders; x++) {
            const order = this.generateOrder();
            this.updatePortfolioWithOrder(order);
        }

        this.loadAsync();
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
        console.log('marketData', this.marketData);
    }

    generateMarketData() {
        const startDate = moment('2018-10-01', 'YYYY-MM-DD');
        const todayDate = moment();
        const numDays = todayDate.diff(startDate, 'days');
        const ret = [];
        for (let x = 0; x < numDays; x++) {
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
        }
        return ret;
    }

    generateOrder() {
        const randomModel = this.getRandomModelFromPortfolio(this.portfolio);
        const randomStrategy = this.getRandomStrategyFromModel(randomModel);
        const randomSymbol = this.getRandomSymbolFromStrategy(randomStrategy);
        const orderId = this.orders.length;

        const order = {
            'id': randomSymbol.id + '-' + orderId,
            'model': randomModel.name,
            'strategy': randomStrategy.name,
            'symbol': randomSymbol.name,
            'time': '10:19:12',
            'trader': faker.name.findName(),
            'dir': this.generateRandomDirection(),
            'volume': this.generateRandomQuantity(),
            'pnl': this.generateRandomPnl()
        };

        return order;
    }

    selectOrders(id) {
        console.log('orders', this.orders);

        const ret = this.orders.filter(order => order.id.startsWith(id));
        console.log('selectOrders', ret);
        this.updateSelectedOrders(ret);
    }

    updatePortfolioWithOrder(order) {
        this.orders.push(order);

        // console.log('updatePortfolioWithOrder', order);

        const model = this.portfolio.find(model => model.name === order.model);
        // console.log('found model', model);

        const strategy = model.children.find(strategy => strategy.name === order.strategy);
        // console.log('found strategy', strategy);

        const position = strategy.children.find(position => position.name === order.symbol);
        // console.log('found positions', position);

        position.pnl += order.pnl;
        position.volume += order.volume;

        this.updatePortfolio(this.portfolio);
        // console.log('updated position', position);
    }

    getRandomModelFromPortfolio(portfolio) {
        const modelIndex = Math.floor(Math.random() * portfolio.length);
        return portfolio[modelIndex];
    }

    getRandomStrategyFromModel(model) {
        const strategyIndex = Math.floor(Math.random() * model.children.length);
        return model.children[strategyIndex];
    }

    getRandomSymbolFromStrategy(strategy) {
        const symbolIndex = Math.floor(Math.random() * strategy.children.length);
        return strategy.children[symbolIndex];
    }

    generateSymbol() {
        const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const length = Math.floor(Math.random() * 2) + 3;
        let symbol = '';
        for (let x = 0; x < length; x++) {
            symbol += alpha.charAt(Math.floor(Math.random() * 27));
        }
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

    loadAsync() {
        // setInterval(() => {
        //     console.log('new order received');
        //     const order = this.generateOrder();
        //     this.updatePortfolioWithOrder(order);
        // }, 1000);
    }

    @action
    updateSelectedOrders(orders) {
        this.selectedOrders = [...orders];
    }

    @action
    updateSelectedLineData(data) {
        this.selectedLineData = [...data];
    }

    @action
    updatePortfolio(portfolio) {
        this.portfolio = [...portfolio];
    }

}