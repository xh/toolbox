hoistDefaults()

// See also runtime.groovy for additional instance-specific configuration

grails {
    project.groupId = 'io.xh.toolbox'
    app.context = '/'
    resources.pattern = '/**'
}

dataSource {
    dbCreate = "update"
    url = "jdbc:h2:mem:testDb;MVCC=TRUE"
    driverClassName = "org.h2.Driver"
    username = "sa"
    password = ""
}

//------------------------------------------------------------
// Hoist defaults -- Do Not typically Modify after this line
//-------------------------------------------------------------
private void hoistDefaults() {

    grails {
        cors.enabled = true
        spring {
            transactionManagement.proxies = false    // use @Transaction for services
            groovy.template.'check-template-location' = false
            bean.packages = []
        }

        endpoints {
            enabled = false    // selectively enable these, after lockdown
        }

        mime {
            disable.accept.header.userAgents = ['Gecko', 'WebKit', 'Presto', 'Trident']
            types = [
                    all          : '*/*',
                    atom         : 'application/atom+xml',
                    css          : 'text/css',
                    csv          : 'text/csv',
                    form         : 'application/x-www-form-urlencoded',
                    html         : ['text/html', 'application/xhtml+xml'],
                    js           : 'text/javascript',
                    json         : ['application/json', 'text/json'],
                    multipartForm: 'multipart/form-data',
                    rss          : 'application/rss+xml',
                    text         : 'text/plain',
                    hal          : ['application/hal+json', 'application/hal+xml'],
                    xml          : ['text/xml', 'application/xml'],
                    excel        : 'application/vnd.ms-excel'
            ]
        }

        views.default.codec = 'none'
        views.gsp.encoding = 'UTF-8'

        urlmapping.cache.maxsize = 1000
        controllers.defaultScope = 'singleton'          // 'prototype' (default), recommended for closure actions,
        // 'singleton is recommended for method actions
        converters.encoding = 'UTF-8'
        enable.native2ascii = true
        web.disable.multipart = false
        exceptionresolver.params.exclude = ['password']

        gorm {
            failOnError = true
            flushMode = 'AUTO'
        }
    }

    hibernate {
        cache {
            use_second_level_cache = true
            queries = true
            use_query_cache = true
            region.factory_class = 'org.hibernate.cache.ehcache.SingletonEhCacheRegionFactory'
        }
        flush {
            mode = 'AUTO'
        }
        show_sql = false
    }
}
