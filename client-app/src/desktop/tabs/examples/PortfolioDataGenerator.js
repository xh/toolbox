import {action, observable} from '@xh/hoist/mobx';
import {HoistModel} from '@xh/hoist/core';
import faker from 'faker';

@HoistModel
export class PortfolioDataGenerator {

    models = ['Ren', 'Vader', 'Beckett', 'Hutt', 'Maul'];
    strategies = ['US Tech Long/Short', 'US Healthcare Long/Short', 'EU Long/Short', 'BRIC', 'Africa'];
    numOrders = 50;

    @observable.ref
    portfolio = [];

    orders = [];

    @observable.ref
    selectedOrders = [
    ];

    constructor() {
        this.generateEmptyPortfolio();
        for (let x = 0; x < this.numOrders; x++) {
            const order = this.generateOrder();
            this.updatePortfolioWithOrder(order);
        }

        this.loadAsync();
    }

    generateEmptyPortfolio() {
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
                    strategyLevel.children.push({
                        id: a + '-' + b + '-' + x,
                        name: this.generateSymbol(),
                        volume: 0,
                        pnl:  0
                    });
                }
                modelLevel.children.push(strategyLevel);
            });
            this.portfolio.push(modelLevel);
        });
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
        setInterval(() => {
            console.log('new order received');
            const order = this.generateOrder();
            this.updatePortfolioWithOrder(order);
        }, 1000);
    }

    @action
    updateSelectedOrders(orders) {
        this.selectedOrders = [...orders];
    }

    @action
    updatePortfolio(portfolio) {
        this.portfolio = [...portfolio];
    }

}