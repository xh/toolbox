import {ElementFactory} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {ReactElement} from 'react';
import {commitsWidget} from './CommitsWidget';
import {feedbackWidget} from './FeedbackWidget';
import {meetXhWidget} from './MeetXhWidget';
import {releasesWidget} from './ReleasesWidget';
import {startHereWidget} from './StartHereWidget';
import {welcomeWidget} from './WelcomeWidget';

/** Definition of a single mobile home-dashboard widget. */
export interface WidgetSpec {
    /** Stable id, persisted in membership/order/collapsed state. */
    id: string;
    /** Title shown in the card header and the Manage-widgets sheet. */
    title: string;
    /** Icon shown beside the title. */
    icon: ReactElement;
    /** Content factory rendered inside the card body. */
    content: ElementFactory;
}

/**
 * The catalog of widgets available on the mobile home dashboard, mirroring the desktop HomeTab set.
 * Order here defines the default home stack for a user with no saved customization.
 */
export const WIDGETS: WidgetSpec[] = [
    {id: 'welcome', title: 'Welcome', icon: Icon.home(), content: welcomeWidget},
    {id: 'startHere', title: 'Start Here', icon: Icon.flag(), content: startHereWidget},
    {id: 'releases', title: 'Hoist Releases', icon: Icon.tag(), content: releasesWidget},
    {
        id: 'commits',
        title: 'Recent Commits',
        icon: Icon.icon({iconName: 'github', prefix: 'fab'}),
        content: commitsWidget
    },
    {id: 'meetXh', title: 'Meet XH', icon: Icon.users(), content: meetXhWidget},
    {id: 'feedback', title: 'Enjoying Hoist?', icon: Icon.comment(), content: feedbackWidget}
];

export const DEFAULT_WIDGET_IDS: string[] = WIDGETS.map(w => w.id);

export function widgetSpec(id: string): WidgetSpec {
    return WIDGETS.find(w => w.id === id);
}
