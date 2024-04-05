package io.xh.toolbox

import com.hazelcast.config.Config
import io.xh.hoist.util.Utils
class ClusterConfig extends io.xh.hoist.ClusterConfig {

    Config createConfig() {
        def ret = super.createConfig()
        if (!Utils.isLocalDevelopment) {
            def join = ret.networkConfig.join,
                interfaces = ret.networkConfig.interfaces

            join.multicastConfig.enabled = false
            join.awsConfig.enabled = true
            interfaces.enabled = true
            interfaces.addInterface('172.30.*.*')
        }
        return ret
    }

}