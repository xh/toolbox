import {div, hbox, img, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/mobile/cmp/button';
import {Icon} from '@xh/hoist/icon';
import {MeetXhWidgetModel} from '../../../desktop/tabs/home/widgets/meetxh/MeetXhWidgetModel';
import './MeetXhWidget.scss';

/**
 * Mobile Meet XH widget - spotlights a rotating XH team member, reusing the platform-agnostic
 * {@link MeetXhWidgetModel} (contact fetch + auto-rotation) with a phone-native layout.
 */
export const meetXhWidget = hoistCmp.factory({
    displayName: 'MeetXhWidget',
    // No auto-rotation on mobile - it shifts the card height. Spotlight is random on first load;
    // the shuffle button loads another. (Demoware: no need to step through every contact.)
    model: creates(() => new MeetXhWidgetModel({autoRotate: false})),
    render({model}) {
        const c = model.spotlightContact;

        if (!c) {
            return div({
                className: 'tb-meet-xh__fallback',
                item: 'Extremely Heavy is a boutique consultancy of experienced enterprise developers - and we are always happy to talk.'
            });
        }

        return div({
            className: 'tb-meet-xh',
            items: [
                hbox({
                    className: 'tb-meet-xh__spotlight',
                    key: c.id,
                    items: [
                        img({
                            className: 'tb-meet-xh__photo',
                            src: model.profilePicUrl(c),
                            alt: c.name
                        }),
                        vbox({
                            className: 'tb-meet-xh__details',
                            items: [
                                div({className: 'tb-meet-xh__name', item: c.name}),
                                div({className: 'tb-meet-xh__location', item: c.location}),
                                hbox({
                                    className: 'tb-meet-xh__tags',
                                    items: (c.tags ?? []).map(t =>
                                        span({className: 'tb-meet-xh__tag', item: t, key: t})
                                    )
                                })
                            ]
                        }),
                        button({
                            className: 'tb-meet-xh__shuffle',
                            icon: Icon.sync(),
                            minimal: true,
                            onClick: () => model.shuffle()
                        })
                    ]
                }),
                div({className: 'tb-meet-xh__bio', item: c.bio?.split('\n')[0]}),
                hbox({
                    className: 'tb-meet-xh__ctas',
                    items: [
                        button({
                            text: 'info@xh.io',
                            icon: Icon.mail(),
                            minimal: false,
                            onClick: () => XH.openWindow('mailto:info@xh.io', '_self')
                        }),
                        button({
                            text: 'xh.io',
                            icon: Icon.globe(),
                            minimal: false,
                            onClick: () => XH.openWindow('https://xh.io', 'xh')
                        })
                    ]
                })
            ]
        });
    }
});
