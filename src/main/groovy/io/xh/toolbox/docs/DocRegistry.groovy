package io.xh.toolbox.docs

import io.xh.hoist.log.LogSupport

/**
 * Unified registry of documentation entries for both hoist-react and hoist-core.
 * Entries are hardcoded with metadata and validated against the active ContentSources at init.
 */
class DocRegistry implements LogSupport {

    final List<DocEntry> entries

    DocRegistry(Map<String, ContentSource> sources) {
        def allEntries = []
        allEntries.addAll(buildHoistReactEntries())
        allEntries.addAll(buildHoistCoreEntries())

        // Validate file existence against active content sources.
        this.entries = allEntries.findAll { entry ->
            def source = sources[entry.source]
            if (!source) {
                logWarn("No content source for '${entry.source}', skipping: ${entry.id}")
                return false
            }
            if (source.fileExists(entry.filePath)) {
                return true
            } else {
                logWarn("Doc file not found for ${entry.source}:${entry.id} at ${entry.filePath}, skipping")
                return false
            }
        }

        logInfo("Doc registry loaded: ${entries.size()} of ${allEntries.size()} entries available")
    }

    List<Map> toMaps() {
        return entries.collect { entry ->
            [
                id         : entry.id,
                source     : entry.source,
                title      : entry.title,
                category   : entry.category,
                description: entry.description,
                keyTopics  : entry.keyTopics
            ]
        }
    }

    DocEntry findEntry(String source, String docId) {
        return entries.find { it.source == source && it.id == docId }
    }

