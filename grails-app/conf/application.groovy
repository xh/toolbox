import io.xh.hoist.configuration.ApplicationConfig

ApplicationConfig.defaultConfig(this)

grails {
    project.groupId = 'io.xh.toolbox'
    app.context = '/'
    resources.pattern = '/**'
}

hoist.enableWebSockets = true
