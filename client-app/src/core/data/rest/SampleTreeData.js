export const sampleTreeData = [
    {
        name: 'Market Hawk',
        id: '1',
        children: [
            {
                name: 'Equity',
                id: '1a',
                children: [
                    {id: '1a1', name: 'GOOG', volume: 100, pnl: 15000},
                    {id: '1a2', name: 'MSFT', volume: 100, pnl: -5000},
                    {id: '1a3', name: 'AAPL', volume: 100, pnl: 7200}
                ]
            },
            {
                name: 'Currency',
                id: '1b',
                children: [
                    {id: '1b1', name: 'YEN', volume: 100, pnl: 20000},
                    {id: '1b2', name: 'EUR', volume: 100, pnl: 20000}
                ]
            }
        ]
    },
    {
        name: 'Icy Hot',
        id: '2',
        children: [
            {
                name: 'Equity',
                id: '2a',
                children: [
                    {id: '2a1', name: 'TSLA', volume: 100, pnl: -150000},
                    {id: '2a2', name: 'AMZN', volume: 100, pnl: 50000}
                ]
            },
            {
                name: 'Currency',
                id: '2b',
                children: [
                    {id: '2b1', name: 'GBP', volume: 100, pnl: 10000},
                    {id: '2b2', name: 'MXN', volume: 100, pnl: 10000}
                ]
            }
        ]
    }
];