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
        {title: 'REST Editor', route: `${R}.grids.rest`},
        {title: 'StoreFilterField', route: `${R}.grids.storeFilterField`},
        {title: 'GridFindField', route: `${R}.grids.gridFindField`}
    ],
    'cmp/daterange/README.md': [
        {title: 'DateRangePicker', route: `${R}.components.dateRangePicker`}
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
        {title: 'LeftRightChooser', route: `${R}.components.leftRightChooser`}
    ],
    'format/README.md': [
        {title: 'Date Formats', route: `${R}.system.formatDates`},
        {title: 'Number Formats', route: `${R}.system.formatNumbers`}
    ],
    'icon/README.md': [{title: 'Icons', route: `${R}.components.icons`}],
    'docs/error-handling.md': [
        {title: 'Exception Handling', route: `${R}.system.exceptionHandler`},
        {title: 'ErrorMessage', route: `${R}.components.errorMessage`}
    ],
    'docs/routing.md': [{title: 'Simple Routing', route: `${R}.system.simpleRouting`}],
    'appcontainer/README.md': [
        {title: 'Updates & Idle', route: `${R}.system.updatesIdle`},
        {title: 'Banners', route: `${R}.system.banners`},
        {title: 'Messages', route: `${R}.system.messages`},
        {title: 'Toast', route: `${R}.system.toast`}
    ],
    'inspector/README.md': [{title: 'Inspector', route: `${R}.system.inspector`}],
    'cmp/README.md': [
        {title: 'Standard Grid', route: `${R}.grids.standard`},
        {title: 'FormModel', route: `${R}.forms.form`},
        {title: 'DataView', route: `${R}.grids.dataview`}
    ],
    'data/README.md': [
        {title: 'Standard Grid', route: `${R}.grids.standard`},
        {title: 'Tree Grid', route: `${R}.grids.tree`},
        {title: 'FilterChooser', route: `${R}.grids.filterChooser`},
        {title: 'GroupingChooser', route: `${R}.grids.groupingChooser`}
    ],
    'cmp/viewmanager/README.md': [{title: 'Standard Grid', route: `${R}.grids.standard`}],
    'core/README.md': [{title: 'Factories vs. JSX', route: `${R}.system.jsx`}],
    'mobile/README.md': [{title: 'Mobile', route: `${R}.mobile`}]
};

/** Get example links for a given doc, or an empty array if none. */
export function getDocExamples(docId: string): DocExampleLink[] {
    return DOC_EXAMPLES[docId] ?? [];
}
