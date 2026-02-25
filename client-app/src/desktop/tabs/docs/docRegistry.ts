/**
 * Registry of all hoist-react documentation files with metadata.
 *
 * Each markdown file is imported via webpack's file-loader, which emits the file
 * to the build output and returns a URL. Content is fetched at runtime when a
 * user selects a doc for viewing.
 */

// ---------------------------------------------------------------------------
// Package READMEs
// ---------------------------------------------------------------------------
import rootReadmeUrl from '@xh/hoist/README.md';
import coreUrl from '@xh/hoist/core/README.md';
import dataUrl from '@xh/hoist/data/README.md';
import svcUrl from '@xh/hoist/svc/README.md';
import cmpUrl from '@xh/hoist/cmp/README.md';
import gridUrl from '@xh/hoist/cmp/grid/README.md';
import formUrl from '@xh/hoist/cmp/form/README.md';
import inputUrl from '@xh/hoist/cmp/input/README.md';
import layoutUrl from '@xh/hoist/cmp/layout/README.md';
import tabUrl from '@xh/hoist/cmp/tab/README.md';
import viewManagerUrl from '@xh/hoist/cmp/viewmanager/README.md';
import desktopUrl from '@xh/hoist/desktop/README.md';
import dashUrl from '@xh/hoist/desktop/cmp/dash/README.md';
import panelUrl from '@xh/hoist/desktop/cmp/panel/README.md';
import mobileUrl from '@xh/hoist/mobile/README.md';
import appContainerUrl from '@xh/hoist/appcontainer/README.md';
import formatUrl from '@xh/hoist/format/README.md';
import iconUrl from '@xh/hoist/icon/README.md';
import inspectorUrl from '@xh/hoist/inspector/README.md';
import kitUrl from '@xh/hoist/kit/README.md';
import mobxUrl from '@xh/hoist/mobx/README.md';
import promiseUrl from '@xh/hoist/promise/README.md';
import securityUrl from '@xh/hoist/security/README.md';
import utilsUrl from '@xh/hoist/utils/README.md';
import mcpUrl from '@xh/hoist/mcp/README.md';

// ---------------------------------------------------------------------------
// Docs index
// ---------------------------------------------------------------------------
import docsIndexUrl from '@xh/hoist/docs/README.md';

// ---------------------------------------------------------------------------
// Concept docs
// ---------------------------------------------------------------------------
import authenticationUrl from '@xh/hoist/docs/authentication.md';
import authorizationUrl from '@xh/hoist/docs/authorization.md';
import codingConventionsUrl from '@xh/hoist/docs/coding-conventions.md';
import errorHandlingUrl from '@xh/hoist/docs/error-handling.md';
import lifecycleAppUrl from '@xh/hoist/docs/lifecycle-app.md';
import lifecycleModelsUrl from '@xh/hoist/docs/lifecycle-models-and-services.md';
import persistenceUrl from '@xh/hoist/docs/persistence.md';
import routingUrl from '@xh/hoist/docs/routing.md';
import testAutomationUrl from '@xh/hoist/docs/test-automation.md';
import versionCompatibilityUrl from '@xh/hoist/docs/version-compatibility.md';

// ---------------------------------------------------------------------------
// DevOps docs
// ---------------------------------------------------------------------------
import buildDeployUrl from '@xh/hoist/docs/build-and-deploy.md';
import changelogFormatUrl from '@xh/hoist/docs/changelog-format.md';
import compilationNotesUrl from '@xh/hoist/docs/compilation-notes.md';
import devEnvironmentUrl from '@xh/hoist/docs/development-environment.md';

