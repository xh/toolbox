import {br, fragment} from '@xh/hoist/cmp/layout';
import {managed, HoistModel, XH} from '@xh/hoist/core';
import {DashCanvasModel} from '@xh/hoist/desktop/cmp/dash';
import {Icon} from '@xh/hoist/icon';
import {underTheHoodWidget} from './widgets/UnderTheHoodWidget';
import {activityWidget} from './widgets/activity/ActivityWidget';
import {feedbackWidget} from './widgets/feedback/FeedbackWidget';
import {meetXhWidget} from './widgets/meetxh/MeetXhWidget';
import {releasesWidget} from './widgets/releases/ReleasesWidget';
import {startHereWidget} from './widgets/StartHereWidget';
import {welcomeWidget} from './widgets/WelcomeWidget';

export class HomeTabModel extends HoistModel {
    @managed
    dashModel: DashCanvasModel;

    constructor() {
        super();
        this.dashModel = new DashCanvasModel({
            persistWith: {localStorageKey: 'homeDashCanvas'},
            columns: 12,
            rowHeight: 50,
            compact: 'vertical',
            margin: [12, 12],
            containerPadding: [16, 16],
            viewSpecDefaults: {unique: true},
            viewSpecs: [
                {
                    id: 'welcome',
                    title: 'Welcome',
                    icon: Icon.home(),
                    content: welcomeWidget,
                    hidePanelHeader: true
                },
                {
                    id: 'startHere',
                    title: 'Start Here',
                    icon: Icon.mapSigns(),
                    content: startHereWidget
                },
                {
                    id: 'underTheHood',
                    title: 'Under the Hood',
                    icon: Icon.info(),
                    content: underTheHoodWidget
                },
                {
                    id: 'activity',
                    title: 'Hoist Commits',
                    icon: Icon.icon({iconName: 'github', prefix: 'fab'}),
                    content: activityWidget
                },
                {
                    id: 'releases',
                    title: 'Hoist Releases',
                    icon: Icon.tag(),
                    content: releasesWidget
                },
                {
                    id: 'meetXh',
                    title: 'Meet XH',
                    icon: Icon.users(),
                    content: meetXhWidget
                },
                {
                    id: 'feedback',
                    title: 'Enjoying Hoist?',
                    icon: Icon.comment(),
                    content: feedbackWidget,
                    hidePanelHeader: true
                }
            ],
            initialState: [
                {viewSpecId: 'welcome', layout: {x: 0, y: 0, w: 7, h: 6}},
                {viewSpecId: 'startHere', layout: {x: 7, y: 0, w: 5, h: 6}},
                {viewSpecId: 'underTheHood', layout: {x: 0, y: 6, w: 4, h: 7}},
                {viewSpecId: 'releases', layout: {x: 4, y: 6, w: 4, h: 7}},
                {viewSpecId: 'activity', layout: {x: 8, y: 6, w: 4, h: 7}},
                {viewSpecId: 'meetXh', layout: {x: 0, y: 13, w: 5, h: 5}},
                {viewSpecId: 'feedback', layout: {x: 9, y: 13, w: 3, h: 5}}
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
                'This will reset your home dashboard to its default layout, including any widget customizations.',
                br(),
                br(),
                'Are you sure you wish to continue?'
            ),
            confirmProps: {text: 'Yes, restore defaults'}
        });

        if (confirmed) this.dashModel.restoreDefaults();
    }
}
