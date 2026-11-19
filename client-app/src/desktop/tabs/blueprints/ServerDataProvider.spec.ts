import type {BlueprintDataRequest, BlueprintDataUpdate} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import type {WebSocketMessage} from '@xh/hoist/svc';
import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import {wait} from '@xh/hoist/promise';
import {beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
import {ServerDataProvider} from './ServerDataProvider';

const req: BlueprintDataRequest = {
    dataset: 'positions',
    params: {asOf: '2026-11-18'},
    fields: ['sector', 'symbol', 'mktVal'],
    groupBy: [['sector', 'symbol']]
};

const snapshot = [{id: 'a', mktVal: 1}],
    totals = [{dims: {}, values: {var95: 10}}],
    bySector = [{dims: {sector: 'Energy'}, values: {var95: 4}}];

let push: (msg: WebSocketMessage) => void,
    releaseSnapshot: () => void,
    provider: ServerDataProvider;

beforeAll(async () => {
    await initTestAppAsync();
    hoistCore.route('POST', 'blueprints/data', () => ({rows: snapshot}));
    hoistCore.route('POST', 'blueprints/unsubscribe', () => undefined);
    hoistCore.route('POST', 'blueprints/aggregates', () => ({aggregates: bySector}));
});

beforeEach(() => {
    provider = new ServerDataProvider();
    vi.spyOn(XH.webSocketService, 'subscribe').mockImplementation((topic, fn) => {
        push = fn;
        return {topic, fn} as any;
    });
    vi.spyOn(XH.webSocketService, 'unsubscribe').mockImplementation(() => {});
    hoistCore.route('POST', 'blueprints/subscribe', async () => {
        await new Promise<void>(resolve => (releaseSnapshot = resolve));
        return {rows: snapshot, aggregates: totals};
    });
});

const subscribeRequests = () => hoistCore.requestsTo('blueprints/subscribe'),
    unsubscribeRequests = () => hoistCore.requestsTo('blueprints/unsubscribe'),
    aggregatesRequests = () => hoistCore.requestsTo('blueprints/aggregates');

describe('ServerDataProvider', () => {
    it('loads rows with the request as the body', async () => {
        const {rows} = await provider.loadAsync(req);
        expect(rows).toEqual(snapshot);
        expect(hoistCore.requestsTo('blueprints/data').at(-1).json).toEqual(req);
    });

    it('sends the snapshot as a replace, then held and live pushes in order', async () => {
        const updates: BlueprintDataUpdate[] = [];
        provider.subscribe(req, u => updates.push(u));
        await wait(10);

        const {json} = subscribeRequests().at(-1);
        expect(json).toMatchObject({...req, topic: expect.any(String)});
        expect(XH.webSocketService.subscribe).toHaveBeenCalledWith(json.topic, expect.anything());

        push({topic: json.topic, data: {update: [{id: 'a', mktVal: 2}]}});
        expect(updates).toEqual([]);

        releaseSnapshot();
        await wait(10);
        push({topic: json.topic, data: {remove: ['a']}});

        expect(updates).toEqual([
            {replace: snapshot, aggregates: totals},
            {update: [{id: 'a', mktVal: 2}]},
            {remove: ['a']}
        ]);
    });

    it('stops at once, and ends the server pushes once the subscribe settles', async () => {
        const updates: BlueprintDataUpdate[] = [],
            unsubscribedBefore = unsubscribeRequests().length;
        const unsubscribe = provider.subscribe(req, u => updates.push(u));
        await wait(10);
        const {topic} = subscribeRequests().at(-1).json;

        unsubscribe();
        expect(XH.webSocketService.unsubscribe).toHaveBeenCalled();
        await wait(10);
        expect(unsubscribeRequests()).toHaveLength(unsubscribedBefore);

        releaseSnapshot();
        await wait(10);
        expect(updates).toEqual([]);
        expect(unsubscribeRequests().at(-1).json).toMatchObject({topic});
    });

    it('loads more grouping sets into the live subscription once it is set up', async () => {
        provider.subscribe(req, () => {});
        await wait(10);
        const {topic, channelKey} = subscribeRequests().at(-1).json,
            more = {...req, groupBy: [['sector']]};

        const loading = provider.loadAggregatesAsync(more);
        await wait(10);
        expect(aggregatesRequests().filter(r => r.json.topic === topic)).toHaveLength(0);

        releaseSnapshot();
        expect(await loading).toEqual({aggregates: bySector});
        expect(aggregatesRequests().at(-1).json).toEqual({...more, channelKey, topic});
    });

    it('loads grouping sets without a subscription, and once it has ended', async () => {
        await provider.loadAggregatesAsync({...req, groupBy: [['sector']]});
        expect(aggregatesRequests().at(-1).json).toEqual({...req, groupBy: [['sector']]});

        const unsubscribe = provider.subscribe(req, () => {});
        await wait(10);
        releaseSnapshot();
        await wait(10);
        unsubscribe();
        await provider.loadAggregatesAsync({...req, groupBy: [['symbol']]});
        expect(aggregatesRequests().at(-1).json).toEqual({...req, groupBy: [['symbol']]});
    });
});
