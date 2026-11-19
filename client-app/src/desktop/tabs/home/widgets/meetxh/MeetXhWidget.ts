import {div, filler, hbox, img, span, vbox} from '@xh/hoist/cmp/layout';
import {tooltip} from '@xh/hoist/cmp/tooltip';
import {creates, hoistCmp, XH} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import './MeetXhWidget.scss';
import {MeetXhWidgetModel} from './MeetXhWidgetModel';

export const meetXhWidget = hoistCmp.factory({
    displayName: 'MeetXhWidget',
    model: creates(MeetXhWidgetModel),
    render({model}) {
        const {contacts, spotlightContact} = model;

        return panel({
            className: 'tb-meet-xh',
            children: [
                spotlightContact
                    ? spotlight()
                    : div({
                          className: 'tb-meet-xh__fallback',
                          children:
                              'Extremely Heavy is a boutique consultancy of experienced enterprise developers - and we are always happy to talk.'
                      }),
                contacts.length > 1 ? avatarRow() : null
            ],
            bbar: toolbar({
                compact: true,
                children: [
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
            children: [
                img({className: 'tb-meet-xh__photo', src: model.profilePicUrl(c), alt: c.name}),
                vbox({
                    className: 'tb-meet-xh__details',
                    children: [
                        div({className: 'tb-meet-xh__name', children: c.name}),
                        div({className: 'tb-meet-xh__location', children: c.location}),
                        hbox({
                            className: 'tb-meet-xh__tags',
                            children: (c.tags ?? []).map(t =>
                                span({className: 'tb-meet-xh__tag', children: t, key: t})
                            )
                        }),
                        div({className: 'tb-meet-xh__bio', children: c.bio?.split('\n')[0]})
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
            children: model.contacts
                .filter(it => it.id !== model.spotlightId)
                .map(c =>
                    tooltip({
                        key: c.id,
                        content: c.name,
                        position: 'top',
                        children: img({
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
