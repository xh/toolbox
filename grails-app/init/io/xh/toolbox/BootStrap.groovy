package io.xh.toolbox

import grails.gorm.transactions.Transactional
import io.xh.hoist.util.Utils
import io.xh.toolbox.user.User
import io.xh.hoist.BaseService

import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig

import static io.xh.hoist.util.Utils.appEnvironment
import static io.xh.hoist.util.Utils.appName
import static io.xh.hoist.util.Utils.appVersion

class BootStrap {

    def init = {servletContext ->
        logStartupMsg()
        ensureRequiredConfigsCreated()
        ensureRequiredPrefsCreated()
        def services = Utils.xhServices.findAll {
            it.class.canonicalName.startsWith(this.class.package.name)
        }
        BaseService.parallelInit(services)

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
                ).save()
            } else if (!user.checkPassword(adminPassword)) {
                user.password = adminPassword
                user.save()
            }

            log.info("Local admin user available as per instanceConfig | $adminUsername")

            Utils.configService.ensureRequiredConfigsCreated(
                roles: [
                    valueType: 'json',
                    defaultValue: ['HOIST_ADMIN': [adminUsername], 'APP_READER': [adminUsername]]
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
        Utils.configService.ensureRequiredConfigsCreated([
                portfolioConfigs: [
                        valueType: 'json',
                        defaultValue: [
                                "instrumentCount" : 500,
                                "orderCount" : 20000,
                                "updateIntervalSecs" : 5,
                                "updatePctInstruments" : 20,
                                "updatePctPriceRange" : 0.025,
                                "pushUpdatesIntervalSecs" : 5                        ],
                        clientVisible: false,
                        groupName: 'Toolbox - Example Apps'
                ]
        ])
    }

    private void ensureRequiredPrefsCreated() {
        Utils.prefService.ensureRequiredPrefsCreated([
                expandDockedLinks: [
                        type: 'bool',
                        defaultValue: false,
                        groupName: 'Toolbox',
                        note: 'True to expand the docked linked panel by default, false to start collapsed.'
                ]
        ])
    }
}
