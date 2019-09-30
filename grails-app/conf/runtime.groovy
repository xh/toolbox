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
            // Pool sizing - number of connections tuned *down* from Tomcat pool defaults,
            initialSize = 5 // init with this many
            maxActive = 50 // create and allocate up to this many
            maxAge = 2 * HOURS // max overall age of connection - drop/reconnect on borrow/return if older
            maxWait = 10 * SECONDS  // max time to wait for requested conn before throwing exception to app

            // Connection validation
            testOnConnect = true // test after establishing a connection...
            testOnBorrow = true // ...and before handing out an existing connection...
            validationInterval = 15 * SECONDS // ...but test each connection no more than once per this interval
            validationQuery = "SELECT 1" // test by issuing this query...
            validationQueryTimeout = 3  // ...giving it this long to complete (this one is in seconds!)

            // Idle connections (not in use)
            maxIdle = 25 // keep up to this many idle connections in the pool
            testWhileIdle = true // periodically validate idle (by default, unused for over a minute) connections
            timeBetweenEvictionRunsMillis = 5 * SECONDS // sweep through connections this often - also applies to abandoned checks below.

            // Abandoned connections (in use w/o closing for a long time).
            // Apps with very long running queries might need to adjust these (or their query...)
            removeAbandoned = true // Remove connections considered to be abandoned...
            removeAbandonedTimeout = 2 * MINUTES // ...meaning those in use longer than this value...
            abandonWhenPercentageFull = 90 // ...but don't necessarily abandon until we actually need them freed up.

            // Other connection pool props sourced from Grails defaults / docs.
            defaultTransactionIsolation = TRANSACTION_READ_COMMITTED
            ignoreExceptionOnPreLoad = true
            jdbcInterceptors = "ConnectionState;StatementCache(max=200)"

            // MySQL-specific settings - would *not* apply to other databases, so please do not
            // leave these in place if you aren't using MySQL. Sourced from Grails docs example @
            // https://docs.grails.org/3.3.9/guide/conf.html#dataSource (admittedly w/o much review).
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
