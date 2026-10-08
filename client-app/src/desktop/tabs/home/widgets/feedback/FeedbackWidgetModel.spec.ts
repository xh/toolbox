import {XH} from '@xh/hoist/core';
import {hoistCore, initTestAppAsync} from '@xh/hoist/test-support';
import type {MockInstance} from 'vitest';
import {afterEach, beforeAll, beforeEach, describe, expect, it, vi} from 'vitest';
import {FeedbackWidgetModel} from './FeedbackWidgetModel';

beforeAll(() => initTestAppAsync());

let model: FeedbackWidgetModel,
    // Watches track pushes, so a test can wait for the ones the model starts without awaiting.
    pushSpy: MockInstance;

beforeEach(() => {
    vi.useFakeTimers({toFake: ['setTimeout', 'clearTimeout', 'Date']});
    vi.spyOn(XH, 'successToast').mockImplementation(() => null);
    pushSpy = vi.spyOn(XH.trackService, 'pushPendingAsync');
    model = new FeedbackWidgetModel();
});

// Destroy can send an entry - let it land before the next test starts.
afterEach(async () => {
    model.destroy();
    await settleAsync();
});

async function settleAsync() {
    await Promise.all(pushSpy.mock.results.map(it => it.value));
}

// Feedback entries the client has sent to the server.
async function sentFeedbackAsync() {
    vi.useRealTimers();
    await settleAsync();
    return hoistCore
        .requestsTo('xh/track')
        .flatMap(req => req.json.entries)
        .filter(it => it.category === 'Feedback');
}

describe('explicit submit', () => {
    it('sends one entry with the rating and trimmed comment, then thanks the user', async () => {
        model.setRating('positive');
        model.comment = '  Great docs  ';
        await model.submitCommentAsync();

        const entries = await sentFeedbackAsync();
        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject({
            msg: 'Hoist feedback: positive',
            data: {rating: 'positive', userMessage: 'Great docs'}
        });
        expect(XH.successToast).toHaveBeenCalledOnce();
        expect(model.commentSent).toBe(true);
        expect(model.comment).toBe('');
    });

    it('sends the rating alone when the user skips the comment, ignoring any draft', async () => {
        model.setRating('neutral');
        model.comment = 'half-written';
        model.skipComment();

        const entries = await sentFeedbackAsync();
        expect(entries.map(it => it.data)).toEqual([{rating: 'neutral'}]);
        expect(XH.successToast).not.toHaveBeenCalled();
    });

    it('sends nothing more after the first entry', async () => {
        model.setRating('positive');
        await model.submitCommentAsync();
        await model.submitCommentAsync();
        model.skipComment();
        model.destroy();

        expect(await sentFeedbackAsync()).toHaveLength(1);
    });
});

describe('idle flush', () => {
    it('sends a sitting rating after 30s idle, with no toast', async () => {
        model.setRating('negative');
        vi.advanceTimersByTime(29_000);
        expect(model.commentSent).toBe(false);

        vi.advanceTimersByTime(1_000);
        expect(model.commentSent).toBe(true);
        expect((await sentFeedbackAsync()).map(it => it.data)).toEqual([{rating: 'negative'}]);
        expect(XH.successToast).not.toHaveBeenCalled();
    });

    it('restarts the timer on each keystroke, then sends the draft', async () => {
        model.setRating('positive');
        vi.advanceTimersByTime(20_000);
        model.comment = 'Still';
        vi.advanceTimersByTime(20_000);
        model.comment = 'Still typing';
        vi.advanceTimersByTime(29_000);
        expect(model.commentSent).toBe(false);

        vi.advanceTimersByTime(1_000);
        expect((await sentFeedbackAsync()).map(it => it.data)).toEqual([
            {rating: 'positive', userMessage: 'Still typing'}
        ]);
    });
});

describe('destroy', () => {
    it('sends an unsent rating when the widget unmounts', async () => {
        model.setRating('positive');
        model.comment = 'Bye';
        model.destroy();

        expect((await sentFeedbackAsync()).map(it => it.data)).toEqual([
            {rating: 'positive', userMessage: 'Bye'}
        ]);
    });

    it('sends nothing without a rating', async () => {
        model.comment = 'No rating given';
        model.destroy();
        vi.advanceTimersByTime(60_000);

        expect(await sentFeedbackAsync()).toEqual([]);
    });
});

describe('reset', () => {
    it('clears the interaction, so a new rating can be sent', async () => {
        model.setRating('positive');
        await model.submitCommentAsync();
        model.reset();
        expect(model.rating).toBeNull();
        expect(model.commentSent).toBe(false);

        model.setRating('negative');
        model.skipComment();
        expect((await sentFeedbackAsync()).map(it => it.data.rating)).toEqual([
            'positive',
            'negative'
        ]);
    });
});
