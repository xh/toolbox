export  const sampleTreeData = [
    {
        name: 'Market Hawk',
        id: '1',
        children: [
            {
                name: 'Equity',
                id: '1a',
                children: [
                    {id: '1a1', name: 'goog', pnl: 15000},
                    {id: '1a2', name: 'msft', pnl: -5000}
                ]
            },
            {
                name: 'Currency',
                id: '1b',
                children: [
                    {id: '1b1', name: 'yen', pnl: 20000},
                    {id: '1b2', name: 'eur', pnl: 20000}
                ]
            }]
    },
    {
        name: 'Icy Hot',
        id: '2',
        children: [
            {
                name: 'Equity',
                id: '2a',
                children: [
                    {id: '2a1', name: 'tsla', pnl: -150000},
                    {id: '2a2', name: 'amzn', pnl: 50000}
                ]
            },
            {
                name: 'Currency',
                id: '2b',
                children: [
                    {id: '2b1', name: 'gbp', pnl: 10000},
                    {id: '2b2', name: 'peso', pnl: 10000}
                ]
            }]
    }];
