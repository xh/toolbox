package io.xh.toolbox

import io.xh.hoist.config.AppConfig
import io.xh.hoist.util.Utils
import io.xh.toolbox.roadmap.Project
import io.xh.toolbox.user.User
import io.xh.hoist.BaseService
import io.xh.hoist.monitor.Monitor

import static io.xh.hoist.json.JSONSerializer.serializePretty
import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig


import static io.xh.hoist.util.Utils.appEnvironment
import static io.xh.hoist.util.Utils.appName
import static io.xh.hoist.util.Utils.appVersion
import static io.xh.hoist.util.Utils.configService

class BootStrap {

    def init = {servletContext ->
        logStartupMsg()
        ensureRequiredConfigsCreated()
        ensureRequiredPrefsCreated()
        ensureMonitorsCreated()
        ensureRoadMapItemsCreated()
        def services = Utils.xhServices.findAll {it.class.canonicalName.startsWith('io.xh.toolbox')}
        BaseService.parallelInit(services)
        ensureUsersCreated()
    }

    def destroy = {}


    private void ensureRoadMapItemsCreated() {
        if (!Project.count) {

            new Project(
                    name: 'Inline Grid Editing',
                    category: 'GRIDS',
                    description: 'Ability to edit grids inline',
                    status: 'MERGED',
                    gitLinks: [
                            'https://github.com/xh/hoist-react/issues/1621',
                            'https://github.com/xh/hoist-react/pull/1620'
                    ]
            ).save()

            new Project(
                    name: 'Rich Dashboards',
                    category: 'DASHBOARDS',
                    description: 'Highly functional drag-drop dashboards',
                    status: 'RELEASED'
            ).save()

            new Project(
                    name: 'Progressive Web App',
                    category: 'OTHER',
                    description: 'Hoist PWAs for desktop apps',
                    status: 'PLANNED'
            ).save()

            new Project(
                    name: 'Java 11 / Grails 4',
                    category: 'UPGRADES',
                    description: 'Upgrade Hoist to be compatible with Java 11 and Grails 4',
                    status: 'DEVELOPMENT'
            ).save()
        }
    }

    //------------------------
    // Implementation
    //------------------------
    private void ensureRequiredConfigsCreated() {
        def adminUsername = getInstanceConfig('adminUsername')

        configService.ensureRequiredConfigsCreated([
            roles: [
                valueType: 'json',
                defaultValue: [
                    APP_READER: ['toolbox@xh.io', 'inactive@xh.io', adminUsername].findAll {it},
                    HOIST_ADMIN: [adminUsername].findAll {it}
                ],
                groupName: 'Permissions'
            ],
            cubeTestDefaultDims: [
                valueType: 'json',
                defaultValue: [
                    ['fund', 'trader'],
                    ['sector', 'symbol'],
                    ['fund', 'trader', 'model']
                ],
                clientVisible: true,
                groupName: 'Toolbox',
                note: 'Default dimension selections for cube data test.'
            ],
            fileManagerStoragePath: [
                valueType: 'string',
                defaultValue: '/var/tmp/toolbox',
                groupName: 'Toolbox - Example Apps',
                note: 'Absolute path to disk location for storing uploaded files.'
            ],
            newsApiKey: [
                valueType: 'string',
                defaultValue: 'ab052127f3e349d38db094eade1d96d8',
                groupName: 'Toolbox - Example Apps',
            ],
            newsRefreshMins: [
                valueType: 'int',
                defaultValue: 60,
                groupName: 'Toolbox - Example Apps',
            ],
            newsSources: [
                valueType: 'json',
                defaultValue: [
                    "cnbc": "CNBC",
                    "fortune": "Fortune",
                    "reuters": "Reuters"
                ],
                groupName: 'Toolbox - Example Apps',
            ],
            recallsHost: [
                valueType: 'string',
                defaultValue: 'api.fda.gov',
                groupName: 'Toolbox - Example Apps',
            ],
            sourceUrls: [
                valueType: 'json',
                defaultValue: [
                    toolbox: 'https://github.com/xh/toolbox/blob/develop',
                    hoistReact: 'https://github.com/xh/hoist-react/blob/develop'
                ],
                groupName: 'Toolbox',
                clientVisible: true,
            ],
            portfolioConfigs: [
                valueType: 'json',
                defaultValue: [
                    instrumentCount: 500,
                    orderCount: 20000,
                    updateIntervalSecs: 5,
                    updatePctInstruments: 20,
                    updatePctPriceRange: 0.025,
                    pushUpdatesIntervalSecs: 5
                ],
                groupName: 'Toolbox - Example Apps'
            ]
        ])

        // Edit Hoist-installed auto-refresh config to enable default refresh for TB.
        def autoRefreshConfig = AppConfig.findByName('xhAutoRefreshIntervals')
        if (autoRefreshConfig && autoRefreshConfig.lastUpdatedBy == 'hoist-bootstrap') {
            autoRefreshConfig.value = serializePretty([app: 30, mobile: 60])
            autoRefreshConfig.save()
        }

    }

