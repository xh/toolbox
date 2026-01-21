package io.xh.toolbox

import grails.gorm.transactions.Transactional
import io.xh.hoist.config.ConfigService
import io.xh.hoist.log.LogSupport
import io.xh.hoist.pref.PrefService
import io.xh.toolbox.user.User

import java.time.LocalDate

import static io.xh.hoist.BaseService.parallelInit
import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig
import static io.xh.hoist.util.Utils.*

class BootStrap implements LogSupport {

    ConfigService configService
    PrefService prefService

    def init = {servletContext ->
        logStartupMsg()

        ensureRequiredConfigsCreated()
        ensureRequiredPrefsCreated()
        createLocalAdminUserIfNeeded()

        def services = xhServices.findAll {
            it.class.canonicalName.startsWith(this.class.package.name)
        }
        parallelInit(services)

        JavaTest.helloWorld()
    }

    def destroy = {}

    //------------------------
    // Implementation
    //------------------------
    @Transactional
    private void createLocalAdminUserIfNeeded() {
        String adminUsername = getInstanceConfig('bootstrapAdminUser')
        String adminPassword = getInstanceConfig('bootstrapAdminPassword')
        if (adminUsername && adminPassword) {
            def user = User.findByEmail(adminUsername)
            if (!user) {
                new User(
                    email: adminUsername,
                    password: adminPassword,
                    name: 'Toolbox Admin',
                    profilePicUrl: 'https://xh.io/images/toolbox-admin-profile-pic.png'
                ).save(flush: true)
            } else if (!user.checkPassword(adminPassword)) {
                user.password = adminPassword
                user.save(flush: true)
            }

            logInfo("Local admin user available as per instanceConfig", adminUsername)
        }
    }

    private void logStartupMsg() {
        def buildLabel = appBuild != 'UNKNOWN' ? " [build $appBuild] " : " "

        logInfo("""
\n
 ______   ______     ______     __         ______     ______     __  __
/\\__  _\\ /\\  __ \\   /\\  __ \\   /\\ \\       /\\  == \\   /\\  __ \\   /\\_\\_\\_\\
\\/_/\\ \\/ \\ \\ \\/\\ \\  \\ \\ \\/\\ \\  \\ \\ \\____  \\ \\  __<   \\ \\ \\/\\ \\  \\/_/\\_\\/_
   \\ \\_\\  \\ \\_____\\  \\ \\_____\\  \\ \\_____\\  \\ \\_____\\  \\ \\_____\\   /\\_\\/\\_\\
    \\/_/   \\/_____/   \\/_____/   \\/_____/   \\/_____/   \\/_____/   \\/_/\\/_/
\n
         ${appName} v${appVersion}${buildLabel}${appEnvironment}
\n
        """)
    }

