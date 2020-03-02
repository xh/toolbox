import {wrapper} from '../../common';
import {hoistCmp, HoistModel} from '@xh/hoist/core';
import {box, filler, hbox, p} from '@xh/hoist/cmp/layout';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon/Icon';
import './PreferenceExamplePanel.scss';
import {XH} from '@xh/hoist/core';
import {codeInput} from '@xh/hoist/desktop/cmp/input';
import {bindable, action} from '@xh/hoist/mobx';
import {creates} from '@xh/hoist/core/modelspec';

export const preferenceExamplePanel = hoistCmp.factory({
    model: creates(() => new Model()),
    render: ({model}) => wrapper({
        description: [
            p('Preferences can be set on the admin panel.')
        ],
        links: [
            {url: '$HR/admin/tabs/preferences/PreferencePanel.js', notes: 'Preferences Panel'},
        ],
        item: box({
            className: 'tb-preferences',
            item: panel({
                title: 'User Preferences',
                icon: Icon.options(),
                items: [
                    p('In the `fooBar` function below, the Exception Handler catches the error and returns the error message in a readable format. Since `bar` has not been defined, a Reference Error will be thrown.'),
                    codeInput({
                        width: 'fill',
                        height: 120,
                        showFullscreenButton: false,
                        editorProps: {
                            readOnly: true
                        },
                        mode: 'javascript',
                    }),
                    filler()
                ]
            })
        })
    })
});


@HoistModel
class Model {
    @bindable
    pingResponse = '/*\nPing or kill the Toolbox server\nby clicking one of the buttons \nbelow.\n*/';

    @action
    setPing(ping) {
        this.pingResponse = ping;
    }

    async onPingClicked() {
        const pingURL = XH.isDevelopmentMode ?
            `${XH.baseUrl}ping` :
            `${window.location.origin}${XH.baseUrl}ping`;
        await XH.fetchJson({url: pingURL}).then(
            (res) => this.setPing(JSON.stringify(res, null, '  '))
        );
    }
}