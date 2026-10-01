/**
 * Desktop-only doc -> Toolbox example tab mappings.
 *
 * Shared doc types and link/section utilities now live in `core/docs`; this file retains the
 * desktop-route example map and re-exports the shared types so existing desktop importers keep
 * resolving. Type re-exports are erased at build time and create no runtime module edge.
 */
import type {DocExampleLink} from '../../../core/docs/types';

export type {DocEntry, DocCategory, DocSourceInfo, DocExampleLink} from '../../../core/docs/types';

// ---------------------------------------------------------------------------
// Doc -> Toolbox example tab mappings (hoist-react only)
// ---------------------------------------------------------------------------
const R = 'default';

/**
 * Maps doc IDs (file paths) to relevant Toolbox example tabs. Only docs with
 * highly relevant, directly demonstrative examples are included.
 */
const DOC_EXAMPLES: Record<string, DocExampleLink[]> = {
    'cmp/grid/README.md': [
        {title: 'Standard Grid', route: `${R}.grids.standard`},
        {title: 'Tree Grid', route: `${R}.grids.tree`},
        {title: 'Column Filtering', route: `${R}.grids.columnFiltering`},
        {title: 'Inline Editing', route: `${R}.grids.inlineEditing`},
        {title: 'Zone Grid', route: `${R}.grids.zoneGrid`},
        {title: 'DataView', route: `${R}.grids.dataview`},
        {title: 'REST Editor', route: `${R}.grids.rest`}
    ],
    'cmp/form/README.md': [
        {title: 'FormModel', route: `${R}.forms.form`},
        {title: 'All Inputs', route: `${R}.forms.inputs`}
    ],
    'cmp/input/README.md': [
        {title: 'All Inputs', route: `${R}.forms.inputs`},
        {title: 'Select', route: `${R}.forms.select`},
        {title: 'Picker', route: `${R}.forms.picker`}
    ],
    'cmp/layout/README.md': [
        {title: 'HBox', route: `${R}.layout.hbox`},
        {title: 'VBox', route: `${R}.layout.vbox`}
    ],
    'cmp/tab/README.md': [{title: 'TabContainer', route: `${R}.layout.tabPanel`}],
    'desktop/cmp/panel/README.md': [
        {title: 'Panel Intro', route: `${R}.layout.intro`},
        {title: 'Toolbars', route: `${R}.layout.toolbars`},
        {title: 'Panel Sizing', route: `${R}.layout.sizing`},
        {title: 'Mask', route: `${R}.layout.mask`},
        {title: 'Loading Indicator', route: `${R}.layout.loadingIndicator`},
        {title: 'Banner', route: `${R}.layout.banner`}
    ],
    'desktop/cmp/dash/README.md': [
        {title: 'DashContainer', route: `${R}.layout.dashContainer`},
        {title: 'DashCanvas', route: `${R}.layout.dashCanvas`}
    ],
    'desktop/README.md': [
        {title: 'All Inputs', route: `${R}.forms.inputs`},
        {title: 'Select', route: `${R}.forms.select`},
        {title: 'LeftRightChooser', route: `${R}.forms.leftRightChooser`}
    ],
    'format/README.md': [
        {title: 'Date Formats', route: `${R}.other.formatDates`},
        {title: 'Number Formats', route: `${R}.other.formatNumbers`}
    ],
    'icon/README.md': [{title: 'Icons', route: `${R}.other.icons`}],
    'docs/error-handling.md': [
        {title: 'Exception Handling', route: `${R}.other.exceptionHandler`},
        {title: 'ErrorMessage', route: `${R}.other.errorMessage`}
    ],
    'docs/routing.md': [{title: 'Simple Routing', route: `${R}.other.simpleRouting`}],
    'appcontainer/README.md': [
        {title: 'App Notifications', route: `${R}.other.appNotifications`},
        {title: 'Banners', route: `${R}.other.banners`},
        {title: 'Messages', route: `${R}.other.messages`},
        {title: 'Toast', route: `${R}.other.toast`}
    ],
    'inspector/README.md': [{title: 'Inspector', route: `${R}.other.inspector`}],
    'cmp/README.md': [
        {title: 'Standard Grid', route: `${R}.grids.standard`},
        {title: 'FormModel', route: `${R}.forms.form`},
        {title: 'DataView', route: `${R}.grids.dataview`}
    ],
    'data/README.md': [
        {title: 'Standard Grid', route: `${R}.grids.standard`},
        {title: 'Tree Grid', route: `${R}.grids.tree`}
    ],
    'cmp/viewmanager/README.md': [{title: 'Standard Grid', route: `${R}.grids.standard`}],
    'core/README.md': [{title: 'Factories vs. JSX', route: `${R}.other.jsx`}],
    'mobile/README.md': [{title: 'Mobile', route: `${R}.mobile`}]
};

/** Get example links for a given doc, or an empty array if none. */
export function getDocExamples(docId: string): DocExampleLink[] {
    return DOC_EXAMPLES[docId] ?? [];
}