    private void ensureRequiredConfigsCreated() {
        configService.ensureRequiredConfigsCreated([
            auth0Config: [
                    valueType: 'json',
                    defaultValue: [
                            clientId: 'MUn9VrAGavF7n39RdhFYq8xkZkoFYEDB',
                            domain: 'login.xh.io'
                    ],
                    clientVisible: false,
                    groupName: 'Auth',
                    note: 'OAuth config for the Toolbox app registered at our Auth0 account. \n(https://manage.auth0.com/dashboard/us/xhio/)'
            ],
            contacts: [
                    valueType: 'json',
                    defaultValue: [
                            [
                                    id: '1',
                                    name: 'John Pierpont Morgan Sr.',
                                    location: 'New York',
                                    workPhone: '(212) 331-1913',
                                    cellPhone: '(212) 417-1837',
                                    email: 'JPMSr@godsoffinance.com',
                                    bio: 'John Pierpont Morgan Sr. was an American financier and investment banker who dominated corporate finance on Wall Street throughout the Gilded Age.',
                                    profilePicture: 'JP_Morgan.jpg',
                                    tags: [
                                            'banking',
                                            'finance',
                                            'Gilded Age'
                                    ]
                            ],
                            [
                                    id: '2',
                                    name: 'Cornelius Vanderbilt',
                                    location: 'New York',
                                    workPhone: '(212) 331-1877',
                                    cellPhone: '(212) 417-1794',
                                    email: 'CV@titansofindustry.com',
                                    bio: 'Shipping and railroad tycoon Cornelius Vanderbilt was a self-made multi-millionaire who became one of the wealthiest Americans of the 19th century. As a boy, he worked with his father, who operated a boat that ferried cargo between Staten Island, New York, where they lived, and Manhattan.',
                                    profilePicture: 'Cornelius_Vanderbilt_Daguerrotype2.jpg',
                                    tags: [
                                            'railroads',
                                            'tycoon',
                                            'Grand Central Station'
                                    ]
                            ],
                    ],
                    clientVisible: false,
                    groupName: 'Toolbox - Example Apps'
            ],
            entraIdConfig: [
                    valueType: 'json',
                    defaultValue: [
                            clientId: '5d933976-8fe4-40fc-bc13-b9d239a2efe5',
                            tenantId: '51759969-dc12-46ec-a1e9-2532084dc881'
                    ],
                    clientVisible: false,
                    groupName: 'Auth',
                    note: 'OAuth config for the Toolbox app registered at our Azure Entra ID tenant. For testing Entra ID as an alternate OAuth provider.'
            ],
            fileManagerStoragePath: [
                    valueType: 'string',
                    defaultValue: '/var/tmp/xh-toolbox',
                    clientVisible: false,
                    groupName: 'Toolbox - Example Apps',
                    note: 'Absolute path to disk location for storing uploaded files.'
            ],
            gitHubAccessToken: [
                    valueType: 'string',
                    defaultValue: 'realTokenGoesHere',
                    clientVisible: false,
                    groupName: 'GitHub Integration',
                    note: 'Personal access token with minimal scopes required to query public repos and commits.'
            ],
            gitHubCommitsRefreshMins: [
                    valueType: 'int',
                    defaultValue: 60,
                    clientVisible: false,
                    groupName: 'GitHub Integration',
                    note: 'Frequency with which the Toolbox server polls Git to look for updates. Note this functions mostly as a "catch up" sync - webhooks should trigger realtime updates on commits.'
            ],
            gitHubMaxPagesPerLoad: [
                    valueType: 'int',
                    defaultValue: 99,
                    clientVisible: false,
                    groupName: 'GitHub Integration',
                    note: 'Maximum number of pages to load when fetching commit history for a single repo. Set to a low number (1-2) in local development to minimize time spent loading commit histories while still getting some commits cached for display in the UI.'
            ],
            gitHubRepos: [
                    valueType: 'json',
                    defaultValue: [],
                    clientVisible: true,
                    groupName: 'GitHub Integration',
                    note: 'List of repos from which Toolbox will pull commits to display on its dashboard.'
            ],
            gitHubWebhookTriggerSecret: [
                    valueType: 'string',
                    defaultValue: 'realSecretGoesHere',
                    clientVisible: false,
                    groupName: 'GitHub Integration',
                    note: 'Random string used as a shared secret to verify triggers pushed to gitHub/webhookTrigger endpoint.'
            ],
            newsApiKey: [
                    valueType: 'string',
                    defaultValue: 'realApiKeyGoesHere',
                    clientVisible: false,
                    groupName: 'Toolbox - Example Apps'
            ],
            newsRefreshMins: [
                    valueType: 'int',
                    defaultValue: 60,
                    clientVisible: false,
                    groupName: 'Toolbox - Example Apps'
            ],
            newsSources: [
                    valueType: 'json',
                    defaultValue: [
                            cnn: 'CNN',
                            'google-news': 'Google News'
                    ],
                    clientVisible: false,
                    groupName: 'Toolbox - Example Apps'
            ],
            portfolioConfigs: [
                    valueType: 'json',
                    defaultValue: [
                            instrumentCount : 500,
                            orderCount : 20000,
                            updateIntervalSecs : 5,
                            updatePctInstruments : 20,
                            updatePctPriceRange : 0.025,
                            pushUpdatesIntervalSecs : 5
                    ],
                    clientVisible: false,
                    groupName: 'Toolbox - Example Apps'
            ],
            recallsHost: [
                    valueType: 'string',
                    defaultValue: 'api.fda.gov',
                    clientVisible: false,
                    groupName: 'Toolbox - Example Apps'
            ],
            sourceUrls: [
                    valueType: 'json',
                    defaultValue: [
                            hoistReact: 'https://github.com/xh/hoist-react/tree/develop',
                            toolbox: 'https://github.com/xh/toolbox/tree/develop'
                    ],
                    clientVisible: true,
                    groupName: 'Toolbox'
            ],
            jsLicenses: [
                    groupName: 'Toolbox',
                    valueType: 'json',
                    defaultValue: [agGrid: null],
                    clientVisible: true,
                    note: 'Provide any js licenses needed by client here.'
            ],
            cubeTestDefaultDims: [
                    groupName: 'Toolbox',
                    valueType: 'json',
                    defaultValue: [
                            [
                                    'fund',
                                    'trader'
                            ],
                            [
                                    'sector',
                                    'symbol'
                            ],
                            [
                                    'trader',
                                    'dir',
                                    'symbol'
                            ],
                            [
                                    'model',
                                    'sector',
                                    'symbol'
                            ],
                            [
                                    'model',
                                    'region',
                                    'trader',
                                    'symbol'
                            ]
                    ],
                    clientVisible: true
            ],
            searchOptions: [
                    groupName: 'Toolbox',
                    valueType: 'json',
                    defaultValue: [
                            [
                                label: "containers",
                                route: "default.layout",
                                options: [
                                    [
                                        label: "TabContainer",
                                        route: "default.layout.tabPanel"
                                    ],
                                    [
                                        label: "Top Tabs",
                                        route: "default.layout.tabPanel|Top"
                                    ],
                                    [
                                        label: "Bottom Tabs",
                                        route: "default.layout.tabPanel|Bottom"
                                    ],
                                    [
                                        label: "Left Tabs",
                                        route: "default.layout.tabPanel|Left"
                                    ],
                                    [
                                        label: "Right Tabs",
                                        route: "default.layout.tabPanel|Right"
                                    ],
                                    [
                                        label: "Custom Tab Switcher",
                                        route: "default.layout.tabPanel|Switcher"
                                    ],
                                    [
                                        label: "Tab State",
                                        route: "default.layout.tabPanel|State"
                                    ],
                                    [
                                        label: "Dynamic Tabs",
                                        route: "default.layout.tabPanel|Dynamic"
                                    ],
                                    [
                                        label: "DockContainer",
                                        route: "default.layout.dock"
                                    ],
                                    [
                                        label: "DashCanvas",
                                        route: "default.layout.dashCanvas"
                                    ],
                                    [
                                        label: "DashContainer",
                                        route: "default.layout.dashContainer"
                                    ],
                                    [
                                        label: "HBox",
                                        route: "default.layout.hbox"
                                    ],
                                    [
                                        label: "VBox",
                                        route: "default.layout.vbox"
                                    ],
                                    [
                                        label: "TileFrame",
                                        route: "default.layout.tileFrame"
                                    ]
                                ]
                            ],
                            [
                                label: "Examples",
                                route: "default.examples",
                                options: [
                                    [
                                        label: "Portfolio",
                                        route: "launch.examples.portfolio"
                                    ],
                                    [
                                        label: "News",
                                        route: "launch.examples.news"
                                    ],
                                    [
                                        label: "FDA Recalls",
                                        route: "launch.examples.recalls"
                                    ],
                                    [
                                        label: "File Manager",
                                        route: "launch.examples.fileManager"
                                    ]
                                ]
                            ],
                            [
                                label: "panels",
                                route: "default.panels",
                                options: [
                                    [
                                        label: "LoadingIndicator",
                                        route: "default.panels.loadingIndicator"
                                    ],
                                    [
                                        label: "Mask",
                                        route: "default.panels.mask"
                                    ],
                                    [
                                        label: "Sizing",
                                        route: "default.panels.sizing"
                                    ],
                                    [
                                        label: "Toolbars",
                                        route: "default.panels.toolbars"
                                    ]
                                ]
                            ],
                            [
                                label: "charts",
                                route: "default.charts",
                                options: [
                                    [
                                        label: "Line",
                                        route: "default.charts.line"
                                    ],
                                    [
                                        label: "Chart Aspect Ratio",
                                        route: "default.charts.line|AspectRatio"
                                    ],
                                    [
                                        label: "OHLC",
                                        route: "default.charts.ohlc"
                                    ],
                                    [
                                        label: "Grid TreeMap",
                                        route: "default.charts.gridTreeMap"
                                    ],
                                    [
                                        label: "Simple TreeMap",
                                        route: "default.charts.simpleTreeMap"
                                    ],
                                    [
                                        label: "Split TreeMap",
                                        route: "default.charts.splitTreeMap"
                                    ]
                                ]
                            ],
                            [
                                label: "grids",
                                route: "default.grids",
                                options: [
                                    [
                                        label: "Standard",
                                        route: "default.grids.standard"
                                    ],
                                    [
                                        label: "Tree with CheckBox",
                                        route: "default.grids.treeWithCheckBox"
                                    ],
                                    [
                                        label: "Grouped Rows",
                                        route: "default.grids.groupedRows"
                                    ],
                                    [
                                        label: "Grouped Cols",
                                        route: "default.grids.groupedCols"
                                    ],
                                    [
                                        label: "Dataview",
                                        route: "default.grids.dataview"
                                    ],
                                    [
                                        label: "agGrid",
                                        route: "default.grids.agGrid"
                                    ],
                                    [
                                        label: "Tree",
                                        route: "default.grids.tree"
                                    ],
                                    [
                                        label: "Rest",
                                        route: "default.grids.rest"
                                    ]
                                ]
                            ],
                            [
                                label: "forms",
                                route: "default.forms",
                                options: [
                                    [
                                        label: "Toolbar Form",
                                        route: "default.forms.toolbarForm"
                                    ],
                                    [
                                        label: "Inputs",
                                        route: "default.forms.inputs"
                                    ],
                                    [
                                        label: "TextInput",
                                        route: "default.forms.inputs|TextInput"
                                    ],
                                    [
                                        label: "TextArea",
                                        route: "default.forms.inputs|TextArea"
                                    ],
                                    [
                                        label: "JSONInput",
                                        route: "default.forms.inputs|JSONInput"
                                    ],
                                    [
                                        label: "NumberInput",
                                        route: "default.forms.inputs|NumberInput"
                                    ],
                                    [
                                        label: "Slider",
                                        route: "default.forms.inputs|Slider"
                                    ],
                                    [
                                        label: "DateInput",
                                        route: "default.forms.inputs|DateInput"
                                    ],
                                    [
                                        label: "Select",
                                        route: "default.forms.inputs|Select"
                                    ],
                                    [
                                        label: "Checkbox",
                                        route: "default.forms.inputs|Checkbox"
                                    ],
                                    [
                                        label: "ButtonGroupInput",
                                        route: "default.forms.inputs|ButtonGroupInput"
                                    ],
                                    [
                                        label: "RadioInput",
                                        route: "default.forms.inputs|RadioInput"
                                    ],
                                    [
                                        label: "Form",
                                        route: "default.forms.form"
                                    ]
                                ]
                            ],
                            [
                                label: "other",
                                route: "default.other",
                                options: [
                                    [
                                        label: "LeftRightChooser",
                                        route: "default.other.leftRightChooser"
                                    ],
                                    [
                                        label: "File Chooser",
                                        route: "default.other.fileChooser"
                                    ],
                                    [
                                        label: "Timestamp",
                                        route: "default.other.timestamp"
                                    ],
                                    [
                                        label: "PinPad",
                                        route: "default.other.pinPad"
                                    ],
                                    [
                                        label: "Clock",
                                        route: "default.other.clock"
                                    ],
                                    [
                                        label: "Icons",
                                        route: "default.other.icons"
                                    ],
                                    [
                                        label: "Element Factories vs. JSX",
                                        route: "default.other.jsx"
                                    ]
                                ]
                            ],
                            [
                                label: "App Notifications",
                                route: "default.other.appNotifications",
                                options: [
                                    [
                                        label: "App Update",
                                        route: "default.other.appNotifications|Update"
                                    ],
                                    [
                                        label: "App Sleep Mode",
                                        route: "default.other.appNotifications|Sleep"
                                    ]
                                ]
                            ],
                            [
                                label: "Number Formats",
                                route: "default.other.numberFormats",
                                options: [
                                    [
                                        label: "fmtNumber",
                                        route: "default.other.numberFormats|fmtNumber"
                                    ],
                                    [
                                        label: "fmtPrice",
                                        route: "default.other.numberFormats|fmtPrice"
                                    ],
                                    [
                                        label: "fmtQuantity",
                                        route: "default.other.numberFormats|fmtQuantity"
                                    ],
                                    [
                                        label: "fmtPercent",
                                        route: "default.other.numberFormats|fmtPercent"
                                    ],
                                    [
                                        label: "fmtThousands",
                                        route: "default.other.numberFormats|fmtThousands"
                                    ],
                                    [
                                        label: "fmtMillions",
                                        route: "default.other.numberFormats|fmtMillions"
                                    ],
                                    [
                                        label: "fmtBillions",
                                        route: "default.other.numberFormats|fmtBillions"
                                    ],
                                    [
                                        label: "Precision",
                                        route: "default.other.numberFormats|Precision"
                                    ],
                                    [
                                        label: "zeroPad",
                                        route: "default.other.numberFormats|zeroPad"
                                    ],
                                    [
                                        label: "ledger",
                                        route: "default.other.numberFormats|ledger"
                                    ],
                                    [
                                        label: "forceLedgerAlign",
                                        route: "default.other.numberFormats|forceLedgerAlign"
                                    ],
                                    [
                                        label: "colorSpec",
                                        route: "default.other.numberFormats|colorSpec"
                                    ],
                                    [
                                        label: "withPlusSign",
                                        route: "default.other.numberFormats|withPlusSign"
                                    ],
                                    [
                                        label: "withSignGlyph",
                                        route: "default.other.numberFormats|withSignGlyph"
                                    ],
                                    [
                                        label: "label",
                                        route: "default.other.numberFormats|label"
                                    ],
                                    [
                                        label: "nullDisplay",
                                        route: "default.other.numberFormats|nullDisplay"
                                    ]
                                ]
                            ],
                            [
                                label: "Date Formats",
                                route: "default.other.dateFormats",
                                options: [
                                    [
                                        label: "fmtDate",
                                        route: "default.other.dateFormats|fmtDate"
                                    ],
                                    [
                                        label: "fmtCompactDate",
                                        route: "default.other.dateFormats|fmtCompactDate"
                                    ],
                                    [
                                        label: "fmtDateTime",
                                        route: "default.other.dateFormats|fmtDateTime"
                                    ],
                                    [
                                        label: "fmtTime",
                                        route: "default.other.dateFormats|fmtTime"
                                    ],
                                    [
                                        label: "tooltip",
                                        route: "default.other.dateFormats|tooltip"
                                    ]
                                ]
                            ],
                            [
                                label: "Popups",
                                route: "default.other.popups",
                                options: [
                                    [
                                        label: "Alert",
                                        route: "default.other.popups|Alert"
                                    ],
                                    [
                                        label: "Confirm",
                                        route: "default.other.popups|Confirm"
                                    ],
                                    [
                                        label: "Prompt",
                                        route: "default.other.popups|Prompt"
                                    ],
                                    [
                                        label: "Message",
                                        route: "default.other.popups|Message"
                                    ],
                                    [
                                        label: "Toast",
                                        route: "default.other.popups|Toast"
                                    ]
                                ]
                            ]
                    ],
                    clientVisible: true
            ]
        ])
    }

