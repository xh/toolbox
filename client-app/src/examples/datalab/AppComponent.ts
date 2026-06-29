import {hoistCmp, uses} from '@xh/hoist/core';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {viewManager} from '@xh/hoist/desktop/cmp/viewmanager';
import {Icon} from '@xh/hoist/icon';
import {AppModel} from './AppModel';
import {dataLabPanel} from './DataLabPanel';
import '../../core/Toolbox.scss';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render() {
        return panel({
            tbar: appBar({
                icon: Icon.gauge(),
                appMenuButtonPosition: 'left',
                leftItems: [
                    viewManager({
                        model: AppModel.instance.scenarioViewManager
                    })
                ],
                rightItems: [appBarSeparator()]
            }),
            item: dataLabPanel()
        });
    }
});
