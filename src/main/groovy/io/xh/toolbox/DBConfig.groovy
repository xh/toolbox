package io.xh.toolbox

import io.xh.hoist.configuration.RuntimeConfig
import org.hibernate.dialect.MySQL8Dialect

import static io.xh.hoist.util.DateTimeUtils.getHOURS
import static io.xh.hoist.util.DateTimeUtils.getSECONDS
import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig
import static io.xh.hoist.util.Utils.getAppCode
import static java.sql.Connection.TRANSACTION_READ_COMMITTED
import static io.xh.hoist.util.Utils.withDelegate

class DBConfig {

    static void dataSourceConfig(Script script) {
        if (getInstanceConfig('useH2') == 'true') {
            RuntimeConfig.h2Config(script)
        } else {
            mySqlConfig(script)
        }
    }

    private static void mySqlConfig(Script script) {
        withDelegate(script) {
            //-------------------------------------------------------------------------------------------
            // Datasource - for this app's persistent domain objects, including e.g. Hoist configs and prefs.
            // Toolbox uses mySQL, but apps can use any DB supported by Grails (SQL Server, Postgres, etc).
            //----------------------------------------------------------------------------------------------
            def dbHost = getInstanceConfig('dbHost') ?: 'localhost',
                    dbCreateMode = getInstanceConfig('dbCreate') ?: 'update',
                    dbSchema = getInstanceConfig('dbSchema') ?: appCode,
                    dbUser = getInstanceConfig('dbUser') ?: appCode,
                    dbPassword = getInstanceConfig('dbPassword')

            // Default dbPassword to appCode, but also support '' password if so specified.
            if (dbPassword == null) dbPassword = appCode

            dataSource {
                url = "jdbc:mysql://${dbHost}/${dbSchema}"
                pooled = true
                jmxExport = true
                driverClassName = 'com.mysql.cj.jdbc.Driver'
                dialect = MySQL8Dialect
                dbCreate = dbCreateMode
                username = dbUser
                password = dbPassword

                // Config for Tomcat JDBC Pool - the values below have been customized off of the
                // defaults to ensure idle/abandoned connections are validated and cleaned up more
                // aggressively than they would be otherwise. Most of these overrides have been
                // sourced from the defaults Grails produces when running `create-app`.
                //
                // See Tomcat docs for details on these settings and defaults:
                // https://tomcat.apache.org/tomcat-9.0-doc/jdbc-pool.html#Common_Attributes
                // https://tomcat.apache.org/tomcat-9.0-doc/api/org/apache/tomcat/jdbc/pool/PoolConfiguration.html
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
                    // ...by issuing this query (special "ping" syntax understood by MySQL for this purpose)...
                    validationQuery = "/* ping */ SELECT 1"
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
                    // ...meaning those in use longer than this value (in seconds)...
                    removeAbandonedTimeout = 180
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
                    // https://docs.grails.org/latest/guide/conf.html#dataSource (admittedly w/o much review).
                    //------------------------
                    dbProperties {
                        allowPublicKeyRetrieval = true
                        autoReconnect = false
                        cacheCallableStmts = false
                        cachePrepStmts = false
                        cacheResultSetMetadata = true
                        cacheServerConfiguration = true
                        connectTimeout = 15000
                        dontTrackOpenResources = true
                        holdResultsOpenOverStatementClose = true
                        jdbcCompliantTruncation = false
                        metadataCacheSize = 100
                        socketTimeout = 120000
                        useServerPrepStmts = false
                        useSSL = dbHost != 'localhost'
                        zeroDateTimeBehavior = 'convertToNull'
                    }
                }
            }
        }
    }
}
