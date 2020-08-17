import {wrapper} from '../../common';
import {creates, hoistCmp, HoistModel, XH} from '@xh/hoist/core';
import {code, filler, h3, hbox, hframe, p, vbox, vframe} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import './PreferenceExamplePanel.scss';
import {buttonGroupInput, codeInput, select} from '@xh/hoist/desktop/cmp/input';
import {bindable} from '@xh/hoist/mobx';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faCat, faCrow, faDog, faDuck, faFish, faRam, faWhale} from '@fortawesome/pro-regular-svg-icons';

library.add(faCat, faDog, faCrow, faFish, faDuck, faRam, faWhale);

export const preferenceExamplePanel = hoistCmp.factory({
    model: creates(() => new Model()),
    render: () => wrapper({
        description: [
            p({
                items: [
                    'Hoist allows applications to easily define per-user preferences that can be saved in either ' +
                    'local storage or the database. Apps can easily read and write values to this data service' +
                    ' via ', code('PrefService'), ' and Hoist will handle persisting all changes.'
                ]
            }),
            p({
                items: [
                    'The Persistence API can also store state in a user preference via the ', code('@persist'),
                    ' annotation or ', code('persistWith'), ' config options on our core models like ', code('GridModel'),
                    ', ', code('PanelModel'), ', ', code('TabContainerModel'), ', and ', code('DashContainerModel'), '.'
                ]
            }),
            p({
                items: ['In the example below, you can experiment with setting preferences in the Editor and ',
                    'refresh the browser to check that they stick. The Output panel state is also saved on a user ' +
                    'preference key via the ', code('PersistenceProvider'), '. Examine Local Storage in Chrome Dev Tools ' +
                    'to see raw data in ', code('toolbox.[user]@xh.io.localPrefs')
                ]
            })
        ],
        links: [
            {url: '$HR/admin/tabs/preferences/PreferencePanel.js', notes: 'Preferences Panel'}
        ],
        item: vbox({
            className: 'tb-preferences',
            items: [
                userProfile(),
                hbox({
                    height: 200,
                    items: [
                        preferenceEditor(),
                        codeOutput()
                    ]
                })
            ]
        })
    })
});

const userProfile = hoistCmp.factory(
    ({model}) => {
        const user = XH.getUser();
        return panel({
            title: 'User Preferences',
            icon: Icon.options(),
            item: hframe({
                className: 'user-profile',
                items: [
                    vframe({
                        className: 'user-profile--card',
                        items: [
                            h3(`${user.displayName}`),
                            model.icon
                        ]
                    }),
                    vframe({
                        className: model.className,
                        items: [
                            p(`First Name: ${user.firstName}`),
                            p(`Last Name: ${user.lastName}`),
                            p(`Username: ${user.username}`),
                            p(`Email: ${user.email}`)
                        ]
                    })
                ]
            })
        });
    }
);

const preferenceEditor = hoistCmp.factory(
    () => {
        return panel({
            flex: 1,
            title: 'Preference Editor',
            icon: Icon.gears(),
            compactHeader: true,
            items: [
                hbox({
                    width: 'fill',
                    items: [
                        p({
                            flex: 1,
                            item: 'Set Text Color:'
                        }),
                        filler(),
                        select({
                            width: 200,
                            bind: 'color',
                            options: [
                                {label: 'Default', value: 'default'},
                                {label: 'Blue', value: 'blue'},
                                {label: 'Green', value: 'green'},
                                {label: 'Orange', value: 'orange'},
                                {label: 'Red', value: 'red'}
                            ]
                        }),
                        filler()
                    ]
                }),
                hbox({
                    items: [
                        p({
                            flex: 1,
                            item: 'Set User Icon:'
                        }),
                        buttonGroupInput({
                            className: 'icon-button-group',
                            bind: 'userIcon',
                            items: [
                                button({
                                    text: 'User',
                                    icon: Icon.user(),
                                    value: 'user'
                                }),
                                button({
                                    text: 'Bird',
                                    icon: Icon.icon({iconName: 'crow'}),
                                    value: 'bird'
                                }),
                                button({
                                    text: 'Cat',
                                    icon: Icon.icon({iconName: 'cat'}),
                                    value: 'cat'
                                }),
                                button({
                                    text: 'Dog',
                                    icon: Icon.icon({iconName: 'dog'}),
                                    value: 'dog'
                                }),
                                button({
                                    text: 'Duck',
                                    icon: Icon.icon({iconName: 'duck'}),
                                    value: 'duck'
                                }),
                                button({
                                    text: 'Fish',
                                    icon: Icon.icon({iconName: 'fish'}),
                                    value: 'fish'
                                }),
                                button({
                                    text: 'Ram',
                                    icon: Icon.icon({iconName: 'ram'}),
                                    value: 'ram'
                                }),
                                button({
                                    text: 'Whale',
                                    icon: Icon.icon({iconName: 'whale'}),
                                    value: 'whale'
                                })
                            ]
                        })
                    ]
                })
            ]
        });
    }
);

const codeOutput = hoistCmp.factory(
    ({model}) => {
        return panel({
            flex: 1,
            compactHeader: true,
            title: 'Output',
            icon: Icon.code(),
            model: {
                side: 'right',
                defaultSize: 380,
                maxSize: 425,
                persistWith: model.persistWith
            },
            item: codeInput({
                width: 'fill',
                flex: 1,
                bind: 'codeOutput',
                mode: 'javascript',
                showFullscreenButton: false,
                readonly: true
            })
        });
    }
);

@HoistModel
class Model {
    @bindable color = XH.getPref('prefExampleColor');
    @bindable userIcon = XH.getPref('prefExampleIcon');
    @bindable codeOutput = '// XH.setPref() in action';
    persistWith = {prefKey: 'prefExamplePanelState'};

    constructor() {
        this.addReaction({
            track: () => this.color,
            run: () => this.setPref('prefExampleColor', this.color)
        });
        this.addReaction({
            track: () => this.userIcon,
            run: () => this.setPref('prefExampleIcon', this.userIcon)
        });
    }

    appendCodeOutput(key, value) {
        this.setCodeOutput(this.codeOutput + '\n' + `XH.setPref('${key}', '${value}')`);
    }

    setPref(key, value) {
        XH.setPref(key, value);
        this.appendCodeOutput(key, value);
    }

    get className() {
        const {color} = this;
        switch (color) {
            case 'default':
                return '';
            case 'blue':
                return 'xh-blue';
            case 'green':
                return 'xh-green';
            case 'orange':
                return 'xh-orange';
            case 'red':
                return 'xh-red';
            default:
                return '';
        }
    }

    get icon() {
        const {userIcon} = this;
        switch (userIcon) {
            case 'user':
                return Icon.user({size: '5x'});
            case 'bird':
                return Icon.icon({iconName: 'crow', size: '5x'});
            case 'cat':
                return Icon.icon({iconName: 'cat', size: '5x'});
            case 'dog':
                return Icon.icon({iconName: 'dog', size: '5x'});
            case 'duck':
                return Icon.icon({iconName: 'duck', size: '5x'});
            case 'fish':
                return Icon.icon({iconName: 'fish', size: '5x'});
            case 'ram':
                return Icon.icon({iconName: 'ram', size: '5x'});
            case 'whale':
                return Icon.icon({iconName: 'whale', size: '5x'});
            default:
                return Icon.user({size: '5x'});
        }
    }
}