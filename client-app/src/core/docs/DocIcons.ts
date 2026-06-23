import {library} from '@fortawesome/fontawesome-svg-core';
import {faReact} from '@fortawesome/free-brands-svg-icons';
import {Icon} from '@xh/hoist/icon';
import {ReactElement} from 'react';

// Register the React brand icon used for the hoist-react source (brand glyphs are opt-in).
library.add(faReact);

/**
 * Shared icon helpers for the documentation viewer, used by both the desktop tree-grid nav and the
 * mobile drill-down screens so a given doc source / category always reads with the same glyph.
 */

/** Icon for a documentation source (corpus). */
export function getSourceIcon(source: string): ReactElement {
    switch (source) {
        case 'hoist-react':
            return Icon.icon({iconName: 'react', prefix: 'fab'});
        case 'hoist-core':
            return Icon.server();
        default:
            return Icon.folder();
    }
}

/** Icon for a documentation category, keyed by the category id from the registry. */
export function getCategoryIcon(categoryId: string): ReactElement {
    switch (categoryId) {
        case 'app-development':
            return Icon.code();
        case 'components':
            return Icon.gridPanel();
        case 'concepts':
            return Icon.book();
        case 'core':
            return Icon.gear();
        case 'core-features':
            return Icon.boxFull();
        case 'core-framework':
            return Icon.gear();
        case 'desktop':
            return Icon.desktop();
        case 'devops':
            return Icon.server();
        case 'grails-platform':
            return Icon.database();
        case 'infrastructure':
            return Icon.server();
        case 'mobile':
            return Icon.mobile();
        case 'overview':
            return Icon.home();
        case 'supporting':
            return Icon.cube();
        case 'upgrade':
            return Icon.arrowUp();
        case 'utilities':
            return Icon.wrench();
        default:
            return Icon.folder();
    }
}
