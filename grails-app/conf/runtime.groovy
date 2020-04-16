import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig
import static io.xh.hoist.util.Utils.getAppCode
import static io.xh.hoist.util.DateTimeUtils.HOURS
import static io.xh.hoist.util.DateTimeUtils.MINUTES
import static io.xh.hoist.util.DateTimeUtils.SECONDS
import static java.sql.Connection.TRANSACTION_READ_COMMITTED

grails.serverURL = getInstanceConfig('serverURL')

//---------------------
// Datasource - for this app's persistent domain objects, including e.g. Hoist configs and prefs.
// Toolbox will use either a transient in-memory DB or expect MySQL.
// Other apps can use any DB supported by Grails (SQL Server, Postgres, etc).
//---------------------
def dbHost = getInstanceConfig('dbHost')

if (!dbHost) {
    // Use in-memory DB if instance config does not provide a real MySQL host and credentials.
    // Useful to get developers up and running immediately w/o need for a local DB setup.
    dataSource {
        dbCreate = 'update'
        url = "jdbc:h2:mem:testDb;MVCC=TRUE"
        driverClassName = "org.h2.Driver"
        username = "sa"
        password = ""
    }

} else {
    // Otherwise, configure a "real" DB connection, as we would do for business applications.
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

        // Config for Tomcat JDBC Pool - the values below have been customized off of the
        // defaults to ensure idle/abandoned connections are validated and cleaned up more
        // aggressively than they would be otherwise. Most of these overrides have been
        // sourced from the defaults Grails produces when running `create-app`.
        //
        // See Tomcat docs for details on these settings and defaults:
        // http://tomcat.apache.org/tomcat-8.5-doc/jdbc-pool.html#Common_Attributes
        // https://tomcat.apache.org/tomcat-8.5-doc/api/org/apache/tomcat/jdbc/pool/PoolConfiguration.html
        //noinspection GroovyAssignabilityCheck
        properties {
            //------------------------
            // Pool sizing
            // Note number of connections tuned *down* from Tomcat pool defaults,
            //------------------------
            // Init with this many.
            initialSize = 5
            // Create/allocate up to this many.
            maxActive = 50
            // Max overall age of connection - drop/reconnect on borrow/return if older.
            maxAge = 2 * HOURS
            // Max time to wait for requested conn before throwing exception to app.
            maxWait = 15 * SECONDS

            //------------------------
            // Connection validation
            //------------------------
            // Test after establishing a connection...
            testOnConnect = true
            // ...and before handing out an existing connection...
            testOnBorrow = true
            // ...but test each connection no more than once per this interval...
            validationInterval = 15 * SECONDS
            // ...by issuing this query...
            validationQuery = "/* ${appCode} connection validation */ SELECT 1"
            // ...giving it this long to complete (this one is in seconds!)
            validationQueryTimeout = 3

            //------------------------
            // Idle connections (not in use)
            //------------------------
            // Keep up to this many idle connections in the pool.
            maxIdle = 25
            // Periodically validate idle (by default, unused for over a minute) connections.
            testWhileIdle = true
            // Sweep through connections this often - also applies to abandoned checks below.
            timeBetweenEvictionRunsMillis = 5 * SECONDS

            //------------------------
            // Abandoned connections (in use w/o closing for a long time)
            // Apps with long running queries might need to adjust (or fix their query...)
            //------------------------
            // Remove connections considered to be abandoned...
            removeAbandoned = true
            // ...meaning those in use longer than this value...
            removeAbandonedTimeout = 3 * MINUTES
            // ...but don't necessarily abandon until we actually need space in the pool.
            abandonWhenPercentageFull = 90

            //------------------------
            // Other  - sourced from Grails `create-app` defaults / docs
            //------------------------
            defaultTransactionIsolation = TRANSACTION_READ_COMMITTED
            ignoreExceptionOnPreLoad = true
            jdbcInterceptors = "ConnectionState;StatementCache(max=200)"

            //------------------------
            // MySQL-specific settings - would *not* apply to other databases, so please do not
            // leave these in place if you aren't using MySQL. Sourced from Grails docs example @
            // https://docs.grails.org/3.3.9/guide/conf.html#dataSource (admittedly w/o much review).
            //------------------------
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

    // Environment-specific JDBC URLs.
    // Note these are also specific to MySQL and must be adjusted for projects using different DBs.
    environments {
        development {
            dataSource {
                // No expectation of SSL for local MySQL instances.
                url = "jdbc:mysql://$dbHost/$dbSchema?useUnicode=yes&characterEncoding=UTF-8&useSSL=false"
            }
        }
        production {
            dataSource {
                url = "jdbc:mysql://$dbHost/$dbSchema?useUnicode=yes&characterEncoding=UTF-8"
            }
        }
    }
}


//---------------------
// Mail - configures SMTP connection if outbound emailing capabilities required.
// Customize as needed for deployment environment - the below works for Toolbox's AWS deployment.
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
