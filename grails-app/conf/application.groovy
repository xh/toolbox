hoistDefaults()

// See also runtime.groovy for additional instance-specific configuration
grails {
    project.groupId = 'io.xh.toolbox'
    app.context = '/'
    resources.pattern = '/**'
}

//------------------------------------------------------------
// Hoist defaults -- Do Not typically Modify after this line
//-------------------------------------------------------------
private void hoistDefaults() {

    grails {
        cors.enabled = true
        spring {
            transactionManagement.proxies = false // use @Transaction for services
            groovy.template.'check-template-location' = false
            bean.packages = []
        }

        endpoints {
            enabled = false
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

        controllers {
            defaultScope = 'singleton'

            // Increase limits to 20mb to support large grid exports, other file uploads.
            upload {
                maxFileSize = 20971520
                maxRequestSize = 20971520
            }
        }

        views.default.codec = 'none'
        views.gsp.encoding = 'UTF-8'

        urlmapping.cache.maxsize = 1000
        converters.encoding = 'UTF-8'
        enable.native2ascii = true
        web.disable.multipart = false
        exceptionresolver.params.exclude = ['password', 'pin']

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
