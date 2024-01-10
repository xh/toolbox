package io.xh.toolbox

import grails.gorm.transactions.Transactional
import io.xh.hoist.config.ConfigService
import io.xh.hoist.pref.PrefService
import io.xh.hoist.role.provided.RoleAdminService
import io.xh.toolbox.user.User

import java.time.LocalDate

import static io.xh.hoist.BaseService.parallelInit
import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig
import static io.xh.hoist.util.Utils.*

class BootStrap {

    ConfigService configService
    PrefService prefService
    RoleAdminService roleAdminService

    def init = {servletContext ->
        logStartupMsg()

        ensureRequiredConfigsCreated()
        ensureRequiredPrefsCreated()

        def services = xhServices.findAll {
            it.class.canonicalName.startsWith(this.class.package.name)
        }
        parallelInit(services)

        JavaTest.helloWorld()
        createLocalAdminUserIfNeeded()
    }

    def destroy = {}

    //------------------------
    // Implementation
    //------------------------
    @Transactional
    private void createLocalAdminUserIfNeeded() {
        String adminUsername = getInstanceConfig('adminUsername')
        String adminPassword = getInstanceConfig('adminPassword')

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

            log.info("Local admin user available as per instanceConfig | $adminUsername")

            configService.ensureRequiredConfigsCreated(
                jsLicenses: [
                    groupName: 'Toolbox',
                    valueType: 'json',
                    defaultValue: [agGrid: null],
                    clientVisible: true,
                    note: 'Provide any js licenses needed by client here.'
                ]
            )
        } else {
            log.warn("Default admin user not created. To provide admin access, specify credentials in a toolbox.yml instance config file.")
        }
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

    private void ensureRequiredConfigsCreated() {
        configService.ensureRequiredConfigsCreated([
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
            fileManagerStoragePath: [
                    valueType: 'string',
                    defaultValue: '/toolbox/fileManager',
                    clientVisible: false,
                    groupName: 'Toolbox - Example Apps',
                    note: 'Absolute path to disk location for storing uploaded files.'
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
            ]
        ])
    }

    private void ensureRequiredPrefsCreated() {
        prefService.ensureRequiredPrefsCreated([
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
            ]
        ])
    }
}