    private void ensureRequiredPrefsCreated() {
        prefService.ensureRequiredPrefsCreated([
            appMenuButtonWithUserProfile: [
                type: 'bool',
                defaultValue: false,
                groupName: 'Toolbox',
                note: 'True to render the main app menu button using the alternate user profile (initials) mode.'
            ],
            contactAppState: [
                    type: 'json',
                    defaultValue: [],
                    groupName: 'Toolbox - Example Apps',
                    note: 'Holds favorites, grid state, and displayMode prefs for the XH Contact example app.'
            ],
            expandDockedLinks: [
                    type: 'bool',
                    defaultValue: false,
                    groupName: 'Toolbox',
                    note: 'True to expand the docked linked panel by default, false to start collapsed.'
            ],
            todoTasks: [
                    type: 'json',
                    defaultValue: [
                            [
                                id: 1,
                                description: 'Set up MySQL DB called "toolbox".',
                                complete: false,
                                dueDate: LocalDate.now()
                            ],
                            [
                                id: 2,
                                description: 'Update Instance Config file "toolbox.yml" with the new values for "dbHost", "dbSchema",  "dbUser", and "dbPassword".',
                                complete: false,
                                dueDate: LocalDate.now()
                            ],
                            [
                                id: 3,
                                description: 'Update Instance Config file "toolbox.yml" key "useH2" to "false".',
                                complete: false,
                                dueDate: LocalDate.now()
                            ],
                            [
                                id: 4,
                                description: 'Restart the Grails Server.',
                                complete: false,
                                dueDate: LocalDate.now()
                            ]
                    ],
                    groupName: 'Toolbox - Example Apps',
                    note: 'Lightweight storage for tasks added by users in the TODO example app.'
            ],
            cubeTestUserDims: [
                    groupName: 'Toolbox',
                    type: 'json',
                    defaultValue: []
            ]
        ])
    }
}
