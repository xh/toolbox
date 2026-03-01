import {hoistCmp, uses} from '@xh/hoist/core';
import {frame, hframe} from '@xh/hoist/cmp/layout';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {dashCanvas, dashCanvasWidgetChooser} from '@xh/hoist/desktop/cmp/dash';
import {viewManager} from '@xh/hoist/desktop/cmp/viewmanager';
import {Icon} from '@xh/hoist/icon';
import {sparklesIcon} from './Icons';
import {AppModel} from './AppModel';
import {jsonHarnessPanel} from './harness/JsonHarnessPanel';
import {chatHarnessPanel} from './harness/ChatHarnessPanel';
import '../../core/Toolbox.scss';
import './WeatherV2.scss';

export const AppComponent = hoistCmp({
    displayName: 'App',
    model: uses(AppModel),

    render({model}) {
        const {weatherV2DashModel, showJsonHarness, showChatHarness, showWidgetChooser} = model,
            showHarness = showChatHarness || showJsonHarness || showWidgetChooser;

        return panel({
            tbar: appBar({
                icon: Icon.sun({size: '2x', prefix: 'fal'}),
                title: 'Weather V2',
                leftItems: [viewManager()],
                rightItems: [
                    button({
                        testId: 'chat-btn',
                        icon: sparklesIcon(),
                        text: 'Dashboard Agent',
                        active: showChatHarness,
                        outlined: true,
                        intent: 'primary',
                        onClick: () => (model.showChatHarness = !showChatHarness)
                    }),
                    button({
                        testId: 'json-btn',
                        icon: Icon.json(),
                        text: 'JSON',
                        active: showJsonHarness,
                        outlined: true,
                        intent: 'primary',
                        onClick: () => (model.showJsonHarness = !showJsonHarness)
                    }),
                    button({
                        testId: 'widget-chooser-btn',
                        icon: Icon.boxFull(),
                        text: 'Widgets',
                        active: showWidgetChooser,
                        outlined: true,
                        intent: 'primary',
                        onClick: () => (model.showWidgetChooser = !showWidgetChooser)
                    }),
                    appBarSeparator()
                ],
                appMenuButtonProps: {hideLogoutItem: false}
            }),
            item: hframe(
                frame(dashCanvas({model: weatherV2DashModel.dashCanvasModel})),
                panel({
                    model: model.harnessPanelModel,
                    items: [
                        showChatHarness ? chatHarnessPanel({flex: 1}) : null,
                        showJsonHarness ? jsonHarnessPanel({flex: 1}) : null,
                        showWidgetChooser
                            ? panel({
                                  testId: 'widget-chooser-panel',
                                  title: 'Widget Chooser',
                                  icon: Icon.boxFull(),
                                  compactHeader: true,
                                  flex: 1,
                                  item: dashCanvasWidgetChooser({
                                      dashCanvasModel: weatherV2DashModel.dashCanvasModel
                                  })
                              })
                            : null
                    ],
                    omit: !showHarness
                })
            ),
            className: 'weather-v2-app'
        });
    }
});
