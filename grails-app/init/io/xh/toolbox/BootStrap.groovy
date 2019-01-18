package io.xh.toolbox

import io.xh.hoist.util.Utils
import io.xh.toolbox.user.User
import io.xh.hoist.BaseService
import io.xh.hoist.monitor.Monitor
import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig


import static io.xh.hoist.util.Utils.appEnvironment
import static io.xh.hoist.util.Utils.appName
import static io.xh.hoist.util.Utils.appVersion

class BootStrap {

    def init = {servletContext ->
        logStartupMsg()
        ensureRequiredConfigsCreated()
        ensureMonitorsCreated()
        ensureRequiredPrefsCreated()
        def services = Utils.xhServices.findAll {it.class.canonicalName.startsWith('io.xh.toolbox')}
        BaseService.parallelInit(services)
        ensureUsersCreated()
    }

    def destroy = {}


    //------------------------
    // Implementation
    //------------------------
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
        def user = User.findByEmail(data.email)
        if (!user) new User(data).save()
    }

    private void ensureRequiredPrefsCreated() {
        Utils.prefService.ensureRequiredPrefsCreated([
                mobileDimHistory: [
                        type: 'json',
                        defaultValue: [],
                        local: true,
                        groupName: 'Toolbox',
                        note: 'Nested arrays containing user\'s dimension picker history'
                ],
                portfolioDimHistory: [
                        type: 'json',
                        defaultValue: [],
                        local: true,
                        groupName: 'Toolbox',
                        note: 'Nested arrays containing user\'s dimension picker history'
                ]
            ])
    }

    private void ensureRequiredConfigsCreated() {
        def adminUsername = getInstanceConfig('adminUsername')

        Utils.configService.ensureRequiredConfigsCreated([
                roles: [
                    valueType: 'json',
                    defaultValue: [
                        APP_READER: ['toolbox@xh.io', 'inactive@xh.io', adminUsername].findAll{it},
                        HOIST_ADMIN: [adminUsername].findAll{it}
                    ],
                    groupName: 'Permissions'
                ],
                newsApiKey : [
                        valueType: 'string',
                        defaultValue: 'ab052127f3e349d38db094eade1d96d8',
                        groupName: 'News'
                ],
                newsSources: [
                        valueType: 'json',
                        defaultValue: [
                                "cnbc"     : "CNBC",
                                "fortune"  : "Fortune",
                                "reuters"  : "Reuters"
                        ],
                        groupName: 'News'
                ],
                newsRefreshMins: [
                        valueType: 'int',
                        defaultValue: 60,
                        groupName: 'News'
                ],
                fileManagerStorageDir: [
                        valueType: 'string',
                        defaultValue: '/var/tmp/toolbox',
                        groupName: 'File Manager',
                        note: 'Absolute path to disk location for storing uploaded files.'
                ]
        ])
    }

    private void ensureMonitorsCreated() {
        createMonitorIfNeeded(
                code: 'newsStoryCount',
                name: 'Loaded Stories',
                metricType: 'Floor',
                failThreshold: 0,
                metricUnit: 'stories',
                active: true
        )
        createMonitorIfNeeded(
                code: 'lastUpdateAgeMins',
                name: 'Most Recent Story',
                metricType: 'Ceil',
                metricUnit: 'minutes since last story',
                warnThreshold: 60,
                failThreshold: 360,
                active: true
        )
        createMonitorIfNeeded(
                code: 'loadedSourcesCount',
                name: 'All Sources Loaded',
                metricType: 'None',
                metricUnit: 'sources',
                active: true
        )
    }

    private void createMonitorIfNeeded(Map data) {
        def monitor = Monitor.findByCode(data.code)
        if (!monitor) new Monitor(data).save()
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
