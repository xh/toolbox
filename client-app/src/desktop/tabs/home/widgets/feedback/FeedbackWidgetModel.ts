import {HoistModel, XH} from '@xh/hoist/core';
import {action, bindable, runInAction} from '@xh/hoist/mobx';

export type HoistRating = 'negative' | 'neutral' | 'positive';

export class FeedbackWidgetModel extends HoistModel {
    @bindable accessor rating: HoistRating = null;
    @bindable accessor commentSent: boolean = false;
    @bindable accessor comment: string = '';

    @action
    setRating(rating: HoistRating) {
        this.rating = rating;
        XH.track({
            category: 'Feedback',
            message: `Hoist sentiment: ${rating}`,
            logData: true
        });
    }

    @action
    skipComment() {
        this.commentSent = true;
    }

    async submitCommentAsync() {
        const {comment, rating} = this,
            userMessage = comment?.trim();
        if (!userMessage) {
            this.skipComment();
            return;
        }

        XH.track({
            category: 'Feedback',
            message: 'User submitted feedback',
            data: {userMessage, rating},
            logData: true
        });
        await XH.trackService.pushPendingAsync();
        XH.successToast('Thank you - your feedback has been sent!');
        runInAction(() => {
            this.comment = '';
            this.commentSent = true;
        });
    }

    @action
    reset() {
        this.rating = null;
        this.commentSent = false;
        this.comment = '';
    }
}
