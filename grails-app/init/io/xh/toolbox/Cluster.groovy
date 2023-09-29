package io.xh.toolbox

import com.hazelcast.config.Config
import io.xh.hoist.util.Utils


class Cluster {

    /**
     * Provide app specific configuration to your hazelcast cluster.
     *
     * Hoist uses simple Hazelcast's "multicast" cluster discovery by default.  While often
     * appropriate for local development, this may not be appropriate for your production and
     * can be replaced here.
     *
     * This method should also be used to specify custom configurations of distributed
     * hazelcast objects, and caches, including hibernate 2nd-level caches.
     */
    static void configure(Config config) {
        if (!Utils.isLocalDevelopment) {
            def join = config.networkConfig.join,
                interfaces = config.networkConfig.interfaces

            join.multicastConfig.enabled = false
            join.awsConfig.enabled = true
            interfaces.enabled = true
            interfaces.addInterface('172.30.*.*')
        }
    }
}