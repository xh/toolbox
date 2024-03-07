package io.xh.toolbox

import grails.gorm.transactions.Transactional
import io.xh.hoist.config.ConfigService
import io.xh.hoist.pref.PrefService
import io.xh.toolbox.user.User

import java.time.LocalDate

import static io.xh.hoist.BaseService.parallelInit
import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig
import static io.xh.hoist.util.Utils.*

class BootStrap {

    ConfigService configService
    PrefService prefService

    def init = {servletContext ->
        logStartupMsg()

        ensureRequiredConfigsCreated()
        ensureRequiredPrefsCreated()

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
            auth0ClientId: [
                    valueType: 'string',
                    defaultValue: 'MUn9VrAGavF7n39RdhFYq8xkZkoFYEDB',
                    clientVisible: false,
                    groupName: 'Auth0',
                    note: 'Client ID of the Toolbox app registered at our Auth0 account. \n(https://manage.auth0.com/dashboard/us/xhio/)'
            ],
            auth0Domain: [
                    valueType: 'string',
                    defaultValue: 'login.xh.io',
                    clientVisible: false,
                    groupName: 'Auth0',
                    note: 'Custom domain for our Auth0 deployment. OAuth login flow will redirect users here.'
            ],
            auth0Jwks: [
                    valueType: 'json',
                    defaultValue: [
                            // This is a public key from Auth0, so it's safe to commit to the repo.
                            keys: [
                                    [
                                            "alg": "RS256",
                                            "kty": "RSA",
                                            "use": "sig",
                                            "n": "rQxRn6prKsjL_ZSu4oB7NwO74i6hTuaQBcUx0P0_YJDbZc9_5r5NzIxsooW_caCJa_uR0VRrcjFOA35jzRrGuuKS_Z7fRPZf8uawV4j0e1RbHp7odAMq7hB60DOWL1CgcwCkB3uh2w8quHILfEQ_WHbXYHJLjTx84bDvQ-07xk_Pk_l4uv10mdSc3K6oGZFpbbAqptNaUAiUr_LwAaITTROBQvwec5ckN07pqXV0S1k2PUzzqExbjL7NKqoO0QCh9491F-JU4Xb77dfmqQMD1d3Y5bC4K01TrpP8I8Ezj-Y9DYMneBghgLKt0hnZASbW6Z6EmtZ6rH7IhEqRvs_XQQ",
                                            "e": "AQAB",
                                            "kid": "AnSBZq98n8kTu5ZZVcI6z",
                                            "x5t": "h-ngbFtTRUj7_Hk4PEpGEQPz6uk",
                                            "x5c": [
                                                    "MIIC/TCCAeWgAwIBAgIJSGMPmUBy4SFdMA0GCSqGSIb3DQEBCwUAMBwxGjAYBgNVBAMTEXhoaW8udXMuYXV0aDAuY29tMB4XDTIwMDkyNDE1MDkxM1oXDTM0MDYwMzE1MDkxM1owHDEaMBgGA1UEAxMReGhpby51cy5hdXRoMC5jb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCtDFGfqmsqyMv9lK7igHs3A7viLqFO5pAFxTHQ/T9gkNtlz3/mvk3MjGyihb9xoIlr+5HRVGtyMU4DfmPNGsa64pL9nt9E9l/y5rBXiPR7VFsenuh0AyruEHrQM5YvUKBzAKQHe6HbDyq4cgt8RD9YdtdgckuNPHzhsO9D7TvGT8+T+Xi6/XSZ1JzcrqgZkWltsCqm01pQCJSv8vABohNNE4FC/B5zlyQ3TumpdXRLWTY9TPOoTFuMvs0qqg7RAKH3j3UX4lThdvvt1+apAwPV3djlsLgrTVOuk/wjwTOP5j0Ngyd4GCGAsq3SGdkBJtbpnoSa1nqsfsiESpG+z9dBAgMBAAGjQjBAMA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFACMb6rB4OR4LcecDazvYolIFAqLMA4GA1UdDwEB/wQEAwIChDANBgkqhkiG9w0BAQsFAAOCAQEAUu3qr9u0wpKus22n1Ugyj3IJRbkaJYkScs6kOforOVMPm6OcaUahhGgn58szc7I6iQcMqJePdDsQPlrs+SFH3RxtPsTq/hzxYTS9q07OfENEMxGUymoKUau41exSl6prF3wkaXpY0iGpzXxjH883sAhfn41ewIC1S8Zpcgg6dz/leOD/MMW2rbngWDAGBT5EAU9w561LPdi/M7/Ahb8JrGqe83sj+N1aSkm5FlJSCZMV9Cx2zfNPe2ivfEfDlVZkl+wwMH0zJ2hPqY/eHXDXOQO01O8r+4TR3h703e+BJL1vpCJT7j/kmjdMyA79Mw+zEBuofmQoWYoEhD+oM7uOiQ=="
                                            ]
                                    ]
                            ]
                    ],
                    clientVisible: false,
                    groupName: 'Auth0',
                    note: 'JSON Web Key Set (JWKS) for validating Auth0 ID tokens.'
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
            ],
            jsLicenses: [
                    groupName: 'Toolbox',
                    valueType: 'json',
                    defaultValue: [agGrid: null],
                    clientVisible: true,
                    note: 'Provide any js licenses needed by client here.'
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
