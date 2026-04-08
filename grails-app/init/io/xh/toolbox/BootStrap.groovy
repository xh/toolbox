package io.xh.toolbox

import grails.gorm.transactions.Transactional
import io.xh.hoist.config.ConfigService
import io.xh.hoist.config.ConfigSpec
import io.xh.hoist.log.LogSupport
import io.xh.hoist.pref.PrefService
import io.xh.hoist.pref.PreferenceSpec
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
            new ConfigSpec(
                name: 'auth0Config',
                valueType: 'json',
                defaultValue: [
                    clientId: 'MUn9VrAGavF7n39RdhFYq8xkZkoFYEDB',
                    domain: 'login.xh.io'
                ],
                groupName: 'Auth',
                note: 'OAuth config for the Toolbox app registered at our Auth0 account. \n(https://manage.auth0.com/dashboard/us/xhio/)'
            ),
            new ConfigSpec(
                name: 'contacts',
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
                groupName: 'Toolbox - Example Apps'
            ),
            new ConfigSpec(
                name: 'entraIdConfig',
                valueType: 'json',
                defaultValue: [
                    clientId: '5d933976-8fe4-40fc-bc13-b9d239a2efe5',
                    tenantId: '51759969-dc12-46ec-a1e9-2532084dc881'
                ],
                groupName: 'Auth',
                note: 'OAuth config for the Toolbox app registered at our Azure Entra ID tenant. For testing Entra ID as an alternate OAuth provider.'
            ),
            new ConfigSpec(
                name: 'fileManagerStoragePath',
                valueType: 'string',
                defaultValue: '/var/tmp/xh-toolbox',
                groupName: 'Toolbox - Example Apps',
                note: 'Absolute path to disk location for storing uploaded files.'
            ),
            new ConfigSpec(
                name: 'gitHubAccessToken',
                valueType: 'string',
                defaultValue: 'realTokenGoesHere',
                groupName: 'GitHub Integration',
                note: 'Personal access token with minimal scopes required to query public repos and commits.'
            ),
            new ConfigSpec(
                name: 'gitHubCommitsRefreshMins',
                valueType: 'int',
                defaultValue: 60,
                groupName: 'GitHub Integration',
                note: 'Frequency with which the Toolbox server polls Git to look for updates. Note this functions mostly as a "catch up" sync - webhooks should trigger realtime updates on commits.'
            ),
            new ConfigSpec(
                name: 'gitHubMaxPagesPerLoad',
                valueType: 'int',
                defaultValue: 99,
                groupName: 'GitHub Integration',
                note: 'Maximum number of pages to load when fetching commit history for a single repo. Set to a low number (1-2) in local development to minimize time spent loading commit histories while still getting some commits cached for display in the UI.'
            ),
            new ConfigSpec(
                name: 'gitHubRepos',
                valueType: 'json',
                defaultValue: [],
                clientVisible: true,
                groupName: 'GitHub Integration',
                note: 'List of repos from which Toolbox will pull commits to display on its dashboard.'
            ),
            new ConfigSpec(
                name: 'gitHubWebhookTriggerSecret',
                valueType: 'string',
                defaultValue: 'realSecretGoesHere',
                groupName: 'GitHub Integration',
                note: 'Random string used as a shared secret to verify triggers pushed to gitHub/webhookTrigger endpoint.'
            ),
            new ConfigSpec(
                name: 'newsApiKey',
                valueType: 'string',
                defaultValue: 'realApiKeyGoesHere',
                groupName: 'Toolbox - Example Apps'
            ),
            new ConfigSpec(
                name: 'weatherApiKey',
                valueType: 'string',
                defaultValue: 'UNCONFIGURED',
                groupName: 'Toolbox - Example Apps',
                note: 'API key for OpenWeatherMap (https://openweathermap.org/api). Sign up for a free key.'
            ),
            new ConfigSpec(
                name: 'newsRefreshMins',
                valueType: 'int',
                defaultValue: 60,
                groupName: 'Toolbox - Example Apps'
            ),
            new ConfigSpec(
                name: 'newsSources',
                valueType: 'json',
                defaultValue: [
                    cnn: 'CNN',
                    'google-news': 'Google News'
                ],
                groupName: 'Toolbox - Example Apps'
            ),
            new ConfigSpec(
                name: 'portfolioConfigs',
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
            ),
            new ConfigSpec(
                name: 'recallsHost',
                valueType: 'string',
                defaultValue: 'api.fda.gov',
                groupName: 'Toolbox - Example Apps'
            ),
            new ConfigSpec(
                name: 'sourceUrls',
                valueType: 'json',
                defaultValue: [
                    hoistReact: 'https://github.com/xh/hoist-react/tree/develop',
                    toolbox: 'https://github.com/xh/toolbox/tree/develop'
                ],
                clientVisible: true,
                groupName: 'Toolbox'
            ),
            new ConfigSpec(
                name: 'jsLicenses',
                valueType: 'json',
                defaultValue: [agGrid: null],
                clientVisible: true,
                groupName: 'Toolbox',
                note: 'Provide any js licenses needed by client here.'
            ),
            new ConfigSpec(
                name: 'cubeTestDefaultDims',
                valueType: 'json',
                defaultValue: [
                    ['fund', 'trader'],
                    ['sector', 'symbol'],
                    ['trader', 'dir', 'symbol'],
                    ['model', 'sector', 'symbol'],
                    ['model', 'region', 'trader', 'symbol']
                ],
                clientVisible: true,
                groupName: 'Toolbox'
            )
        ])
    }

    private void ensureRequiredPrefsCreated() {
        prefService.ensureRequiredPrefsCreated([
            new PreferenceSpec(
                name: 'appMenuButtonWithUserProfile',
                type: 'bool',
                defaultValue: false,
                groupName: 'Toolbox',
                notes: 'True to render the main app menu button using the alternate user profile (initials) mode.'
            ),
            new PreferenceSpec(
                name: 'contactAppState',
                type: 'json',
                defaultValue: [],
                groupName: 'Toolbox - Example Apps',
                notes: 'Holds favorites, grid state, and displayMode prefs for the XH Contact example app.'
            ),
            new PreferenceSpec(
                name: 'expandDockedLinks',
                type: 'bool',
                defaultValue: false,
                groupName: 'Toolbox',
                notes: 'True to expand the docked linked panel by default, false to start collapsed.'
            ),
            new PreferenceSpec(
                name: 'todoTasks',
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
                notes: 'Lightweight storage for tasks added by users in the TODO example app.'
            ),
            new PreferenceSpec(
                name: 'cubeTestUserDims',
                type: 'json',
                defaultValue: [],
                groupName: 'Toolbox'
            )
        ])
    }
}
