import {hoistCmp, uses, XH} from '@xh/hoist/core';
import {appBar} from '@xh/hoist/desktop/cmp/appbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import {wrapper} from '../../desktop/common/Wrapper';
import {filler, h1, hbox, hspacer, strong, vframe, vspacer} from '@xh/hoist/cmp/layout';
import {button, logoutButton} from '@xh/hoist/desktop/cmp/button';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return wrapper({
            description: `This app uses Hoist's built-in forms-based login support.  It is a useful alternative on 
                platforms where SSO is not available or when troubleshooting or configuring authorization support.`,
            item: panel({
                width: 800,
                height: 800,
                tbar: appBar({
                    icon: Icon.user({size: '2x', prefix: 'fal'})
                }),
                item: vframe({
                    alignItems: 'center',
                    items: [
                        filler(),
                        h1('Hello,  ', strong(XH.getUsername())),
                        vspacer(10),
                        h1('Welcome to Toolbox!'),
                        vspacer(20),
                        hbox(
                            button({
                                minimal: false,
                                intent: 'primary',
                                icon: Icon.toolbox(),
                                text: 'Browse the App',
                                onClick: () => window.open('/app')
                            }),
                            hspacer(10),
                            logoutButton({minimal: false, text: 'Logout'})
                        ),
                        filler()
                    ]
                })
            })
        });
    }
});