// ---------------------------------------------------------------------------
// Upgrade notes
// ---------------------------------------------------------------------------
import v78UpgradeUrl from '@xh/hoist/docs/upgrade-notes/v78-upgrade-notes.md';
import v79UpgradeUrl from '@xh/hoist/docs/upgrade-notes/v79-upgrade-notes.md';
import v80UpgradeUrl from '@xh/hoist/docs/upgrade-notes/v80-upgrade-notes.md';
import v81UpgradeUrl from '@xh/hoist/docs/upgrade-notes/v81-upgrade-notes.md';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface DocEntry {
    id: string;
    title: string;
    category: string;
    description: string;
    url: string;
    /** Path relative to hoist-react root, used for resolving inter-doc links. */
    sourcePath: string;
    keyTopics: string[];
}

export interface DocCategory {
    id: string;
    title: string;
}

export interface DocExampleLink {
    title: string;
    /** Full Router5 route name, e.g. 'default.grids.standard'. */
    route: string;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export const DOC_CATEGORIES: DocCategory[] = [
    {id: 'overview', title: 'Overview'},
    {id: 'concepts', title: 'Concepts'},
    {id: 'core', title: 'Core Framework'},
    {id: 'components', title: 'Components'},
    {id: 'desktop', title: 'Desktop'},
    {id: 'mobile', title: 'Mobile'},
    {id: 'utilities', title: 'Utilities'},
    {id: 'supporting', title: 'Supporting Packages'},
    {id: 'devops', title: 'DevOps & Environment'},
    {id: 'upgrade', title: 'Upgrade Notes'}
];

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------
export const DOC_REGISTRY: DocEntry[] = [
    // Overview
    {
        id: 'hoist-react',
        title: 'Hoist React',
        category: 'overview',
        description: 'Full-stack UI framework built on React and MobX',
        url: rootReadmeUrl,
        sourcePath: 'README.md',
        keyTopics: ['overview', 'getting started', 'architecture', 'element factories']
    },
    {
        id: 'docs-index',
        title: 'Documentation Index',
        category: 'overview',
        description: 'Primary catalog for all hoist-react documentation',
        url: docsIndexUrl,
        sourcePath: 'docs/README.md',
        keyTopics: ['index', 'quick reference', 'catalog']
    },
    {
        id: 'coding-conventions',
        title: 'Coding Conventions',
        category: 'overview',
        description: 'Code style, naming, class structure, component and async patterns',
        url: codingConventionsUrl,
        sourcePath: 'docs/coding-conventions.md',
        keyTopics: [
            'conventions',
            'code style',
            'imports',
            'import ordering',
            'named imports',
            'barrel exports',
            'TypeScript',
            'interface vs type',
            'declare config',
            'override',
            'readonly',
            'naming',
            'PascalCase',
            'camelCase',
            'Async suffix',
            'class structure',
            'member ordering',
            'section dividers',
            'constructor pattern',
            'hoistCmp',
            'withFactory',
            'factory',
            'model binding',
            'displayName',
            'element factories',
            'JSX',
            'null',
            'undefined',
            '== null',
            'withDefault',
            'async/await',
            'catchDefault',
            'return await',
            'XH.handleException',
            'throwIf',
            'logging',
            'logInfo',
            'withDebug',
            'CSS',
            'BEM',
            'xh- prefix',
            'CSS variables',
            'lodash',
            'TSDoc'
        ]
    },

    // Core Framework
    {
        id: 'core',
        title: 'Core',
        category: 'core',
        description: 'Foundation classes: components, models, services, XH singleton',
        url: coreUrl,
        sourcePath: 'core/README.md',
        keyTopics: [
            'HoistBase',
            'HoistModel',
            'HoistService',
            'HoistAppModel',
            'hoistCmp',
            'XH',
            'element factories',
            'decorators',
            'lifecycle',
            '@managed',
            '@lookup',
            'creates',
            'uses',
            'addReaction',
            'lookupModel'
        ]
    },
    {
        id: 'data',
        title: 'Data',
        category: 'core',
        description: 'Observable data layer with filtering, validation, and aggregation',
        url: dataUrl,
        sourcePath: 'data/README.md',
        keyTopics: [
            'Store',
            'StoreRecord',
            'Field',
            'Filter',
            'FilterChooserModel',
            'FilterFieldSpec',
            'Cube',
            'View',
            'tree data',
            'loadData',
            'processRawData'
        ]
    },
    {
        id: 'svc',
        title: 'Services',
        category: 'core',
        description: 'Built-in singleton services for data access and app-wide operations',
        url: svcUrl,
        sourcePath: 'svc/README.md',
        keyTopics: [
            'FetchService',
            'ConfigService',
            'PrefService',
            'IdentityService',
            'TrackService',
            'WebSocketService',
            'JsonBlobService',
            'GridExportService',
            'GridAutosizeService',
            'IdleService',
            'AutoRefreshService',
            'EnvironmentService'
        ]
    },

    // Components
    {
        id: 'cmp',
        title: 'Components Overview',
        category: 'components',
        description: 'Cross-platform component overview and catalog',
        url: cmpUrl,
        sourcePath: 'cmp/README.md',
        keyTopics: [
            'component categories',
            'factory pattern',
            'DataView',
            'DataViewModel',
            'Treemap',
            'ZoneGrid',
            'Badge',
            'Spinner',
            'LoadingIndicator',
            'RelativeTimestamp',
            'Markdown'
        ]
    },
    {
        id: 'grid',
        title: 'Grid',
        category: 'components',
        description: 'Primary data grid built on ag-Grid',
        url: gridUrl,
        sourcePath: 'cmp/grid/README.md',
        keyTopics: [
            'GridModel',
            'Column',
            'ColumnGroup',
            'sorting',
            'grouping',
            'filtering',
            'selection',
            'inline editing',
            'export',
            'tree grid',
            'GridFilterModel',
            'ag-Grid',
            'column chooser',
            'context menu'
        ]
    },
    {
        id: 'form',
        title: 'Form',
        category: 'components',
        description: 'Form infrastructure for data entry with validation',
        url: formUrl,
        sourcePath: 'cmp/form/README.md',
        keyTopics: [
            'FormModel',
            'FieldModel',
            'SubformsFieldModel',
            'validation rules',
            'data binding'
        ]
    },
    {
        id: 'input',
        title: 'Input',
        category: 'components',
        description: 'Base classes and interfaces for input components',
        url: inputUrl,
        sourcePath: 'cmp/input/README.md',
        keyTopics: [
            'HoistInputModel',
            'HoistInputProps',
            'change/commit lifecycle',
            'commitOnChange',
            'value binding',
            'focus management',
            'Select',
            'TextInput',
            'DateInput',
            'NumberInput',
            'Checkbox',
            'SwitchInput'
        ]
    },
    {
        id: 'layout',
        title: 'Layout',
        category: 'components',
        description: 'Flexbox-based layout containers',
        url: layoutUrl,
        sourcePath: 'cmp/layout/README.md',
        keyTopics: ['Box', 'VBox', 'HBox', 'Frame', 'Viewport', 'LayoutProps']
    },
    {
        id: 'tab',
        title: 'Tab',
        category: 'components',
        description: 'Tabbed interface system',
        url: tabUrl,
        sourcePath: 'cmp/tab/README.md',
        keyTopics: [
            'TabContainerModel',
            'TabModel',
            'routing integration',
            'renderMode',
            'refreshMode',
            'RefreshContextModel',
            'dynamic tabs'
        ]
    },
    {
        id: 'viewmanager',
        title: 'View Manager',
        category: 'components',
        description: 'Save/load named bundles of component state',
        url: viewManagerUrl,
        sourcePath: 'cmp/viewmanager/README.md',
        keyTopics: [
            'ViewManagerModel',
            'views',
            'sharing',
            'pinning',
            'auto-save',
            'JsonBlob persistence'
        ]
    },

    // Desktop
    {
        id: 'desktop',
        title: 'Desktop',
        category: 'desktop',
        description: 'Desktop-specific components and app container',
        url: desktopUrl,
        sourcePath: 'desktop/README.md',
        keyTopics: [
            'desktop components',
            'Blueprint wrappers',
            'Select',
            'DateInput',
            'NumberInput',
            'TextArea',
            'Picker',
            'Checkbox',
            'SwitchInput',
            'RadioInput',
            'Slider',
            'CodeInput',
            'JsonInput',
            'LeftRightChooser',
            'dropdown'
        ]
    },
    {
        id: 'panel',
        title: 'Panel',
        category: 'desktop',
        description: 'Desktop panel container with toolbars, masks, and collapsible behavior',
        url: panelUrl,
        sourcePath: 'desktop/cmp/panel/README.md',
        keyTopics: [
            'Panel',
            'PanelModel',
            'Toolbar',
            'mask',
            'loading indicator',
            'collapse/resize',
            'persistence',
            'modal support',
            'splitter',
            'compactHeader'
        ]
    },
    {
        id: 'dash',
        title: 'Dashboard',
        category: 'desktop',
        description: 'Configurable dashboard system with draggable, resizable widgets',
        url: dashUrl,
        sourcePath: 'desktop/cmp/dash/README.md',
        keyTopics: [
            'DashContainerModel',
            'DashCanvasModel',
            'DashViewSpec',
            'DashViewModel',
            'widget persistence'
        ]
    },

    // Mobile
    {
        id: 'mobile',
        title: 'Mobile',
        category: 'mobile',
        description: 'Mobile-specific components built on Onsen UI',
        url: mobileUrl,
        sourcePath: 'mobile/README.md',
        keyTopics: [
            'AppContainer',
            'NavigatorModel',
            'Panel',
            'AppBar',
            'mobile inputs',
            'touch navigation',
            'swipeable tabs',
            'DialogPanel',
            'pull to refresh'
        ]
    },

    // Utilities
    {
        id: 'format',
        title: 'Format',
        category: 'utilities',
        description: 'Number, date, and miscellaneous formatting for grids and display',
        url: formatUrl,
        sourcePath: 'format/README.md',
        keyTopics: [
            'fmtNumber',
            'fmtPercent',
            'fmtMillions',
            'fmtDate',
            'fmtThousands',
            'numberRenderer',
            'dateRenderer',
            'ledger',
            'colorSpec',
            'column renderer',
            'currency'
        ]
    },
    {
        id: 'appcontainer',
        title: 'App Container',
        category: 'utilities',
        description: 'Application shell: lifecycle, dialogs, toasts, banners, theming',
        url: appContainerUrl,
        sourcePath: 'appcontainer/README.md',
        keyTopics: [
            'AppContainerModel',
            'MessageSpec',
            'ToastSpec',
            'BannerSpec',
            'ThemeModel',
            'RouterModel',
            'AppOption',
            'dark mode',
            'light mode',
            'theming',
            'ExceptionDialogModel',
            'SizingModeModel',
            'XH.toast',
            'XH.confirm',
            'XH.alert'
        ]
    },
    {
        id: 'utils',
        title: 'Utils',
        category: 'utilities',
        description: 'Async, datetime, JS, and React utility functions',
        url: utilsUrl,
        sourcePath: 'utils/README.md',
        keyTopics: [
            'Timer',
            'LocalDate',
            'forEachAsync',
            '@debounced',
            '@computeOnce',
            '@sharePendingPromise',
            'logging',
            'hooks'
        ]
    },
    {
        id: 'promise',
        title: 'Promise',
        category: 'utilities',
        description: 'Promise prototype extensions for error handling, tracking, masking',
        url: promiseUrl,
        sourcePath: 'promise/README.md',
        keyTopics: [
            'catchDefault',
            'catchWhen',
            'track',
            'linkTo',
            'timeout',
            'thenAction',
            'wait',
            'waitFor'
        ]
    },
    {
        id: 'mobx',
        title: 'MobX',
        category: 'utilities',
        description: 'MobX integration layer: re-exports, action enforcement, @bindable',
        url: mobxUrl,
        sourcePath: 'mobx/README.md',
        keyTopics: [
            '@bindable',
            '@bindable.ref',
            'makeObservable',
            'observer',
            'action',
            'observable',
            'computed',
            'enforceActions'
        ]
    },

    // Concepts
    {
        id: 'lifecycle-app',
        title: 'Lifecycle: App',
        category: 'concepts',
        description: 'How a Hoist app initializes from entry point to RUNNING state',
        url: lifecycleAppUrl,
        sourcePath: 'docs/lifecycle-app.md',
        keyTopics: [
            'XH.renderApp',
            'AppSpec',
            'AppContainerModel',
            'initialization sequence',
            'AppState'
        ]
    },
    {
        id: 'lifecycle-models',
        title: 'Lifecycle: Models & Services',
        category: 'concepts',
        description: 'Model, service, and load/refresh lifecycles after app startup',
        url: lifecycleModelsUrl,
        sourcePath: 'docs/lifecycle-models-and-services.md',
        keyTopics: [
            'onLinked',
            'afterLinked',
            'doLoadAsync',
            'destroy',
            'cleanup',
            'initAsync',
            'LoadSupport',
            'LoadSpec',
            'RefreshContextModel',
            '@managed',
            'loadAsync',
            'refreshAsync'
        ]
    },
    {
        id: 'authentication',
        title: 'Authentication',
        category: 'concepts',
        description: 'How Hoist apps authenticate users via OAuth or form-based login',
        url: authenticationUrl,
        sourcePath: 'docs/authentication.md',
        keyTopics: [
            'HoistAuthModel',
            'MsalClient',
            'AuthZeroClient',
            'Token',
            'IdentityService',
            'impersonation'
        ]
    },
    {
        id: 'persistence',
        title: 'Persistence',
        category: 'concepts',
        description: 'Persisting user UI state to various backing stores',
        url: persistenceUrl,
        sourcePath: 'docs/persistence.md',
        keyTopics: [
            '@persist',
            'markPersist',
            'PersistenceProvider',
            'localStorage',
            'Preference',
            'ViewManager',
            'JsonBlob',
            'DashContainerModel',
            'GridModel',
            'save state',
            'restore state'
        ]
    },
    {
        id: 'authorization',
        title: 'Authorization',
        category: 'concepts',
        description: 'Role-based authorization and config-driven feature gates',
        url: authorizationUrl,
        sourcePath: 'docs/authorization.md',
        keyTopics: [
            'HoistUser',
            'hasRole',
            'hasGate',
            'checkAccess',
            'HOIST_ADMIN',
            'roles',
            'gates'
        ]
    },
    {
        id: 'routing',
        title: 'Routing',
        category: 'concepts',
        description: 'Client-side routing via RouterModel (Router5 wrapper)',
        url: routingUrl,
        sourcePath: 'docs/routing.md',
        keyTopics: [
            'RouterModel',
            'getRoutes',
            'XH.routerState',
            'XH.navigate',
            'route parameters',
            'TabContainerModel route integration'
        ]
    },
    {
        id: 'error-handling',
        title: 'Error Handling',
        category: 'concepts',
        description: 'Centralized exception handling, display, and logging',
        url: errorHandlingUrl,
        sourcePath: 'docs/error-handling.md',
        keyTopics: [
            'XH.handleException',
            'ExceptionDialog',
            'catchDefault',
            'alertType',
            'toast',
            'requireReload',
            'error boundary',
            'exception logging'
        ]
    },
    {
        id: 'test-automation',
        title: 'Test Automation',
        category: 'concepts',
        description: 'Test automation support via testId selectors',
        url: testAutomationUrl,
        sourcePath: 'docs/test-automation.md',
        keyTopics: ['testId', 'TestSupportProps', 'data-testid', 'getTestId']
    },

    // Supporting Packages
    {
        id: 'icon',
        title: 'Icon',
        category: 'supporting',
        description: 'Factory-based icon system wrapping FontAwesome Pro',
        url: iconUrl,
        sourcePath: 'icon/README.md',
        keyTopics: [
            'Icon singleton',
            'IconProps',
            'intent coloring',
            'size variants',
            'asHtml',
            'fileIcon'
        ]
    },
    {
        id: 'security',
        title: 'Security',
        category: 'supporting',
        description: 'OAuth 2.0 client abstraction for Auth0 and Microsoft Entra ID',
        url: securityUrl,
        sourcePath: 'security/README.md',
        keyTopics: [
            'BaseOAuthClient',
            'AuthZeroClient',
            'MsalClient',
            'Token',
            'AccessTokenSpec',
            'auto-refresh'
        ]
    },
    {
        id: 'kit',
        title: 'Kit',
        category: 'components',
        description: 'Centralized wrappers for third-party libraries used by Hoist',
        url: kitUrl,
        sourcePath: 'kit/README.md',
        keyTopics: [
            'installAgGrid',
            'installHighcharts',
            'Blueprint',
            'Onsen',
            'GoldenLayout',
            'react-select'
        ]
    },
    {
        id: 'inspector',
        title: 'Inspector',
        category: 'supporting',
        description: 'Built-in developer tool for real-time inspection of Hoist instances',
        url: inspectorUrl,
        sourcePath: 'inspector/README.md',
        keyTopics: [
            'InspectorPanel',
            'StatsModel',
            'InstancesModel',
            'property watchlist',
            'model leak detection'
        ]
    },
    // DevOps & Environment
    {
        id: 'build-deploy',
        title: 'Build & Deploy',
        category: 'devops',
        description: 'CI configuration, build pipelines, and deployment considerations',
        url: buildDeployUrl,
        sourcePath: 'docs/build-and-deploy.md',
        keyTopics: ['CI', 'build', 'deploy', 'pipeline', 'Docker', 'Tomcat']
    },
    {
        id: 'dev-environment',
        title: 'Development Environment',
        category: 'devops',
        description: 'Local development environment setup for Hoist and app developers',
        url: devEnvironmentUrl,
        sourcePath: 'docs/development-environment.md',
        keyTopics: ['local setup', 'Node', 'Gradle', 'IntelliJ', 'VS Code', 'webpack dev server']
    },
    {
        id: 'compilation-notes',
        title: 'Compilation Notes',
        category: 'devops',
        description: 'Notes on TypeScript/Babel compilation and build tooling internals',
        url: compilationNotesUrl,
        sourcePath: 'docs/compilation-notes.md',
        keyTopics: ['TypeScript', 'Babel', 'compilation', 'build tooling']
    },
    {
        id: 'changelog-format',
        title: 'Changelog Format',
        category: 'devops',
        description: 'CHANGELOG entry format conventions, section headers, and difficulty ratings',
        url: changelogFormatUrl,
        sourcePath: 'docs/changelog-format.md',
        keyTopics: [
            'changelog',
            'CHANGELOG',
            'format',
            'release notes',
            'breaking changes',
            'upgrade difficulty',
            'section headers',
            'entry structure',
            'versioning'
        ]
    },
    {
        id: 'mcp',
        title: 'MCP Server',
        category: 'devops',
        description: 'Model Context Protocol server for AI assistant integration',
        url: mcpUrl,
        sourcePath: 'mcp/README.md',
        keyTopics: ['MCP', 'AI assistants', 'documentation search', 'TypeScript types']
    },

    // Upgrade Notes & Versioning
    {
        id: 'version-compatibility',
        title: 'Version Compatibility',
        category: 'upgrade',
        description: 'Required hoist-core versions for each hoist-react release',
        url: versionCompatibilityUrl,
        sourcePath: 'docs/version-compatibility.md',
        keyTopics: [
            'version',
            'compatibility',
            'hoist-core',
            'hoist-react',
            'minimum version',
            'required version',
            'recommended version',
            'compatibility matrix',
            'version pairing',
            'upgrade',
            'hoist-dev-utils',
            'reverse lookup'
        ]
    },
    {
        id: 'v81-upgrade',
        title: 'v81 Upgrade Notes',
        category: 'upgrade',
        description: 'Panel CSS rename, completeAuthAsync return type, Blueprint Card rename',
        url: v81UpgradeUrl,
        sourcePath: 'docs/upgrade-notes/v81-upgrade-notes.md',
        keyTopics: ['v81', 'upgrade', 'Panel CSS', 'BpCard']
    },
    {
        id: 'v80-upgrade',
        title: 'v80 Upgrade Notes',
        category: 'upgrade',
        description: 'FormField BEM CSS classes, appLoadModel rename, jQuery resolution',
        url: v80UpgradeUrl,
        sourcePath: 'docs/upgrade-notes/v80-upgrade-notes.md',
        keyTopics: ['v80', 'upgrade', 'FormField', 'appLoadObserver']
    },
    {
        id: 'v79-upgrade',
        title: 'v79 Upgrade Notes',
        category: 'upgrade',
        description: 'Blueprint 5 to 6, moduleResolution bundler, loadModel rename',
        url: v79UpgradeUrl,
        sourcePath: 'docs/upgrade-notes/v79-upgrade-notes.md',
        keyTopics: ['v79', 'upgrade', 'Blueprint 6', 'moduleResolution']
    },
    {
        id: 'v78-upgrade',
        title: 'v78 Upgrade Notes',
        category: 'upgrade',
        description: 'GridModel.setColumnState behavior change',
        url: v78UpgradeUrl,
        sourcePath: 'docs/upgrade-notes/v78-upgrade-notes.md',
        keyTopics: ['v78', 'upgrade', 'setColumnState']
    }
];

/** Lookup a doc entry by ID. */
export function getDocEntry(id: string): DocEntry | undefined {
    return DOC_REGISTRY.find(it => it.id === id);
}

/** Get all doc entries for a given category. */
export function getDocsByCategory(categoryId: string): DocEntry[] {
    return DOC_REGISTRY.filter(it => it.category === categoryId);
}

// Build a lookup from sourcePath to DocEntry for link resolution.
const SOURCE_PATH_MAP: Map<string, DocEntry> = new Map(
    DOC_REGISTRY.map(entry => [entry.sourcePath, entry])
);

/**
 * Resolve a relative link from one doc to another.
 * Given the current doc's sourcePath and a relative href (e.g., '../core/README.md'),
 * returns the matching DocEntry, or undefined if not found.
 */
export function resolveDocLink(currentSourcePath: string, href: string): DocEntry | undefined {
    // Ignore external URLs and anchor-only links
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
        return undefined;
    }

