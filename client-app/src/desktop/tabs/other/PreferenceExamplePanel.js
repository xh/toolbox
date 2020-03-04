import {wrapper} from '../../common';
import {hoistCmp, HoistModel} from '@xh/hoist/core';
import {box, code, h3, hbox, hframe, p, vframe} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import './PreferenceExamplePanel.scss';
import {XH} from '@xh/hoist/core';
import {codeInput, select, switchInput} from '@xh/hoist/desktop/cmp/input';
import {bindable} from '@xh/hoist/mobx';
import {creates} from '@xh/hoist/core/modelspec';

export const preferenceExamplePanel = hoistCmp.factory({
    model: creates(() => new Model()),
    render: ({model}) => wrapper({
        description: [
            p({
                items: ['Here in Toolbox, users are able to set local user app preferences in App Menu Options via ',
                    code('PrefService'),
                    '. Preferences are created by admin and can be extended to the user to set in Local Storage, where they persist until cleared.']
            }),
            p('In the toy app below, you can experiment with setting preferences and refresh the browser to check that they stick. The Application tab in Chrome Dev Tools will also expose all preferences in Local Storage according to readable key-value pairs.')
        ],
        links: [
            {url: '$HR/admin/tabs/preferences/PreferencePanel.js', notes: 'Preferences Panel'}
        ],
        item: box({
            className: 'tb-preferences',
            items: [
                panel({
                    title: 'User Preferences',
                    className: model.background,
                    icon: Icon.options(),
                    item: hframe({
                        className: 'user-profile',
                        items: [
                            vframe({
                                className: 'user-profile--card',
                                items: [
                                    h3(`${XH.getUser().displayName}`),
                                    model.icon
                                ]
                            }),
                            vframe({
                                className: model.className,
                                items: [
                                    p(`First Name: ${XH.getUser().firstName}`),
                                    p(`Last Name: ${XH.getUser().lastName}`),
                                    p(`Username: ${XH.getUser().username}`),
                                    p(`Email: ${XH.getUser().email}`)
                                ]
                            })
                        ]
                    }),
                    bbar: [
                        panel({
                            flex: 1,
                            height: 240,
                            title: 'PrefService at Work',
                            icon: Icon.gears(),
                            compactHeader: true,
                            items: [
                                hbox({
                                    width: 'fill',
                                    items: [p('Set Text Color:'),
                                        select({
                                            bind: 'color',
                                            onChange: model.setTextColor(),
                                            options: [
                                                {label: 'Red', value: 'red'},
                                                {label: 'Blue', value: 'blue'},
                                                {label: 'Green', value: 'green'}
                                            ]
                                        })]
                                }),
                                hbox(
                                    p('Set User Icon:'),
                                    select({
                                        bind: 'userIcon',
                                        onChange: model.setIcon(),
                                        options: [
                                            {label: 'User', value: 'user'},
                                            {label: 'Chess Knight', value: 'knight'},
                                            {label: 'Sun', value: 'sun'}
                                        ]
                                    })
                                ),
                                hbox(
                                    switchInput({
                                        bind: 'showBackground',
                                        label: 'Show Background Image',
                                        onChange: () => model.setBackground()
                                    })
                                ),
                                button({
                                    icon: Icon.refresh(),
                                    text: 'Save Preferences and Reload',
                                    minimal: false,
                                    onClick: () => XH.reloadApp()
                                })
                            ]
                        }),
                        panel({
                            compactHeader: true,
                            height: 240,
                            title: 'Output',
                            icon: Icon.code(),
                            model: {side: 'right', defaultSize: 300},
                            item: codeInput({
                                height: 230
                            })
                        })
                    ]
                })
            ]
        })
    })
});


@HoistModel
class Model {
    @bindable color = XH.getPref('textColor');
    @bindable userIcon = XH.getPref('userIcon');
    @bindable showBackground = XH.getPref('showBackground');

    setTextColor() {
        this.setColor(this.color);
        XH.setPref('textColor', this.color);
    }

    setIcon() {
        this.setUserIcon(this.userIcon);
        XH.setPref('userIcon', this.userIcon);
    }

    setBackground() {
        this.setShowBackground(!this.showBackground);
        XH.setPref('showBackground', this.showBackground);
    }

    get className() {
        const color = XH.getPref('textColor');
        switch (color) {
            case 'red':
                return 'xh-red';
            case 'blue':
                return 'xh-blue';
            case 'green':
                return 'xh-green';
            default:
                return '';
        }
    }

    get icon() {
        const userIcon = XH.getPref('userIcon');
        switch (userIcon) {
            case 'user':
                return Icon.user({size: '5x'});
            case 'knight':
                return Icon.chessKnight({size: '5x'});
            case 'sun':
                return Icon.sun(({size: '5x'}));
            default:
                return 'Please select an icon.';
        }
    }

    get background() {
        if (XH.getPref('showBackground')) {
            return 'xh-tiled-bg';
        } else {
            return '';
        }
    }
}