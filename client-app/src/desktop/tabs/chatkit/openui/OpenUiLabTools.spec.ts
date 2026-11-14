// The lab's model takes its figures from these tools. They total and slice the sample portfolio
// in the browser, so a wrong total here would show as a wrong number in a rendered UI.
import type {ChatToolSpec} from '@xh/hoist-chat-kit/core';
import type {ChatToolResult} from '@xh/hoist-chat-kit/core';
import type {InitContext} from '@xh/hoist/core';
import {XH} from '@xh/hoist/core';
import {hoistCore, initTestAppAsync, TestAppModel} from '@xh/hoist/test-support';
import {beforeAll, describe, expect, it} from 'vitest';
import {PortfolioService} from '../../../../core/svc/PortfolioService';
import {createOpenUiLabTools} from './OpenUiLabTools';

class PortfolioTestModel extends TestAppModel {
    override async initAsync(ctx: InitContext) {
        await XH.installServicesAsync(PortfolioService, ctx);
    }
}

const position = (symbol: string, sector: string, region: string, pnl: number, mktVal: number) => ({
    symbol,
    sector,
    region,
    fund: 'Oak Mount',
    model: 'Ren',
    trader: 'Fred Corn',
    pnl,
    mktVal
});

const positions = [
    position('AAA', 'Energy', 'US', 100, 1000),
    position('AAA', 'Energy', 'EU', -40, 500),
    position('BBB', 'Energy', 'US', 10, 200),
    position('CCC', 'Technology', 'US', -300, 4000)
];

const trade = (id: string, symbol: string, dir: string, quantity: number, time: number) => ({
    id,
    symbol,
    sector: 'Energy',
    region: 'US',
    dir,
    quantity,
    price: 10,
    mktVal: null,
    time,
    commission: 5,
    confidence: 500,
    model: 'Ren',
    trader: 'Fred Corn',
    fund: 'Oak Mount'
});

const trades = [
    trade('t1', 'AAA', 'Buy', 100, Date.UTC(2026, 0, 5, 15)),
    trade('t2', 'BBB', 'Sell', -50, Date.UTC(2026, 0, 7, 15)),
    trade('t3', 'AAA', 'Sell', -20, Date.UTC(2026, 0, 6, 15))
];

const prices = [
    {day: '2026-01-05', open: 10, high: 12, low: 9, close: 10, volume: 1000},
    {day: '2026-01-06', open: 10, high: 13, low: 10, close: 12, volume: 3000},
    {day: '2026-01-07', open: 12, high: 16, low: 11, close: 15, volume: 2000}
];

let tools: ChatToolSpec[];

/** Run a tool as the chat does, and return what it gives the chat. */
async function runAsync(name: string, input: object): Promise<ChatToolResult> {
    return tools.find(it => it.name === name).execute(input, null);
}

beforeAll(async () => {
    hoistCore.route('GET', 'portfolio/lookups', () => ({
        sectors: ['Energy', 'Technology'],
        regions: ['US', 'EU'],
        funds: ['Oak Mount'],
        models: ['Ren'],
        traders: ['Fred Corn']
    }));
    hoistCore.route('GET', 'portfolio/pricedRawPositions', () => positions);
    hoistCore.route('GET', 'portfolio/orders', () => trades);
    hoistCore.route('GET', 'portfolio/prices/AAA', () => prices);
    hoistCore.route('GET', 'portfolio/prices/NOPE', () => []);
    await initTestAppAsync({modelClass: PortfolioTestModel});
    tools = createOpenUiLabTools();
});

describe('query_positions', () => {
    it('totals positions by a dimension, best P&L first, and keeps the rows as an artifact', async () => {
        const {output, artifacts} = await runAsync('query_positions', {groupBy: ['symbol']}),
            [artifact] = artifacts;

        expect(artifact.rows).toEqual([
            {symbol: 'AAA', pnl: 60, mktVal: 1500, positions: 2},
            {symbol: 'BBB', pnl: 10, mktVal: 200, positions: 1},
            {symbol: 'CCC', pnl: -300, mktVal: 4000, positions: 1}
        ]);
        expect(output.artifact).toBe(artifact.id);
        expect(output.summary).toEqual({groups: 3, positions: 4, pnl: -230, mktVal: 5700});
    });

    it('totals by two dimensions, within a filter', async () => {
        const {artifacts} = await runAsync('query_positions', {
            groupBy: ['sector', 'region'],
            filter: {sector: 'Energy'},
            sortBy: 'pnl',
            sortDir: 'asc'
        });

        expect(artifacts[0].rows).toEqual([
            {sector: 'Energy', region: 'EU', pnl: -40, mktVal: 500, positions: 1},
            {sector: 'Energy', region: 'US', pnl: 110, mktVal: 1200, positions: 2}
        ]);
    });

    it('keeps the limit of rows, and still sums every position in the summary', async () => {
        const {output, artifacts} = await runAsync('query_positions', {
            groupBy: ['symbol'],
            sortBy: 'pnl',
            sortDir: 'asc',
            limit: 1
        });

        expect(artifacts[0].rows.map(it => it.symbol)).toEqual(['CCC']);
        expect(output.totalRows).toBe(1);
        expect(output.summary.groups).toBe(3);
    });

    it('offers the dimension values of the portfolio as filter choices', () => {
        const {filter} = tools.find(it => it.name === 'query_positions').parameters.properties;
        expect(filter.properties.sector.enum).toEqual(['Energy', 'Technology']);
    });
});

describe('query_trades', () => {
    it('lists trades newest first, and counts every match in the summary', async () => {
        const {output, artifacts} = await runAsync('query_trades', {filter: {symbol: 'AAA'}});

        expect(artifacts[0].rows.map(it => it.time)).toEqual([trades[2].time, trades[0].time]);
        expect(output.summary).toEqual({trades: 2, buys: 1, sells: 1, grossNotional: 1200});
    });

    it('shows the model times as ISO text, and keeps them as epoch millis for the grid', async () => {
        const {output, artifacts} = await runAsync('query_trades', {limit: 1});

        expect(output.firstRows[0].time).toBe('2026-01-07T15:00:00.000Z');
        expect(artifacts[0].rows[0].time).toBe(trades[1].time);
    });

    it('gives each artifact of a chat its own id', async () => {
        const first = await runAsync('query_trades', {}),
            second = await runAsync('query_trades', {});

        expect(first.artifacts[0].id).not.toBe(second.artifacts[0].id);
    });
});

describe('get_price_history', () => {
    it('summarizes the period, and keeps a row per day with its date as epoch millis', async () => {
        const {output, artifacts} = await runAsync('get_price_history', {symbol: 'AAA'}),
            {rows} = artifacts[0];

        expect(output.summary).toEqual({
            symbol: 'AAA',
            from: '2026-01-05',
            to: '2026-01-07',
            firstClose: 10,
            lastClose: 15,
            change: 0.5,
            high: 16,
            low: 9,
            avgVolume: 2000
        });
        expect(rows).toHaveLength(3);
        expect(new Date(rows[0].day).getFullYear()).toBe(2026);
        expect(output.firstRows[0].day).toBe('2026-01-05');
    });

    it('keeps the most recent days asked for', async () => {
        const {output} = await runAsync('get_price_history', {symbol: 'AAA', days: 2});

        expect(output.summary).toMatchObject({from: '2026-01-06', change: 0.25});
    });

    it('tells the model how to find a symbol when it asks for one with no prices', async () => {
        await expect(runAsync('get_price_history', {symbol: 'NOPE'})).rejects.toThrow(
            /query_positions/
        );
    });
});