    //--------------------------------------------------------------------------
    // Hoist React entries — ported from client-app docRegistry.ts
    //--------------------------------------------------------------------------
    private static List<DocEntry> buildHoistReactEntries() {
        return [
            // Overview
            new DocEntry(
                id: 'hoist-react', source: 'hoist-react', title: 'Hoist React',
                category: 'overview',
                description: 'Full-stack UI framework built on React and MobX',
                filePath: 'README.md',
                keyTopics: ['overview', 'getting started', 'architecture', 'element factories']
            ),
            new DocEntry(
                id: 'docs-index', source: 'hoist-react', title: 'Documentation Index',
                category: 'overview',
                description: 'Primary catalog for all hoist-react documentation',
                filePath: 'docs/README.md',
                keyTopics: ['index', 'quick reference', 'catalog']
            ),
            new DocEntry(
                id: 'coding-conventions', source: 'hoist-react', title: 'Coding Conventions',
                category: 'overview',
                description: 'Code style, naming, class structure, component and async patterns',
                filePath: 'docs/coding-conventions.md',
                keyTopics: ['conventions', 'code style', 'imports', 'import ordering', 'named imports', 'barrel exports', 'TypeScript', 'interface vs type', 'declare config', 'override', 'readonly', 'naming', 'PascalCase', 'camelCase', 'Async suffix', 'class structure', 'member ordering', 'section dividers', 'constructor pattern', 'hoistCmp', 'withFactory', 'factory', 'model binding', 'displayName', 'element factories', 'JSX', 'null', 'undefined', '== null', 'withDefault', 'async/await', 'catchDefault', 'return await', 'XH.handleException', 'throwIf', 'logging', 'logInfo', 'withDebug', 'CSS', 'BEM', 'xh- prefix', 'CSS variables', 'lodash', 'TSDoc']
            ),

            // Core Framework
            new DocEntry(
                id: 'core', source: 'hoist-react', title: 'Core',
                category: 'core',
                description: 'Foundation classes: components, models, services, XH singleton',
                filePath: 'core/README.md',
                keyTopics: ['HoistBase', 'HoistModel', 'HoistService', 'HoistAppModel', 'hoistCmp', 'XH', 'element factories', 'decorators', 'lifecycle', '@managed', '@lookup', 'creates', 'uses', 'addReaction', 'lookupModel']
            ),
            new DocEntry(
                id: 'data', source: 'hoist-react', title: 'Data',
                category: 'core',
                description: 'Observable data layer with filtering, validation, and aggregation',
                filePath: 'data/README.md',
                keyTopics: ['Store', 'StoreRecord', 'Field', 'Filter', 'FilterChooserModel', 'FilterFieldSpec', 'Cube', 'View', 'tree data', 'loadData', 'processRawData']
            ),
            new DocEntry(
                id: 'svc', source: 'hoist-react', title: 'Services',
                category: 'core',
                description: 'Built-in singleton services for data access and app-wide operations',
                filePath: 'svc/README.md',
                keyTopics: ['FetchService', 'ConfigService', 'PrefService', 'IdentityService', 'TrackService', 'WebSocketService', 'JsonBlobService', 'GridExportService', 'GridAutosizeService', 'IdleService', 'AutoRefreshService', 'EnvironmentService']
            ),

            // Components
            new DocEntry(
                id: 'cmp', source: 'hoist-react', title: 'Components Overview',
                category: 'components',
                description: 'Cross-platform component overview and catalog',
                filePath: 'cmp/README.md',
                keyTopics: ['component categories', 'factory pattern', 'DataView', 'DataViewModel', 'Treemap', 'ZoneGrid', 'Badge', 'Spinner', 'LoadingIndicator', 'RelativeTimestamp', 'Markdown']
            ),
            new DocEntry(
                id: 'grid', source: 'hoist-react', title: 'Grid',
                category: 'components',
                description: 'Primary data grid built on ag-Grid',
                filePath: 'cmp/grid/README.md',
                keyTopics: ['GridModel', 'Column', 'ColumnGroup', 'sorting', 'grouping', 'filtering', 'selection', 'inline editing', 'export', 'tree grid', 'GridFilterModel', 'ag-Grid', 'column chooser', 'context menu']
            ),
            new DocEntry(
                id: 'form', source: 'hoist-react', title: 'Form',
                category: 'components',
                description: 'Form infrastructure for data entry with validation',
                filePath: 'cmp/form/README.md',
                keyTopics: ['FormModel', 'FieldModel', 'SubformsFieldModel', 'validation rules', 'data binding']
            ),
            new DocEntry(
                id: 'input', source: 'hoist-react', title: 'Input',
                category: 'components',
                description: 'Base classes and interfaces for input components',
                filePath: 'cmp/input/README.md',
                keyTopics: ['HoistInputModel', 'HoistInputProps', 'change/commit lifecycle', 'commitOnChange', 'value binding', 'focus management', 'Select', 'TextInput', 'DateInput', 'NumberInput', 'Checkbox', 'SwitchInput']
            ),
            new DocEntry(
                id: 'layout', source: 'hoist-react', title: 'Layout',
                category: 'components',
                description: 'Flexbox-based layout containers',
                filePath: 'cmp/layout/README.md',
                keyTopics: ['Box', 'VBox', 'HBox', 'Frame', 'Viewport', 'LayoutProps']
            ),
            new DocEntry(
                id: 'tab', source: 'hoist-react', title: 'Tab',
                category: 'components',
                description: 'Tabbed interface system',
                filePath: 'cmp/tab/README.md',
                keyTopics: ['TabContainerModel', 'TabModel', 'routing integration', 'renderMode', 'refreshMode', 'RefreshContextModel', 'dynamic tabs']
            ),
            new DocEntry(
                id: 'viewmanager', source: 'hoist-react', title: 'View Manager',
                category: 'components',
                description: 'Save/load named bundles of component state',
                filePath: 'cmp/viewmanager/README.md',
                keyTopics: ['ViewManagerModel', 'views', 'sharing', 'pinning', 'auto-save', 'JsonBlob persistence']
            ),

            // Desktop
            new DocEntry(
                id: 'desktop', source: 'hoist-react', title: 'Desktop',
                category: 'desktop',
                description: 'Desktop-specific components and app container',
                filePath: 'desktop/README.md',
                keyTopics: ['desktop components', 'Blueprint wrappers', 'Select', 'DateInput', 'NumberInput', 'TextArea', 'Picker', 'Checkbox', 'SwitchInput', 'RadioInput', 'Slider', 'CodeInput', 'JsonInput', 'LeftRightChooser', 'dropdown']
            ),
            new DocEntry(
                id: 'panel', source: 'hoist-react', title: 'Panel',
                category: 'desktop',
                description: 'Desktop panel container with toolbars, masks, and collapsible behavior',
                filePath: 'desktop/cmp/panel/README.md',
                keyTopics: ['Panel', 'PanelModel', 'Toolbar', 'mask', 'loading indicator', 'collapse/resize', 'persistence', 'modal support', 'splitter', 'compactHeader']
            ),
            new DocEntry(
                id: 'dash', source: 'hoist-react', title: 'Dashboard',
                category: 'desktop',
                description: 'Configurable dashboard system with draggable, resizable widgets',
                filePath: 'desktop/cmp/dash/README.md',
                keyTopics: ['DashContainerModel', 'DashCanvasModel', 'DashViewSpec', 'DashViewModel', 'widget persistence']
            ),

            // Mobile
            new DocEntry(
                id: 'mobile', source: 'hoist-react', title: 'Mobile',
                category: 'mobile',
                description: 'Mobile-specific components built on Onsen UI',
                filePath: 'mobile/README.md',
                keyTopics: ['AppContainer', 'NavigatorModel', 'Panel', 'AppBar', 'mobile inputs', 'touch navigation', 'swipeable tabs', 'DialogPanel', 'pull to refresh']
            ),

            // Utilities
            new DocEntry(
                id: 'format', source: 'hoist-react', title: 'Format',
                category: 'utilities',
                description: 'Number, date, and miscellaneous formatting for grids and display',
                filePath: 'format/README.md',
                keyTopics: ['fmtNumber', 'fmtPercent', 'fmtMillions', 'fmtDate', 'fmtThousands', 'numberRenderer', 'dateRenderer', 'ledger', 'colorSpec', 'column renderer', 'currency']
            ),
            new DocEntry(
                id: 'appcontainer', source: 'hoist-react', title: 'App Container',
                category: 'utilities',
                description: 'Application shell: lifecycle, dialogs, toasts, banners, theming',
                filePath: 'appcontainer/README.md',
                keyTopics: ['AppContainerModel', 'MessageSpec', 'ToastSpec', 'BannerSpec', 'ThemeModel', 'RouterModel', 'AppOption', 'dark mode', 'light mode', 'theming', 'ExceptionDialogModel', 'SizingModeModel', 'XH.toast', 'XH.confirm', 'XH.alert']
            ),
            new DocEntry(
                id: 'utils', source: 'hoist-react', title: 'Utils',
                category: 'utilities',
                description: 'Async, datetime, JS, and React utility functions',
                filePath: 'utils/README.md',
                keyTopics: ['Timer', 'LocalDate', 'forEachAsync', '@debounced', '@computeOnce', '@sharePendingPromise', 'logging', 'hooks']
            ),
            new DocEntry(
                id: 'promise', source: 'hoist-react', title: 'Promise',
                category: 'utilities',
                description: 'Promise prototype extensions for error handling, tracking, masking',
                filePath: 'promise/README.md',
                keyTopics: ['catchDefault', 'catchWhen', 'track', 'linkTo', 'timeout', 'thenAction', 'wait', 'waitFor']
            ),
            new DocEntry(
                id: 'mobx', source: 'hoist-react', title: 'MobX',
                category: 'utilities',
                description: 'MobX integration layer: re-exports, action enforcement, @bindable',
                filePath: 'mobx/README.md',
                keyTopics: ['@bindable', '@bindable.ref', 'makeObservable', 'observer', 'action', 'observable', 'computed', 'enforceActions']
            ),

            // Concepts
            new DocEntry(
                id: 'lifecycle-app', source: 'hoist-react', title: 'Lifecycle: App',
                category: 'concepts',
                description: 'How a Hoist app initializes from entry point to RUNNING state',
                filePath: 'docs/lifecycle-app.md',
                keyTopics: ['XH.renderApp', 'AppSpec', 'AppContainerModel', 'initialization sequence', 'AppState']
            ),
            new DocEntry(
                id: 'lifecycle-models', source: 'hoist-react', title: 'Lifecycle: Models & Services',
                category: 'concepts',
                description: 'Model, service, and load/refresh lifecycles after app startup',
                filePath: 'docs/lifecycle-models-and-services.md',
                keyTopics: ['onLinked', 'afterLinked', 'doLoadAsync', 'destroy', 'cleanup', 'initAsync', 'LoadSupport', 'LoadSpec', 'RefreshContextModel', '@managed', 'loadAsync', 'refreshAsync']
            ),
            new DocEntry(
                id: 'authentication', source: 'hoist-react', title: 'Authentication',
                category: 'concepts',
                description: 'How Hoist apps authenticate users via OAuth or form-based login',
                filePath: 'docs/authentication.md',
                keyTopics: ['HoistAuthModel', 'MsalClient', 'AuthZeroClient', 'Token', 'IdentityService', 'impersonation']
            ),
            new DocEntry(
                id: 'persistence', source: 'hoist-react', title: 'Persistence',
                category: 'concepts',
                description: 'Persisting user UI state to various backing stores',
                filePath: 'docs/persistence.md',
                keyTopics: ['@persist', 'markPersist', 'PersistenceProvider', 'localStorage', 'Preference', 'ViewManager', 'JsonBlob', 'DashContainerModel', 'GridModel', 'save state', 'restore state']
            ),
            new DocEntry(
                id: 'authorization', source: 'hoist-react', title: 'Authorization',
                category: 'concepts',
                description: 'Role-based authorization and config-driven feature gates',
                filePath: 'docs/authorization.md',
                keyTopics: ['HoistUser', 'hasRole', 'hasGate', 'checkAccess', 'HOIST_ADMIN', 'roles', 'gates']
            ),
            new DocEntry(
                id: 'routing', source: 'hoist-react', title: 'Routing',
                category: 'concepts',
                description: 'Client-side routing via RouterModel (Router5 wrapper)',
                filePath: 'docs/routing.md',
                keyTopics: ['RouterModel', 'getRoutes', 'XH.routerState', 'XH.navigate', 'route parameters', 'TabContainerModel route integration']
            ),
            new DocEntry(
                id: 'error-handling', source: 'hoist-react', title: 'Error Handling',
                category: 'concepts',
                description: 'Centralized exception handling, display, and logging',
                filePath: 'docs/error-handling.md',
                keyTopics: ['XH.handleException', 'ExceptionDialog', 'catchDefault', 'alertType', 'toast', 'requireReload', 'error boundary', 'exception logging']
            ),
            new DocEntry(
                id: 'test-automation', source: 'hoist-react', title: 'Test Automation',
                category: 'concepts',
                description: 'Test automation support via testId selectors',
                filePath: 'docs/test-automation.md',
                keyTopics: ['testId', 'TestSupportProps', 'data-testid', 'getTestId']
            ),

            // Supporting Packages
            new DocEntry(
                id: 'icon', source: 'hoist-react', title: 'Icon',
                category: 'supporting',
                description: 'Factory-based icon system wrapping FontAwesome Pro',
                filePath: 'icon/README.md',
                keyTopics: ['Icon singleton', 'IconProps', 'intent coloring', 'size variants', 'asHtml', 'fileIcon']
            ),
            new DocEntry(
                id: 'security', source: 'hoist-react', title: 'Security',
                category: 'supporting',
                description: 'OAuth 2.0 client abstraction for Auth0 and Microsoft Entra ID',
                filePath: 'security/README.md',
                keyTopics: ['BaseOAuthClient', 'AuthZeroClient', 'MsalClient', 'Token', 'AccessTokenSpec', 'auto-refresh']
            ),
            new DocEntry(
                id: 'kit', source: 'hoist-react', title: 'Kit',
                category: 'components',
                description: 'Centralized wrappers for third-party libraries used by Hoist',
                filePath: 'kit/README.md',
                keyTopics: ['installAgGrid', 'installHighcharts', 'Blueprint', 'Onsen', 'GoldenLayout', 'react-select']
            ),
            new DocEntry(
                id: 'inspector', source: 'hoist-react', title: 'Inspector',
                category: 'supporting',
                description: 'Built-in developer tool for real-time inspection of Hoist instances',
                filePath: 'inspector/README.md',
                keyTopics: ['InspectorPanel', 'StatsModel', 'InstancesModel', 'property watchlist', 'model leak detection']
            ),

            // DevOps & Environment
            new DocEntry(
                id: 'build-publish', source: 'hoist-react', title: 'Build & Publish',
                category: 'devops',
                description: 'Hoist-react CI/CD: GitHub Actions workflows for linting, npm publishing',
                filePath: 'docs/build-and-publish.md',
                keyTopics: ['CI', 'GitHub Actions', 'npm', 'publish', 'snapshot', 'lint', 'CodeQL']
            ),
            new DocEntry(
                id: 'build-app-deployment', source: 'hoist-react', title: 'App Build & Deployment',
                category: 'devops',
                description: 'Full-stack application build process, WAR packaging, and deployment',
                filePath: 'docs/build-app-deployment.md',
                keyTopics: ['build', 'deploy', 'WAR', 'Gradle', 'webpack', 'nginx', 'Docker']
            ),
            new DocEntry(
                id: 'dev-environment', source: 'hoist-react', title: 'Development Environment',
                category: 'devops',
                description: 'Local development environment setup for Hoist and app developers',
                filePath: 'docs/development-environment.md',
                keyTopics: ['local setup', 'Node', 'Gradle', 'IntelliJ', 'VS Code', 'webpack dev server']
            ),
            new DocEntry(
                id: 'compilation-notes', source: 'hoist-react', title: 'Compilation Notes',
                category: 'devops',
                description: 'Notes on TypeScript/Babel compilation and build tooling internals',
                filePath: 'docs/compilation-notes.md',
                keyTopics: ['TypeScript', 'Babel', 'compilation', 'build tooling']
            ),
            new DocEntry(
                id: 'changelog-format', source: 'hoist-react', title: 'Changelog Format',
                category: 'devops',
                description: 'CHANGELOG entry format conventions, section headers, and difficulty ratings',
                filePath: 'docs/changelog-format.md',
                keyTopics: ['changelog', 'CHANGELOG', 'format', 'release notes', 'breaking changes', 'upgrade difficulty', 'section headers', 'entry structure', 'versioning']
            ),
            new DocEntry(
                id: 'mcp', source: 'hoist-react', title: 'MCP Server',
                category: 'devops',
                description: 'Model Context Protocol server for AI assistant integration',
                filePath: 'mcp/README.md',
                keyTopics: ['MCP', 'AI assistants', 'documentation search', 'TypeScript types']
            ),

            // Upgrade Notes
            new DocEntry(
                id: 'version-compatibility', source: 'hoist-react', title: 'Version Compatibility',
                category: 'upgrade',
                description: 'Required hoist-core versions for each hoist-react release',
                filePath: 'docs/version-compatibility.md',
                keyTopics: ['version', 'compatibility', 'hoist-core', 'hoist-react', 'minimum version', 'required version', 'recommended version', 'compatibility matrix', 'version pairing', 'upgrade', 'hoist-dev-utils', 'reverse lookup']
            ),
            new DocEntry(
                id: 'v82-upgrade', source: 'hoist-react', title: 'v82 Upgrade Notes',
                category: 'upgrade',
                description: 'Picker input, DashCanvasWidgetChooser, GroupingChooser bind, MCP server, filter refactor',
                filePath: 'docs/upgrade-notes/v82-upgrade-notes.md',
                keyTopics: ['v82', 'upgrade', 'Picker', 'DashCanvas', 'MCP', 'Filter']
            ),
            new DocEntry(
                id: 'v81-upgrade', source: 'hoist-react', title: 'v81 Upgrade Notes',
                category: 'upgrade',
                description: 'Panel CSS rename, completeAuthAsync return type, Blueprint Card rename',
                filePath: 'docs/upgrade-notes/v81-upgrade-notes.md',
                keyTopics: ['v81', 'upgrade', 'Panel CSS', 'BpCard']
            ),
            new DocEntry(
                id: 'v80-upgrade', source: 'hoist-react', title: 'v80 Upgrade Notes',
                category: 'upgrade',
                description: 'FormField BEM CSS classes, appLoadModel rename, jQuery resolution',
                filePath: 'docs/upgrade-notes/v80-upgrade-notes.md',
                keyTopics: ['v80', 'upgrade', 'FormField', 'appLoadObserver']
            ),
            new DocEntry(
                id: 'v79-upgrade', source: 'hoist-react', title: 'v79 Upgrade Notes',
                category: 'upgrade',
                description: 'Blueprint 5 to 6, moduleResolution bundler, loadModel rename',
                filePath: 'docs/upgrade-notes/v79-upgrade-notes.md',
                keyTopics: ['v79', 'upgrade', 'Blueprint 6', 'moduleResolution']
            ),
            new DocEntry(
                id: 'v78-upgrade', source: 'hoist-react', title: 'v78 Upgrade Notes',
                category: 'upgrade',
                description: 'GridModel.setColumnState behavior change',
                filePath: 'docs/upgrade-notes/v78-upgrade-notes.md',
                keyTopics: ['v78', 'upgrade', 'setColumnState']
            )
        ]
    }