    private void ensureRequiredPrefsCreated() {
        Utils.prefService.ensureRequiredPrefsCreated([
            cubeTestOrderCount: [
                type: 'int',
                defaultValue: 80000,
                groupName: 'Toolbox',
                note: 'Orders to generate for Grids > Cube data test panel'
            ],
            cubeTestUserDims: [
                type: 'json',
                defaultValue: [],
                groupName: 'Toolbox',
                note: 'Nested arrays containing user\'s custom dimension choices'
            ],
            gridSizingMode: [
                type: 'string',
                defaultValue: 'standard',
                local: true,
                groupName: 'Toolbox',
                note: 'Grid sizing mode'
            ],
            expandDockedLinks: [
                type: 'bool',
                defaultValue: false,
                groupName: 'Toolbox',
                note: 'True to expand the docked linked panel by default, false to start collapsed.'
            ],
            mobileDims: [
                type: 'json',
                defaultValue: [:],
                local: true,
                groupName: 'Toolbox',
                note: 'Object containing user\'s dimension picker value & history'
            ],
            portfolioDims: [
                type: 'json',
                defaultValue: [
                        value: ['sector', 'symbol'],
                        history: [['sector', 'symbol'],
                                  ['fund', 'trader', 'model'],
                                  ['region', 'sector']]
                ],
                local: true,
                groupName: 'Toolbox - Example Apps',
                note: 'Object containing user\'s dimension picker value & history'
            ],
            portfolioGridPanelConfig: [
                type: 'json',
                defaultValue: [:],
                local: true,
                groupName: 'Toolbox - Example Apps'
            ],
            portfolioDetailPanelConfig: [
                type: 'json',
                defaultValue: [:],
                local: true,
                groupName: 'Toolbox - Example Apps'
            ],
            portfolioChartsPanelConfig: [
                type: 'json',
                defaultValue: [:],
                local: true,
                groupName: 'Toolbox - Example Apps'
            ],
            recallsPanelConfig: [
                type: 'json',
                defaultValue: [:],
                local: false,
                groupName: 'Toolbox - Example Apps',
                note: 'Size of Panel Model'
            ]
        ])
    }

