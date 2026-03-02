import {hoistCmp, uses} from '@xh/hoist/core';
import {frame, hframe} from '@xh/hoist/cmp/layout';
import {appBar, appBarSeparator} from '@xh/hoist/desktop/cmp/appbar';
import {button, dashCanvasAddViewButton} from '@xh/hoist/desktop/cmp/button';
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
        const {
                weatherViewManager,
                weatherV2DashModel,
                manualEditingEnabled,
                showJsonHarness,
                showChatHarness,
                showWidgetChooser
            } = model,
            {dashCanvasModel} = weatherV2DashModel,
            activeWidgetChooser = showWidgetChooser && manualEditingEnabled,
            showHarness = showChatHarness || showJsonHarness || activeWidgetChooser;

        return panel({
            tbar: appBar({
                icon: Icon.sun({size: '2x', prefix: 'fal'}),
                title: 'Weather V2',
                rightItems: [
                    viewManager({model: weatherViewManager}),
                    appBarSeparator(),
                    button({
                        testId: 'manual-editing-btn',
                        icon: Icon.edit(),
                        text: 'Manual Editing',
                        active: manualEditingEnabled,
                        outlined: true,
                        intent: manualEditingEnabled ? 'primary' : undefined,
                        onClick: () => (model.manualEditingEnabled = !manualEditingEnabled)
                    }),
                    dashCanvasAddViewButton({
                        dashCanvasModel,
                        rightIcon: Icon.chevronDown(),
                        outlined: true,
                        disabled: !manualEditingEnabled
                    }),
                    appBarSeparator(),
                    button({
                        testId: 'chat-btn',
                        icon: sparklesIcon(),
                        text: 'Dashboard Agent',
                        active: showChatHarness,
                        outlined: true,
                        intent: showChatHarness ? 'primary' : undefined,
                        onClick: () => (model.showChatHarness = !showChatHarness)
                    }),
                    button({
                        testId: 'json-btn',
                        icon: Icon.json(),
                        text: 'JSON',
                        active: showJsonHarness,
                        outlined: true,
                        intent: showJsonHarness ? 'primary' : undefined,
                        onClick: () => (model.showJsonHarness = !showJsonHarness)
                    }),
                    button({
                        testId: 'widget-chooser-btn',
                        icon: Icon.boxFull(),
                        text: 'Widgets',
                        active: showWidgetChooser,
                        outlined: true,
                        intent: activeWidgetChooser ? 'primary' : undefined,
                        disabled: !manualEditingEnabled,
                        onClick: () => (model.showWidgetChooser = !showWidgetChooser)
                    }),
                    appBarSeparator()
                ],
                appMenuButtonProps: {hideLogoutItem: false}
            }),
            item: hframe(
                frame(dashCanvas({model: dashCanvasModel})),
                panel({
                    model: model.harnessPanelModel,
                    items: [
                        showChatHarness ? chatHarnessPanel() : null,
                        showJsonHarness ? jsonHarnessPanel() : null,
                        activeWidgetChooser
                            ? panel({
                                  testId: 'widget-chooser-panel',
                                  title: 'Widget Chooser',
                                  icon: Icon.boxFull(),
                                  compactHeader: true,
                                  flex: 1,
                                  minHeight: 0,
                                  item: dashCanvasWidgetChooser({dashCanvasModel})
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
