import {wrapper} from '../../common';
import {hoistCmp, HoistModel} from '@xh/hoist/core';
import {box, code, hframe, p, vframe} from '@xh/hoist/cmp/layout';
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
                    icon: Icon.options(),
                    items: [
                        vframe(
                            panel({
                                className: model.className,
                                mask: model.mask,
                                item: p('Change my text color!')
                            })
                        )],
                    bbar: [
                        panel({
                            flex: 1,
                            height: 250,
                            title: 'PrefService at Work',
                            icon: Icon.gears(),
                            compactHeader: true,
                            items: [
                                hframe(
                                    p('Set Text Color:'),
                                    select({
                                        bind: 'color',
                                        onChange: model.setTextColor(),
                                        options: [
                                            {label: 'red', value: 'red'},
                                            {label: 'blue', value: 'blue'},
                                            {label: 'green', value: 'green'}
                                        ]
                                    })
                                ),
                                hframe(
                                    p('Set User Icon:'),
                                    select({
                                        bind: 'userIcon',
                                        options: [
                                            {label: 'user', value: 'user'},
                                            {label: 'blue', value: 'blue'},
                                            {label: 'green', value: 'green'}
                                        ]
                                    })
                                ),
                                switchInput({
                                    bind: 'mask',
                                    label: 'Mask Component'
                                }),
                                button({
                                    text: 'Show something',
                                    minimal: false
                                })
                            ]
                        }),
                        panel({
                            compactHeader: true,
                            height: 250,
                            title: 'Output',
                            icon: Icon.code(),
                            model: {side: 'right', defaultSize: 300},
                            item: codeInput({
                                height: 240
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
    @bindable mask = false
    @bindable color = XH.getPref('textColor');
    @bindable userIcon;

    setTextColor() {
        this.setColor(this.color);
        XH.setPref('textColor', this.color);
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
}