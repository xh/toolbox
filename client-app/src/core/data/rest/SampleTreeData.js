export const sampleTreeData = [
    {
        name: 'Market Hawk',
        id: '1',
        children: [
            {
                name: 'Equity',
                id: '1a',
                children: [
                    {id: '1a1', name: 'GOOG', pnl: 15000},
                    {id: '1a2', name: 'MSFT', pnl: -5000},
                    {id: '1a3', name: 'AAPL', pnl: 7200}
                ]
            },
            {
                name: 'Currency',
                id: '1b',
                children: [
                    {id: '1b1', name: 'YEN', pnl: 20000},
                    {id: '1b2', name: 'EUR', pnl: 20000}
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
                    {id: '2a1', name: 'TSLA', pnl: -150000},
                    {id: '2a2', name: 'AMZN', pnl: 50000}
                ]
            },
            {
                name: 'Currency',
                id: '2b',
                children: [
                    {id: '2b1', name: 'GBP', pnl: 10000},
                    {id: '2b2', name: 'MXN', pnl: 10000}
                ]
            }
        ]
    }
];