    //--------------------------------------------------------------------------
    // Hoist Core entries — ported from hoist-core MCP DocRegistry.groovy
    //--------------------------------------------------------------------------
    private static List<DocEntry> buildHoistCoreEntries() {
        return [
            // Core Framework
            new DocEntry(
                id: 'base-classes', source: 'hoist-core', title: 'Base Classes',
                category: 'core-framework',
                description: 'Base classes for services and controllers — lifecycle, resource factories, CRUD patterns.',
                filePath: 'docs/base-classes.md',
                keyTopics: ['BaseService', 'init', 'destroy', 'createCache', 'createCachedValue', 'createTimer', 'createIMap', 'BaseController', 'renderJSON', 'parseRequestJSON', 'RestController', 'doCreate', 'doList', 'doUpdate', 'doDelete']
            ),
            new DocEntry(
                id: 'request-flow', source: 'hoist-core', title: 'Request Flow',
                category: 'core-framework',
                description: 'How an HTTP request flows through the Hoist framework.',
                filePath: 'docs/request-flow.md',
                keyTopics: ['HoistCoreGrailsPlugin', 'HoistFilter', 'UrlMappings', 'AccessInterceptor', 'controller dispatch', 'JSON response']
            ),
            new DocEntry(
                id: 'authentication', source: 'hoist-core', title: 'Authentication',
                category: 'core-framework',
                description: 'Authentication service contract and user identity.',
                filePath: 'docs/authentication.md',
                keyTopics: ['BaseAuthenticationService', 'BaseUserService', 'HoistUser', 'IdentityService', 'impersonation']
            ),
            new DocEntry(
                id: 'authorization', source: 'hoist-core', title: 'Authorization',
                category: 'core-framework',
                description: 'Role-based access control and controller security annotations.',
                filePath: 'docs/authorization.md',
                keyTopics: ['BaseRoleService', 'DefaultRoleService', 'Role', 'RoleMember', 'AccessRequiresRole', 'AccessAll']
            ),

            // Core Features
            new DocEntry(
                id: 'configuration', source: 'hoist-core', title: 'Configuration',
                category: 'core-features',
                description: 'Database-backed soft configuration with typed values.',
                filePath: 'docs/configuration.md',
                keyTopics: ['AppConfig', 'ConfigService', 'clientVisible', 'pwd', 'encryption', 'xhConfigChanged']
            ),
            new DocEntry(
                id: 'preferences', source: 'hoist-core', title: 'Preferences',
                category: 'core-features',
                description: 'User-specific settings and preference management.',
                filePath: 'docs/preferences.md',
                keyTopics: ['Preference', 'UserPreference', 'PrefService', 'local']
            ),
            new DocEntry(
                id: 'clustering', source: 'hoist-core', title: 'Clustering',
                category: 'core-features',
                description: 'Hazelcast-based multi-instance coordination and distributed data structures.',
                filePath: 'docs/clustering.md',
                keyTopics: ['ClusterService', 'Cache', 'CachedValue', 'IMap', 'ReplicatedMap', 'Topic', 'primaryOnly']
            ),
            new DocEntry(
                id: 'activity-tracking', source: 'hoist-core', title: 'Activity Tracking',
                category: 'core-features',
                description: 'Usage and performance logging with email notifications.',
                filePath: 'docs/activity-tracking.md',
                keyTopics: ['TrackLog', 'TrackService', 'categories', 'elapsed', 'timing', 'client error', 'feedback']
            ),
            new DocEntry(
                id: 'json-handling', source: 'hoist-core', title: 'JSON Handling',
                category: 'core-features',
                description: 'Jackson-based JSON serialization and parsing.',
                filePath: 'docs/json-handling.md',
                keyTopics: ['JSONSerializer', 'JSONParser', 'JSONFormat', 'renderJSON', 'parseRequestJSON']
            ),

            // Infrastructure
            new DocEntry(
                id: 'monitoring', source: 'hoist-core', title: 'Monitoring',
                category: 'infrastructure',
                description: 'Application health monitoring with configurable checks and email alerting.',
                filePath: 'docs/monitoring.md',
                keyTopics: ['Monitor', 'MonitorResult', 'MonitoringService', 'MonitorDefinitionService', 'email alerts']
            ),
            new DocEntry(
                id: 'metrics', source: 'hoist-core', title: 'Metrics',
                category: 'infrastructure',
                description: 'Micrometer-based observable metrics with Prometheus and OTLP export.',
                filePath: 'docs/metrics.md',
                keyTopics: ['MetricsService', 'CompositeMeterRegistry', 'MonitorMetricsService', 'TrackMetricsService', 'Prometheus', 'OTLP', 'xhMetricsConfig']
            ),
            new DocEntry(
                id: 'websocket', source: 'hoist-core', title: 'WebSocket',
                category: 'infrastructure',
                description: 'Cluster-aware server push to connected clients.',
                filePath: 'docs/websocket.md',
                keyTopics: ['WebSocketService', 'HoistWebSocketHandler', 'HoistWebSocketChannel', 'channel']
            ),
            new DocEntry(
                id: 'http-client', source: 'hoist-core', title: 'HTTP Client',
                category: 'infrastructure',
                description: 'HTTP client for external API calls and request proxying.',
                filePath: 'docs/http-client.md',
                keyTopics: ['JSONClient', 'BaseProxyService', 'HttpUtils']
            ),
            new DocEntry(
                id: 'email', source: 'hoist-core', title: 'Email',
                category: 'infrastructure',
                description: 'Email sending with config-driven filtering and overrides.',
                filePath: 'docs/email.md',
                keyTopics: ['EmailService', 'xhEmailFilter', 'xhEmailOverride']
            ),
            new DocEntry(
                id: 'exception-handling', source: 'hoist-core', title: 'Exception Handling',
                category: 'infrastructure',
                description: 'Exception hierarchy and error rendering.',
                filePath: 'docs/exception-handling.md',
                keyTopics: ['HttpException', 'RoutineException', 'ExceptionHandler', 'HTTP status']
            ),
            new DocEntry(
                id: 'logging', source: 'hoist-core', title: 'Logging',
                category: 'infrastructure',
                description: 'Logging infrastructure with dynamic configuration.',
                filePath: 'docs/logging.md',
                keyTopics: ['LogSupport', 'logDebug', 'logInfo', 'logWarn', 'logError', 'LogLevelService', 'LogReaderService']
            ),

            // Application Development
            new DocEntry(
                id: 'application-structure', source: 'hoist-core', title: 'Application Structure',
                category: 'app-development',
                description: 'Standard Hoist application repository layout — server and client structure, build configuration, deployment.',
                filePath: 'docs/application-structure.md',
                keyTopics: ['build.gradle', 'gradle.properties', 'grails-app/init', 'client-app', 'Bootstrap.ts', 'AppModel', 'Docker', 'Nginx', 'Tomcat']
            ),

            // Grails Platform
            new DocEntry(
                id: 'gorm-domain-objects', source: 'hoist-core', title: 'GORM Domain Objects',
                category: 'grails-platform',
                description: 'GORM domain classes, querying, transactions, caching, associations, and performance optimization.',
                filePath: 'docs/gorm-domain-objects.md',
                keyTopics: ['Domain classes', 'Transactional', 'ReadOnly', 'second-level cache', 'N+1', 'fetch strategies', 'SQL logging']
            ),

            // Supporting Features
            new DocEntry(
                id: 'data-filtering', source: 'hoist-core', title: 'Data Filtering',
                category: 'supporting',
                description: "Server-side filter system mirroring hoist-react's client-side filters.",
                filePath: 'docs/data-filtering.md',
                keyTopics: ['Filter', 'FieldFilter', 'CompoundFilter', 'JSON roundtrip']
            ),
            new DocEntry(
                id: 'utilities', source: 'hoist-core', title: 'Utilities',
                category: 'supporting',
                description: 'Timers, date/string utilities, and async helpers.',
                filePath: 'docs/utilities.md',
                keyTopics: ['Timer', 'DateTimeUtils', 'StringUtils', 'Utils', 'InstanceConfigUtils', 'AsyncUtils']
            ),
            new DocEntry(
                id: 'jsonblob', source: 'hoist-core', title: 'JsonBlob',
                category: 'supporting',
                description: 'Generic JSON storage backing ViewManager and other client state.',
                filePath: 'docs/jsonblob.md',
                keyTopics: ['JsonBlob', 'JsonBlobService', 'token-based access']
            ),
            new DocEntry(
                id: 'ldap', source: 'hoist-core', title: 'LDAP',
                category: 'supporting',
                description: 'LDAP / Active Directory integration for user and group lookups.',
                filePath: 'docs/ldap.md',
                keyTopics: ['LdapService', 'LdapPerson', 'LdapGroup']
            ),
            new DocEntry(
                id: 'environment', source: 'hoist-core', title: 'Environment',
                category: 'supporting',
                description: 'Runtime environment detection and external configuration.',
                filePath: 'docs/environment.md',
                keyTopics: ['EnvironmentService', 'AppEnvironment', 'InstanceConfigUtils']
            ),
            new DocEntry(
                id: 'admin-endpoints', source: 'hoist-core', title: 'Admin Endpoints',
                category: 'supporting',
                description: 'Admin console endpoints and supporting services.',
                filePath: 'docs/admin-endpoints.md',
                keyTopics: ['XhController', 'admin controllers', 'AlertBannerService', 'ViewService', 'ServiceManagerService']
            ),

            // Build
            new DocEntry(
                id: 'build-and-publish', source: 'hoist-core', title: 'Build & Publish',
                category: 'build',
                description: 'Gradle build, GitHub Actions CI, and Maven Central publishing.',
                filePath: 'docs/build-and-publish.md',
                keyTopics: ['GitHub Actions', 'deployRelease', 'deploySnapshot', 'Sonatype', 'GPG signing', 'nexus-publish-plugin', 'publishToSonatype']
            ),

            // Upgrade Notes
            new DocEntry(
                id: 'v36-upgrade-notes', source: 'hoist-core', title: 'v36 Upgrade Notes',
                category: 'upgrade',
                description: 'Cluster-aware WebSockets, new @AccessRequiresXXX annotations, @Access deprecated.',
                filePath: 'docs/upgrade-notes/v36-upgrade-notes.md',
                keyTopics: ['v36', 'upgrade', 'WebSocket', 'AccessRequiresRole', 'Access deprecated']
            ),
            new DocEntry(
                id: 'v35-upgrade-notes', source: 'hoist-core', title: 'v35 Upgrade Notes',
                category: 'upgrade',
                description: 'CacheEntry generic key type, TrackLog clientAppCode, POI 5.x.',
                filePath: 'docs/upgrade-notes/v35-upgrade-notes.md',
                keyTopics: ['v35', 'upgrade', 'CacheEntry', 'TrackLog', 'POI']
            ),
            new DocEntry(
                id: 'v34-upgrade-notes', source: 'hoist-core', title: 'v34 Upgrade Notes',
                category: 'upgrade',
                description: 'Grails 7, Gradle 8, Tomcat 10, Jakarta EE.',
                filePath: 'docs/upgrade-notes/v34-upgrade-notes.md',
                keyTopics: ['v34', 'upgrade', 'Grails 7', 'Gradle 8', 'Tomcat 10', 'Jakarta']
            )
        ]
    }

