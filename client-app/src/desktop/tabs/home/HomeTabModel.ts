import {br, fragment} from '@xh/hoist/cmp/layout';
import {managed, HoistModel, XH} from '@xh/hoist/core';
import {DashContainerModel} from '@xh/hoist/desktop/cmp/dash';
import {Icon} from '@xh/hoist/icon';
import {aboutToolboxWidget} from './widgets/AboutToolboxWidget';
import {activityWidget} from './widgets/activity/ActivityWidget';
import {roadmapWidget} from './widgets/roadmap/RoadmapWidget';
import {welcomeWidget} from './widgets/WelcomeWidget';

export class HomeTabModel extends HoistModel {
    @managed
    dashModel;

    constructor() {
        super();
        this.dashModel = new DashContainerModel({
            persistWith: {localStorageKey: 'homeDashboard'},
            showMenuButton: true,
            initialState: [
                {
                    type: 'row',
                    content: [
                        {
                            type: 'column',
                            width: '850px',
                            content: [
                                {
                                    type: 'stack',
                                    height: '350px',
                                    content: [
                                        {type: 'view', viewSpecId: 'welcome', height: '370px'}
                                    ]
                                },
                                {
                                    type: 'row',
                                    content: [
                                        {
                                            type: 'stack',
                                            width: '350px',
                                            content: [{type: 'view', viewSpecId: 'about'}]
                                        },
                                        {
                                            type: 'stack',
                                            content: [{type: 'view', viewSpecId: 'roadmap'}]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            type: 'stack',
                            content: [{type: 'view', viewSpecId: 'activity'}]
                        }
                    ]
                }
            ],
            viewSpecs: [
                {
                    id: 'welcome',
                    title: 'Welcome',
                    unique: true,
                    content: welcomeWidget,
                    icon: Icon.home()
                },
                {
                    id: 'about',
                    title: 'About Toolbox',
                    unique: true,
                    content: aboutToolboxWidget,
                    icon: Icon.info()
                },
                {
                    id: 'roadmap',
                    title: 'Hoist Roadmap',
                    unique: true,
                    content: roadmapWidget,
                    icon: Icon.mapSigns()
                },
                {
                    id: 'activity',
                    title: 'Hoist Commits',
                    content: activityWidget,
                    icon: Icon.icon({iconName: 'github', prefix: 'fab'})
                }
            ],
            extraMenuItems: [
                {
                    text: 'Restore Default Layout',
                    icon: Icon.reset(),
                    actionFn: () => this.restoreDefaultsAsync()
                }
            ]
        });
    }

    private async restoreDefaultsAsync() {
        const confirmed = await XH.confirm({
            title: 'Please confirm...',
            message: fragment(
                'This will reset your home dashboard to its default settings, including any widget and grid customizations.',
                br(),
                br(),
                'Are you sure you wish to continue?'
            ),
            confirmProps: {text: 'Yes, restore defaults'}
        });

        if (confirmed) await this.dashModel.restoreDefaultsAsync();
    }
}
