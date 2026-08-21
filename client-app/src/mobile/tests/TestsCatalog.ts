import {Content, XH} from '@xh/hoist/core';
import {Icon} from '@xh/hoist/icon';
import {ReactElement} from 'react';
import {selectTestPage} from './select/SelectTestPage';

/**
 * A mobile test harness - the single source for its Navigator page, its route, and its nav blade
 * entry, so adding a test requires only an entry here plus its page.
 */
export interface MobileTestSpec {
    /** Navigator page id and route name segment - must be unique across all mobile pages. */
    id: string;
    /** Path segment, mounted under `/tests`. */
    path: string;
    /** Nav blade label, also used as the app bar title. */
    title: string;
    icon: ReactElement;
    content: Content;
}

const TESTS: MobileTestSpec[] = [
    {
        id: 'selectTest',
        path: 'select',
        title: 'Select',
        icon: Icon.chevronDown(),
        content: selectTestPage
    }
];

/**
 * Test harnesses available to the current user, gated on the same role their server-side endpoints
 * require. Generates both the routes and nav blade from a single spec to keep them consistent.
 *
 * Hidden from non-admin-reader users.
 */
export function mobileTests(): MobileTestSpec[] {
    return XH.getUser()?.isHoistAdminReader ? TESTS : [];
}