    //--------------------------------------------------------------------------
    // Category definitions
    //--------------------------------------------------------------------------
    static final List<Map> HOIST_REACT_CATEGORIES = [
        [id: 'overview', title: 'Overview'],
        [id: 'concepts', title: 'Concepts'],
        [id: 'core', title: 'Core Framework'],
        [id: 'components', title: 'Components'],
        [id: 'desktop', title: 'Desktop'],
        [id: 'mobile', title: 'Mobile'],
        [id: 'utilities', title: 'Utilities'],
        [id: 'supporting', title: 'Supporting Packages'],
        [id: 'devops', title: 'DevOps & Environment'],
        [id: 'upgrade', title: 'Upgrade Notes']
    ]

    static final List<Map> HOIST_CORE_CATEGORIES = [
        [id: 'core-framework', title: 'Core Framework'],
        [id: 'core-features', title: 'Core Features'],
        [id: 'infrastructure', title: 'Infrastructure & Operations'],
        [id: 'app-development', title: 'Application Development'],
        [id: 'grails-platform', title: 'Grails Platform'],
        [id: 'supporting', title: 'Supporting Features'],
        [id: 'build', title: 'Build & Publishing'],
        [id: 'upgrade', title: 'Upgrade Notes']
    ]

    static final Map SOURCES = [
        'hoist-react': [label: 'Hoist React', categories: HOIST_REACT_CATEGORIES],
        'hoist-core' : [label: 'Hoist Core', categories: HOIST_CORE_CATEGORIES]
    ]

    //--------------------------------------------------------------------------
    // Data class
    //--------------------------------------------------------------------------
    static class DocEntry {
        String id
        String source
        String title
        String category
        String description
        String filePath
        List<String> keyTopics = []
    }
}
