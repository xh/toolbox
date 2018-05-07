export const tradeVolumeFormatter = params => {
    const addDecimalGrouping = new Intl.NumberFormat('en-US', {
        style: 'decimal',
        useGrouping: true
    });
    return `${addDecimalGrouping.format(params.value)}m`;
};

export const profitLossFormatter = params => {
    const currency = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        useGrouping: true
    });
    return `${currency.format(params.value)}`;
};

export const profitLossColor = params => ({color: `var(--xh-${params.value < 0 ? 'red' : 'green'})`});
