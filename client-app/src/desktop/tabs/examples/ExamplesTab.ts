import {div, filler, frame, hframe, iframe} from '@xh/hoist/cmp/layout';
import {creates, hoistCmp} from '@xh/hoist/core';
import {button} from '@xh/hoist/desktop/cmp/button';
import {panel} from '@xh/hoist/desktop/cmp/panel';
import {toolbar} from '@xh/hoist/desktop/cmp/toolbar';
import {Icon} from '@xh/hoist/icon';
import {toolboxUrl} from '../../../core/cmp/ToolboxLink';
import './ExamplesTab.scss';
import {ExamplesTabModel} from './ExamplesTabModel';

export const examplesTab = hoistCmp.factory({
    displayName: 'ExamplesTab',
    model: creates(ExamplesTabModel),

    render({model}) {
        return panel({
            className: 'tb-examples',
            items: [
                hframe({
                    items: [
                        sideBar({
                            omit: !model.leftPanelModel.collapsed
                        }),
                        appTileBar(),
                        activeAppDisplay()
                    ]
                })
            ]
        });
    }
});

const activeAppDisplay = hoistCmp.factory<ExamplesTabModel>({
    render({model}) {
        const {activeAppConfig} = model;
        if (!activeAppConfig) return null;

        return frame({
            className: 'tb-examples__app-frame xh-tiled-bg',
            item: iframe({
                height: '100%',
                width: '100%',
                className: 'app-frame',
                src: `${window.location.origin}/${activeAppConfig.path}/`
            })
        });
    }
});

const appTileBar = hoistCmp.factory<ExamplesTabModel>(({model}) => {
    const {leftPanelModel} = model;

    return panel({
        model: leftPanelModel,
        items: div({
            className: 'tb-examples__app-tile-container',
            items: model.examples.map(app => appTile({app}))
        }),
        bbar: [
            filler(),
            button({
                icon: Icon.chevronLeft(),
                onClick: () => leftPanelModel.toggleCollapsed()
            })
        ]
    });
});

const appTile = hoistCmp.factory<ExamplesTabModel>(({app, model}) => {
    const isActive = app === model.activeAppConfig;
    return panel({
        className: `tb-examples__app-tile ${isActive ? 'tb-examples__app-tile--selected' : ''}`,
        title: app.title,
        icon: app.icon,
        compactHeader: true,
        items: div({
            className: 'tb-examples__app-tile__contents',
            items: app.text
        }),
        bbar: toolbar({
            omit: !isActive,
            compact: true,
            items: [
                filler(),
                button({
                    text: 'Source',
                    icon: Icon.code(),
                    onClick: () =>
                        window.open(toolboxUrl(`$TB/client-app/src/examples/${app.srcPath}`))
                }),
                button({
                    text: 'Full Tab',
                    icon: Icon.openExternal(),
                    onClick: () => window.open(`/${app.path}/`)
                })
            ]
        }),
        onClick: () => (model.activeApp = app.title)
    });
});

const sideBar = hoistCmp.factory<ExamplesTabModel>(({model}) => {
    return toolbar({
        className: 'tb-examples__app-toolbar',
        items: [
            ...model.examples.map(app => {
                const isActive = model.activeAppConfig === app;
                return button({
                    icon: app.icon,
                    active: isActive,
                    onClick: () =>
                        isActive ? window.open(app.path) : (model.activeApp = app.title)
                });
            }),
            filler(),
            button({
                icon: Icon.chevronRight(),
                onClick: () => (model.leftPanelModel.collapsed = false)
            })
        ],
        vertical: true
    });
});
