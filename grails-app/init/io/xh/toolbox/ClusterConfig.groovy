package io.xh.toolbox

import com.hazelcast.config.Config

import static io.xh.hoist.util.Utils.isLocalDevelopment

class ClusterConfig extends io.xh.hoist.ClusterConfig {

    void createNetworkConfig(Config config) {
        super.createNetworkConfig(config)

        if (!multiInstanceEnabled) return

        def networkConfig = config.networkConfig
        if (isLocalDevelopment) {
            networkConfig.join.multicastConfig.enabled = true
        } else {
            // NOTE - these values are specific to Toolbox's AWS ECS-based deployment.
            // Contact XH for assistance with the settings required for your application's deployment environment.
            networkConfig.join.multicastConfig.enabled = false
            networkConfig.join.awsConfig.enabled = true
            networkConfig.interfaces.enabled = true
            networkConfig.interfaces.addInterface('172.30.*.*')
        }
    }
}
