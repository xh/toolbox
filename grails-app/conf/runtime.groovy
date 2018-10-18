import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig
import static io.xh.hoist.util.Utils.getAppCode


grails.serverURL = getInstanceConfig('serverURL')

//---------------------
// Datasource
// Use in-memory DB if instance config does not provide a real MySQL host and credentials.
//---------------------
def dbHost = getInstanceConfig('dbHost')

if (!dbHost) {

    dataSource {
        dbCreate = 'update'
        url = "jdbc:h2:mem:testDb;MVCC=TRUE"
        driverClassName = "org.h2.Driver"
        username = "sa"
        password = ""
    }

} else {
    def dbCreateMode = getInstanceConfig('dbCreate') ?: 'update',
        dbSchema = getInstanceConfig('dbSchema') ?: appCode,
        dbUser = getInstanceConfig('dbUser') ?: appCode,
        dbPassword = getInstanceConfig('dbPassword')

    dataSource {
        pooled = true
        jmxExport = true
        driverClassName = "com.mysql.jdbc.Driver"
        dialect = org.hibernate.dialect.MySQL5InnoDBDialect
        dbCreate = dbCreateMode
        username = dbUser
        password = dbPassword
    }

    environments {
        development {
            dataSource {
                url = "jdbc:mysql://$dbHost/$dbSchema?useUnicode=yes&characterEncoding=UTF-8&useSSL=false"
            }
        }
        production {
            dataSource {
                url = "jdbc:mysql://$dbHost/$dbSchema?useUnicode=yes&characterEncoding=UTF-8"
                //noinspection GroovyAssignabilityCheck
                properties {
                    jmxEnabled = true
                    initialSize = 5
                    maxActive = 50
                    minIdle = 5
                    maxIdle = 25
                    maxWait = 10000
                    maxAge = 10 * 60000
                    timeBetweenEvictionRunsMillis = 5000
                    minEvictableIdleTimeMillis = 60000
                    validationQuery = "SELECT 1"
                    validationQueryTimeout = 3
                    validationInterval = 15000
                    testOnBorrow = true
                    testWhileIdle = true
                    testOnReturn = false
                    ignoreExceptionOnPreLoad = true
                    jdbcInterceptors = "ConnectionState;StatementCache(max=200)"
                    defaultTransactionIsolation = java.sql.Connection.TRANSACTION_READ_COMMITTED
                    abandonWhenPercentageFull = 100
                    removeAbandonedTimeout = 120000
                    removeAbandoned = true
                    logAbandoned = false
                    dbProperties {
                        autoReconnect = false
                        jdbcCompliantTruncation = false
                        zeroDateTimeBehavior = 'convertToNull'
                        cachePrepStmts = false
                        cacheCallableStmts = false
                        dontTrackOpenResources = true
                        holdResultsOpenOverStatementClose = true
                        useServerPrepStmts = false
                        cacheServerConfiguration = true
                        cacheResultSetMetadata = true
                        metadataCacheSize = 100
                        connectTimeout = 15000
                        socketTimeout = 120000
                    }
                }
            }
        }
    }
}


//---------------------
// Mail
//---------------------
grails {
    mail {
        host = getInstanceConfig('smtpHost')
        port = 465
        username = getInstanceConfig('smtpUser')
        password = getInstanceConfig('smtpPassword')
        props = [
            'mail.smtp.auth': 'true',
            'mail.smtp.socketFactory.port': '465',
            'mail.smtp.socketFactory.class': 'javax.net.ssl.SSLSocketFactory',
            'mail.smtp.socketFactory.fallback': 'false'
        ]
    }
}
