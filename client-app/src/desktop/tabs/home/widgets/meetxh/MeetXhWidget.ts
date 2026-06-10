import {div, filler, hbox, img, span, vbox} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {tooltip} from '@xh/hoist/kit/blueprint';
import './MeetXhWidget.scss';
import {MeetXhWidgetModel} from './MeetXhWidgetModel';

export const meetXhWidget = hoistCmp.factory({
    displayName: 'MeetXhWidget',
    model: creates(MeetXhWidgetModel),
    render({model}) {
        const {contacts, spotlightContact} = model;

        return panel({
            className: 'tb-meet-xh',
            items: [
                spotlightContact
                    ? spotlight()
                    : div({
                          className: 'tb-meet-xh__fallback',
                          item: 'Extremely Heavy is a boutique consultancy of experienced enterprise developers - and we are always happy to talk.'
                      }),
                contacts.length > 1 ? avatarRow() : null
            ],
            bbar: toolbar({
                compact: true,
                items: [
                    button({
                        text: 'Open Contacts example app',
                        icon: Icon.openExternal(),
                        onClick: () => XH.openWindow('/contact', 'contact')
                    }),
                    filler(),
                    button({
                        text: 'info@xh.io',
                        icon: Icon.mail(),
                        onClick: () => XH.openWindow('mailto:info@xh.io', '_self')
                    }),
                    button({
                        text: 'xh.io',
                        icon: Icon.globe(),
                        onClick: () => XH.openWindow('https://xh.io', 'xh')
                    })
                ]
            })
        });
    }
});

const spotlight = hoistCmp.factory<MeetXhWidgetModel>({
    render({model}) {
        const c = model.spotlightContact;
        return hbox({
            className: 'tb-meet-xh__spotlight',
            // Re-key per contact to retrigger the fade-in animation on rotation.
            key: c.id,
            items: [
                img({className: 'tb-meet-xh__photo', src: model.profilePicUrl(c), alt: c.name}),
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
                        }),
                        div({className: 'tb-meet-xh__bio', item: c.bio?.split('\n')[0]})
                    ]
                }),
                button({
                    className: 'tb-meet-xh__shuffle',
                    icon: Icon.sync(),
                    tooltip: 'Meet someone else',
                    onClick: () => model.shuffle()
                })
            ]
        });
    }
});

const avatarRow = hoistCmp.factory<MeetXhWidgetModel>({
    render({model}) {
        return hbox({
            className: 'tb-meet-xh__avatars',
            items: model.contacts
                .filter(it => it.id !== model.spotlightId)
                .map(c =>
                    tooltip({
                        key: c.id,
                        content: c.name,
                        placement: 'top',
                        item: img({
                            className: 'tb-meet-xh__avatar',
                            src: model.profilePicUrl(c),
                            alt: c.name,
                            onClick: () => model.spotlight(c.id)
                        })
                    })
                )
        });
    }
});