    private void ensureMonitorsCreated() {
        createMonitorIfNeeded(
            code: 'pricesAgeMs',
            name: 'Portfolio: Last Price Update',
            metricType: 'Ceil',
            metricUnit: 'ms',
            warnThreshold: 30000,
            failThreshold: 60000,
            active: true
        )
        createMonitorIfNeeded(
            code: 'instrumentCount',
            name: 'Portfolio: Number of Instruments',
            metricType: 'Floor',
            metricUnit: 'instruments',
            warnThreshold: 50,
            failThreshold: 10,
            active: true
        )
        createMonitorIfNeeded(
            code: 'positionCount',
            name: 'Portfolio: Number of Positions',
            metricType: 'Floor',
            metricUnit: 'positions',
            warnThreshold: 50,
            failThreshold: 10,
            active: true
        )
        createMonitorIfNeeded(
            code: 'newsStoryCount',
            name: 'News: Loaded Stories',
            metricType: 'Floor',
            failThreshold: 1,
            metricUnit: 'stories',
            active: true
        )
        createMonitorIfNeeded(
            code: 'lastUpdateAgeMins',
            name: 'News: Most Recent Story',
            metricType: 'Ceil',
            metricUnit: 'minutes since last story',
            warnThreshold: 60,
            failThreshold: 360,
            active: true
        )
        createMonitorIfNeeded(
            code: 'loadedSourcesCount',
            name: 'News: Sources Loaded',
            metricType: 'None',
            metricUnit: 'sources',
            active: true
        )
        createMonitorIfNeeded(
            code: 'storageSpaceUsed',
            name: 'FileManager: Storage Space',
            metricType: 'Ceil',
            metricUnit: 'MB',
            warnThreshold: 16,
            failThreshold: 32,
            active: true
        )
        createMonitorIfNeeded(
            code: 'recallsFetchStatus',
            name: 'Recalls: Connection to FDA API',
            metricType: 'None',
            metricUnit: '',
            active: true
        )
        createMonitorIfNeeded(
            code: 'memoryUsage',
            name: 'Memory Usage of Server',
            metricType: 'Ceil',
            metricUnit: '%',
            warnThreshold: 50,
            failThreshold: 85,
            active: true
        )
        createMonitorIfNeeded(
            code: 'longestPageLoadMs',
            name: 'Longest Page Load in Last Hour',
            metricType: 'Ceil',
            metricUnit: 'ms',
            warnThreshold: 10000,
            failThreshold: 30000,
            active: true
        )
    }

    private void createMonitorIfNeeded(Map data) {
        def monitor = Monitor.findByCode(data.code as String)
        if (!monitor) new Monitor(data).save()
    }

    private void ensureUsersCreated() {
        String adminUsername = getInstanceConfig('adminUsername')
        String adminPassword = getInstanceConfig('adminPassword')

        if (adminUsername && adminPassword) {
            createUserIfNeeded(
                email: adminUsername,
                firstName: 'Toolbox',
                lastName: 'Admin',
                password: adminPassword
            )
        } else {
            log.warn("Default admin user not created. To provide admin access, specify credentials in a toolbox.yml instance config file.")
        }

        createUserIfNeeded(
            email: 'toolbox@xh.io',
            firstName: 'Toolbox',
            lastName: 'Demo',
            password: 'toolbox'
        )

        createUserIfNeeded(
            email: 'norole@xh.io',
            firstName: 'No',
            lastName: 'Role',
            password: 'password'
        )

        createUserIfNeeded(
            email: 'inactive@xh.io',
            firstName: 'Not',
            lastName: 'Active',
            password: 'password',
            enabled: false
        )
    }

    private void createUserIfNeeded(Map data) {
        def user = User.findByEmail(data.email as String)
        if (!user) new User(data).save()
    }

    private void logStartupMsg() {
        log.info("""
\n
 ______   ______     ______     __         ______     ______     __  __    
/\\__  _\\ /\\  __ \\   /\\  __ \\   /\\ \\       /\\  == \\   /\\  __ \\   /\\_\\_\\_\\   
\\/_/\\ \\/ \\ \\ \\/\\ \\  \\ \\ \\/\\ \\  \\ \\ \\____  \\ \\  __<   \\ \\ \\/\\ \\  \\/_/\\_\\/_  
   \\ \\_\\  \\ \\_____\\  \\ \\_____\\  \\ \\_____\\  \\ \\_____\\  \\ \\_____\\   /\\_\\/\\_\\ 
    \\/_/   \\/_____/   \\/_____/   \\/_____/   \\/_____/   \\/_____/   \\/_/\\/_/ 
\n                                                                           
         ${appName} v${appVersion} - ${appEnvironment}
\n
        """)
    }
}
