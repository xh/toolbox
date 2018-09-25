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
        def services = Utils.xhServices.findAll {it.class.canonicalName.startsWith('io.xh.toolbox')}
        BaseService.parallelInit(services)
        ensureAdminUserCreated()
        ensureNoRoleUserCreated()
        ensureInactiveUserCreated()
    }

    def destroy = {}


    //------------------------
    // Implementation
    //------------------------
    private void ensureAdminUserCreated() {

        def adminUsername = getInstanceConfig('adminUsername')
        def adminPassword = getInstanceConfig('adminPassword')

        if (adminUsername && adminPassword) {
            def adminUser = User.findByEmail(adminUsername)
            if (!adminUser) {
                new User([
                        email: adminUsername,
                        firstName: 'Toolbox',
                        lastName: 'Admin',
                        password: adminPassword,
                        isAdmin: true
                ]).save()
            }
            createDemoUser(isAdmin: false)
        } else {
            createDemoUser(isAdmin: true)
        }
    }

    private void createDemoUser(Map opts) {
        def demoUser = User.findByEmail('toolbox@xh.io')
        if (!demoUser) {
            new User([
                    email: 'toolbox@xh.io',
                    firstName: 'Toolbox',
                    lastName: 'Demo',
                    password: 'toolbox',
                    isAdmin: opts.isAdmin
            ]).save()
        }
    }

    private void ensureNoRoleUserCreated() {
        def user = User.findByEmail('norole@xh.io')
        if (!user) {
            new User([
                    email: 'norole@xh.io',
                    firstName: 'No',
                    lastName: 'Role',
                    password: 'norole',
                    isAdmin: false
            ]).save()
        }
    }


    private void ensureInactiveUserCreated() {
        def user = User.findByEmail('inactive@xh.io')
        if (!user) {
            new User([
                    email: 'inactive@xh.io',
                    firstName: 'Not',
                    lastName: 'Active',
                    password: 'password',
                    isAdmin: false,
                    enabled: false
            ]).save()
        }
    }

    private void ensureRequiredConfigsCreated() {
        Utils.configService.ensureRequiredConfigsCreated([
                newsApiKey : [
                        valueType   : 'string',
                        defaultValue: 'ab052127f3e349d38db094eade1d96d8',
                        groupName   : 'News'
                ],
                newsSources: [
                        valueType   : 'json',
                        defaultValue: [
                                "cnbc"     : "CNBC",
                                "fortune"  : "Fortune",
                                "reuters"  : "Reuters"
                        ],
                        groupName   : 'News'
                ],
                newsRefreshMins : [
                        valueType: 'int',
                        defaultValue: 60,
                        groupName: 'News'
                ]
        ])
    }

    private void ensureMonitorsCreated() {
        new Monitor(
                code: 'newsStories',
                name: 'Cached Stories',
                metricType: 'Floor',
                failThreshold: 0,
                metricUnit: 'stories',
                active: true
        ).save()
        new Monitor(
                code: 'lastUpdate',
                name: 'Most Recent Story',
                metricType: 'Ceil',
                metricUnit: 'hours since last story',
                warnThreshold: 12,
                active: true
        ).save()
        new Monitor(
                code: 'sourcesLoaded',
                name: 'All Sources Loaded',
                metricType: 'None',
                metricUnit: 'sources',
                active: true
        ).save()
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
