import type {BlueprintDataRequest, BlueprintDataUpdate} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import type {WebSocketMessage} from '@xh/hoist/svc';
import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import {runInAction} from '@xh/hoist/mobx';
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
    setChannel('channel-1');
    XH.webSocketService.enabled = true;
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

function setChannel(key: string) {
    runInAction(() => (XH.webSocketService.channelKey = key));
}

const subscribeRequests = () => hoistCore.requestsTo('blueprints/subscribe'),
    unsubscribeRequests = () => hoistCore.requestsTo('blueprints/unsubscribe'),
    aggregatesRequests = () => hoistCore.requestsTo('blueprints/aggregates'),
    subscribedAfter = (count: number) =>
        vi.waitFor(() => expect(subscribeRequests().length).toBeGreaterThan(count)),
    // Lets queued requests run, for a check that one was not made.
    settle = () => wait(0);

describe('ServerDataProvider', () => {
    it('loads rows with the request as the body', async () => {
        const {rows} = await provider.loadAsync(req);
        expect(rows).toEqual(snapshot);
        expect(hoistCore.requestsTo('blueprints/data').at(-1).json).toEqual(req);
    });

    it('reports how long a load has waited on the server, until it lands', async () => {
        let release: () => void;
        hoistCore.route('POST', 'blueprints/data', async () => {
            await new Promise<void>(resolve => (release = resolve));
            return {rows: snapshot};
        });
        const reports: string[] = [],
            loaded = provider.loadAsync(req, undefined, {
                onProgress: p => reports.push(p.message)
            });

        await vi.waitFor(() => expect(reports).toEqual(['Running positions on the server']));
        await vi.waitFor(() => expect(reports.length).toBe(2), {timeout: 1500});
        expect(reports[1]).toBe('Running positions on the server, 1s');
        release();
        await loaded;
        await wait(1100);
        expect(reports.length).toBe(2);
        hoistCore.route('POST', 'blueprints/data', () => ({rows: snapshot}));
    });

    it('aborts a load on its signal', async () => {
        hoistCore.route('POST', 'blueprints/data', () => new Promise(() => {}));
        const aborter = new AbortController(),
            loaded = provider.loadAsync(req, undefined, {signal: aborter.signal});
        aborter.abort();
        await expect(loaded).rejects.toMatchObject({isFetchAborted: true});
        hoistCore.route('POST', 'blueprints/data', () => ({rows: snapshot}));
    });

    it('sends the snapshot as a replace, then held and live pushes in order', async () => {
        const updates: BlueprintDataUpdate[] = [],
            before = subscribeRequests().length;
        provider.subscribe(req, u => updates.push(u));
        await subscribedAfter(before);

        const {json} = subscribeRequests().at(-1);
        expect(json).toMatchObject({...req, topic: expect.any(String)});
        expect(XH.webSocketService.subscribe).toHaveBeenCalledWith(json.topic, expect.anything());

        push({topic: json.topic, data: {update: [{id: 'a', mktVal: 2}]}});
        expect(updates).toEqual([]);

        releaseSnapshot();
        await vi.waitFor(() => expect(updates).toHaveLength(2));
        push({topic: json.topic, data: {remove: ['a']}});

        expect(updates).toEqual([
            {replace: snapshot, aggregates: totals},
            {update: [{id: 'a', mktVal: 2}]},
            {remove: ['a']}
        ]);
    });

    it('subscribes once the socket has its channel, with that channel', async () => {
        setChannel(null);
        const before = subscribeRequests().length;
        provider.subscribe(req, () => {});
        await settle();
        expect(subscribeRequests()).toHaveLength(before);

        setChannel('channel-2');
        await subscribedAfter(before);
        expect(subscribeRequests().at(-1).json).toMatchObject({channelKey: 'channel-2'});
        releaseSnapshot();
    });

    it('asks nothing of the server when stopped before the socket connects', async () => {
        setChannel(null);
        const subsBefore = subscribeRequests().length,
            unsubsBefore = unsubscribeRequests().length,
            stop = provider.subscribe(req, () => {});
        stop();
        setChannel('channel-3');
        await settle();
        expect(subscribeRequests()).toHaveLength(subsBefore);
        expect(unsubscribeRequests()).toHaveLength(unsubsBefore);
    });

    it('loads once, with no live updates, when websockets are off', async () => {
        setChannel(null);
        XH.webSocketService.enabled = false;
        const updates: BlueprintDataUpdate[] = [],
            subsBefore = subscribeRequests().length;
        provider.subscribe(req, u => updates.push(u));
        await vi.waitFor(() => expect(updates).toEqual([{replace: snapshot}]));
        expect(subscribeRequests()).toHaveLength(subsBefore);
    });

    it('stops at once, and ends the server pushes once the subscribe settles', async () => {
        const updates: BlueprintDataUpdate[] = [],
            unsubscribedBefore = unsubscribeRequests().length,
            before = subscribeRequests().length;
        const unsubscribe = provider.subscribe(req, u => updates.push(u));
        await subscribedAfter(before);
        const {topic} = subscribeRequests().at(-1).json;

        unsubscribe();
        expect(XH.webSocketService.unsubscribe).toHaveBeenCalled();
        await settle();
        expect(unsubscribeRequests()).toHaveLength(unsubscribedBefore);

        releaseSnapshot();
        await vi.waitFor(() => expect(unsubscribeRequests()).toHaveLength(unsubscribedBefore + 1));
        expect(updates).toEqual([]);
        expect(unsubscribeRequests().at(-1).json).toMatchObject({topic});
    });

    it('loads more grouping sets into the live subscription once it is set up', async () => {
        const before = subscribeRequests().length;
        provider.subscribe(req, () => {});
        await subscribedAfter(before);
        const {topic, channelKey} = subscribeRequests().at(-1).json,
            more = {...req, groupBy: [['sector']]};

        const loading = provider.loadAggregatesAsync(more);
        await settle();
        expect(aggregatesRequests().filter(r => r.json.topic === topic)).toHaveLength(0);

        releaseSnapshot();
        expect(await loading).toEqual({aggregates: bySector});
        expect(aggregatesRequests().at(-1).json).toEqual({...more, channelKey, topic});
    });

    it('loads grouping sets without a subscription, and once it has ended', async () => {
        await provider.loadAggregatesAsync({...req, groupBy: [['sector']]});
        expect(aggregatesRequests().at(-1).json).toEqual({...req, groupBy: [['sector']]});

        const updates: BlueprintDataUpdate[] = [],
            before = subscribeRequests().length,
            unsubscribe = provider.subscribe(req, u => updates.push(u));
        await subscribedAfter(before);
        releaseSnapshot();
        await vi.waitFor(() => expect(updates).toHaveLength(1));
        unsubscribe();
        await provider.loadAggregatesAsync({...req, groupBy: [['symbol']]});
        expect(aggregatesRequests().at(-1).json).toEqual({...req, groupBy: [['symbol']]});
    });
});