    // Strip any anchor fragment from the href
    const cleanHref = href.split('#')[0];
    if (!cleanHref) return undefined;

    // Resolve the relative path against the current doc's directory
    const currentDir = currentSourcePath.substring(0, currentSourcePath.lastIndexOf('/') + 1);
    const resolved = normalizePath(currentDir + cleanHref);

    return SOURCE_PATH_MAP.get(resolved);
}

/** Normalize a path by resolving `.` and `..` segments. */
function normalizePath(path: string): string {
    const parts = path.split('/');
    const result: string[] = [];
    for (const part of parts) {
        if (part === '.' || part === '') continue;
        if (part === '..') {
            result.pop();
        } else {
            result.push(part);
        }
    }
    return result.join('/');
}

// ---------------------------------------------------------------------------
// Doc → Toolbox example tab mappings
// ---------------------------------------------------------------------------
const R = 'default';

/**
 * Maps doc IDs to relevant Toolbox example tabs. Only docs with highly relevant,
 * directly demonstrative examples are included — not every doc needs entries here.
 */
const DOC_EXAMPLES: Record<string, DocExampleLink[]> = {
    grid: [
        {title: 'Standard Grid', route: `${R}.grids.standard`},
        {title: 'Tree Grid', route: `${R}.grids.tree`},
        {title: 'Column Filtering', route: `${R}.grids.columnFiltering`},
        {title: 'Inline Editing', route: `${R}.grids.inlineEditing`},
        {title: 'Zone Grid', route: `${R}.grids.zoneGrid`},
        {title: 'DataView', route: `${R}.grids.dataview`},
        {title: 'REST Editor', route: `${R}.grids.rest`}
    ],
    form: [
        {title: 'FormModel', route: `${R}.forms.form`},
        {title: 'Hoist Inputs', route: `${R}.forms.inputs`}
    ],
    input: [
        {title: 'Hoist Inputs', route: `${R}.forms.inputs`},
        {title: 'Select', route: `${R}.forms.select`},
        {title: 'Picker', route: `${R}.forms.picker`}
    ],
    layout: [
        {title: 'HBox', route: `${R}.layout.hbox`},
        {title: 'VBox', route: `${R}.layout.vbox`}
    ],
    tab: [{title: 'TabContainer', route: `${R}.layout.tabPanel`}],
    panel: [
        {title: 'Panel Intro', route: `${R}.panels.intro`},
        {title: 'Toolbars', route: `${R}.panels.toolbars`},
        {title: 'Panel Sizing', route: `${R}.panels.sizing`},
        {title: 'Mask', route: `${R}.panels.mask`},
        {title: 'Loading Indicator', route: `${R}.panels.loadingIndicator`}
    ],
    dash: [
        {title: 'DashContainer', route: `${R}.layout.dashContainer`},
        {title: 'DashCanvas', route: `${R}.layout.dashCanvas`}
    ],
    desktop: [
        {title: 'Hoist Inputs', route: `${R}.forms.inputs`},
        {title: 'Select', route: `${R}.forms.select`},
        {title: 'LeftRightChooser', route: `${R}.other.leftRightChooser`}
    ],
    format: [
        {title: 'Date Formats', route: `${R}.other.formatDates`},
        {title: 'Number Formats', route: `${R}.other.formatNumbers`}
    ],
    icon: [{title: 'Icons', route: `${R}.other.icons`}],
    'error-handling': [
        {title: 'Exception Handling', route: `${R}.other.exceptionHandler`},
        {title: 'ErrorMessage', route: `${R}.other.errorMessage`}
    ],
    routing: [{title: 'Simple Routing', route: `${R}.other.simpleRouting`}],
    appcontainer: [
        {title: 'App Notifications', route: `${R}.other.appNotifications`},
        {title: 'Popups', route: `${R}.other.popups`}
    ],
    inspector: [{title: 'Inspector', route: `${R}.other.inspector`}],
    cmp: [
        {title: 'Standard Grid', route: `${R}.grids.standard`},
        {title: 'FormModel', route: `${R}.forms.form`},
        {title: 'DataView', route: `${R}.grids.dataview`}
    ],
    data: [
        {title: 'Standard Grid', route: `${R}.grids.standard`},
        {title: 'Tree Grid', route: `${R}.grids.tree`}
    ],
    viewmanager: [{title: 'Standard Grid', route: `${R}.grids.standard`}],
    core: [{title: 'Factories vs. JSX', route: `${R}.other.jsx`}],
    mobile: [{title: 'Mobile', route: `${R}.mobile`}]
};

/** Get example links for a given doc, or an empty array if none. */
export function getDocExamples(docId: string): DocExampleLink[] {
    return DOC_EXAMPLES[docId] ?? [];
}
