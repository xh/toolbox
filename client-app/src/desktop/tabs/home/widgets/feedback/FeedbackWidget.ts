import {library} from '@fortawesome/fontawesome-svg-core';
import {faFaceFrown, faFaceMeh, faFaceSmile} from '@fortawesome/pro-regular-svg-icons';
import {div, filler, hbox, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {textArea} from '@xh/hoist/desktop/cmp/input';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import './FeedbackWidget.scss';
import {FeedbackWidgetModel} from './FeedbackWidgetModel';

library.add(faFaceFrown, faFaceMeh, faFaceSmile);

export const feedbackWidget = hoistCmp.factory({
    displayName: 'FeedbackWidget',
    model: creates(FeedbackWidgetModel),
    render({model}) {
        const {rating, commentSent} = model;
        const body = !rating ? ratingPrompt() : !commentSent ? commentPrompt() : thanks();
        return panel({className: 'tb-feedback', item: body});
    }
});

const ratingPrompt = hoistCmp.factory<FeedbackWidgetModel>({
    render({model}) {
        return vbox({
            className: 'tb-feedback__inner',
            items: [
                div({className: 'tb-feedback__question', item: 'Enjoying Hoist?'}),
                div({
                    className: 'tb-feedback__sub',
                    item: 'One click - painless, and genuinely read by the team.'
                }),
                hbox({
                    className: 'tb-feedback__ratings',
                    items: [
                        button({
                            icon: Icon.icon({iconName: 'face-frown', size: '2x'}),
                            tooltip: 'Not really',
                            onClick: () => model.setRating('negative')
                        }),
                        button({
                            icon: Icon.icon({iconName: 'face-meh', size: '2x'}),
                            tooltip: "It's OK",
                            onClick: () => model.setRating('neutral')
                        }),
                        button({
                            icon: Icon.icon({iconName: 'face-smile', size: '2x'}),
                            tooltip: 'Yes!',
                            onClick: () => model.setRating('positive')
                        })
                    ]
                })
            ]
        });
    }
});

const commentPrompt = hoistCmp.factory<FeedbackWidgetModel>({
    render({model}) {
        const negative = model.rating !== 'positive';
        return vbox({
            className: 'tb-feedback__inner',
            items: [
                div({
                    className: 'tb-feedback__question',
                    item: negative
                        ? 'Sorry to hear it - what could be better?'
                        : 'Thanks! Anything to add?'
                }),
                textArea({
                    bind: 'comment',
                    commitOnChange: true,
                    placeholder: negative
                        ? 'What is missing, broken, or confusing?'
                        : 'Optional - but we would love to hear more.',
                    flex: 1,
                    width: '100%',
                    autoFocus: negative
                }),
                hbox({
                    className: 'tb-feedback__actions',
                    items: [
                        filler(),
                        button({text: 'Skip', onClick: () => model.skipComment()}),
                        button({
                            text: 'Send to XH',
                            icon: Icon.mail(),
                            intent: 'primary',
                            minimal: false,
                            onClick: () => model.submitCommentAsync()
                        })
                    ]
                })
            ]
        });
    }
});

const thanks = hoistCmp.factory<FeedbackWidgetModel>({
    render({model}) {
        return vbox({
            className: 'tb-feedback__inner tb-feedback__inner--thanks',
            items: [
                Icon.checkCircle({size: '2x', intent: 'success'}),
                div({className: 'tb-feedback__question', item: 'Thanks for your feedback!'}),
                button({text: 'Update your rating', minimal: true, onClick: () => model.reset()})
            ]
        });
    }
});
