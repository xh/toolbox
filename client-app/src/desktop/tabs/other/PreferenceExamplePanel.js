import {wrapper} from '../../common';
import {hoistCmp, HoistModel} from '@xh/hoist/core';
import {code, h3, hbox, hframe, p, vbox, vframe} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import './PreferenceExamplePanel.scss';
import {XH} from '@xh/hoist/core';
import {buttonGroupInput, codeInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {bindable} from '@xh/hoist/mobx';
import {creates} from '@xh/hoist/core/modelspec';
import {library} from '@fortawesome/fontawesome-svg-core';
import {faCat, faDog, faCrow, faFish, faDuck, faRam, faWhale} from '@fortawesome/pro-regular-svg-icons';
import {fontAwesomeIcon} from '@xh/hoist/icon';
library.add(faCat, faDog, faCrow, faFish, faDuck, faRam, faWhale);

export const preferenceExamplePanel = hoistCmp.factory({
    model: creates(() => new Model()),
    render: ({model}) => wrapper({
        description: [
            p({
                items: [
                    'Hoist allows applications to easily define per-user preferences that can be saved in either ' +
                    'local storage or the database. Apps can easily read and write values to this data service' +
                    'via ',
                    code('PrefService'),
                    ' and hoist will handle persisting all changes.'
                ]
            }),
            p({
                items: ['In the example below, you can experiment with setting preferences and ',
                    'refresh the browser to check that they stick. Examine Local Storage in Chrome Dev Tools to see raw data in ',
                    code('toolbox.[user]@xh.io.localPrefs')
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
                hbox(
                    preferenceEditor(),
                    codeOutput()
                )
            ]
        })
    })
});

const userProfile = hoistCmp.factory(
    ({model}) => {
        const user = XH.getUser();
        return panel({
            title: 'User Preferences',
            className: model.background,
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
            height: 240,
            title: 'Preference Editor',
            icon: Icon.gears(),
            compactHeader: true,
            items: [
                hbox({
                    width: 'fill',
                    items: [
                        p('Set Text Color:'),
                        select({
                            width: 100,
                            bind: 'color',
                            options: [
                                {label: 'Orange', value: 'orange'},
                                {label: 'Red', value: 'red'},
                                {label: 'Green', value: 'green'},
                                {label: 'Blue', value: 'blue'},
                                {label: 'Black', value: 'black'}
                            ]
                        })
                    ]
                }),
                hbox({
                    items: [
                        p('Set User Icon:'),
                        buttonGroupInput({
                            className: 'icon-button-group',
                            bind: 'userIcon',
                            height: 25,
                            items: [
                                button({
                                    text: 'User',
                                    icon: Icon.user(),
                                    value: 'user'
                                }),
                                button({
                                    text: 'Cat',
                                    icon: fontAwesomeIcon({icon: faCat}),
                                    value: 'cat'
                                }),
                                button({
                                    text: 'Dog',
                                    icon: fontAwesomeIcon({icon: faDog}),
                                    value: 'dog'
                                }),
                                button({
                                    text: 'Fish',
                                    icon: fontAwesomeIcon({icon: faFish}),
                                    value: 'fish'
                                }),
                                button({
                                    text: 'Bird',
                                    icon: fontAwesomeIcon({icon: faCrow}),
                                    value: 'bird'
                                }),
                                button({
                                    text: 'Duck',
                                    icon: fontAwesomeIcon({icon: faDuck}),
                                    value: 'duck'
                                }),
                                button({
                                    text: 'Ram',
                                    icon: fontAwesomeIcon({icon: faRam}),
                                    value: 'ram'
                                }),
                                button({
                                    text: 'Whale',
                                    icon: fontAwesomeIcon({icon: faWhale}),
                                    value: 'whale'
                                })
                            ]
                        })
                    ]
                }),
                hbox({
                    item: switchInput({
                        bind: 'showBackground',
                        label: 'Show Background Image',
                        labelAlign: 'left'
                    })
                })
            ]
        });
    }
);

const codeOutput = hoistCmp.factory(
    () => {
        return panel({
            flex: 'auto',
            compactHeader: true,
            height: 240,
            title: 'Output',
            icon: Icon.code(),
            model: {side: 'right', defaultSize: 350},
            item: codeInput({
                height: 230,
                width: 'fill',
                bind: 'codeOutput',
                mode: 'javascript'
            })
        });
    }
);

@HoistModel
class Model {
    @bindable color = XH.getPref('prefExampleColor');
    @bindable userIcon = XH.getPref('prefExampleIcon');
    @bindable showBackground = XH.getPref('prefExampleShowBackground');
    @bindable codeOutput = '// XH.setPref() in action';

    constructor() {
        this.addReaction({
            track: () => this.color,
            run: () => this.setPref('prefExampleColor', this.color)
        });
        this.addReaction({
            track: () => this.userIcon,
            run: () => this.setPref('prefExampleIcon', this.userIcon)
        });
        this.addReaction({
            track: () => this.showBackground,
            run: () => this.setPref('prefExampleShowBackground', this.showBackground)
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
            case 'red':
                return 'xh-red';
            case 'orange':
                return 'xh-orange';
            case 'blue':
                return 'xh-blue';
            case 'green':
                return 'xh-green';
            case 'black':
                return 'xh-black';
            default:
                return '';
        }
    }

    get icon() {
        const {userIcon} = this;
        switch (userIcon) {
            case 'user':
                return Icon.user({size: '5x'});
            case 'knight':
                return Icon.chessKnight({size: '5x'});
            case 'dog':
                return fontAwesomeIcon({icon: faDog, size: '5x'});
            case 'cat':
                return fontAwesomeIcon({icon: faCat, size: '5x'});
            case 'fish':
                return fontAwesomeIcon({icon: faFish, size: '5x'});
            case 'bird':
                return fontAwesomeIcon({icon: faCrow, size: '5x'});
            case 'duck':
                return fontAwesomeIcon({icon: faDuck, size: '5x'});
            case 'ram':
                return fontAwesomeIcon({icon: faRam, size: '5x'});
            case 'whale':
                return fontAwesomeIcon({icon: faWhale, size: '5x'});
            default:
                return Icon.user({size: '5x'});
        }
    }

    get background() {
        return this.showBackground ? 'xh-tiled-bg' : '';
    }
}