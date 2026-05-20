package io.xh.toolbox

import com.hazelcast.config.Config

import static io.xh.hoist.util.Utils.isLocalDevelopment

class ClusterConfig extends io.xh.hoist.ClusterConfig {

    void createNetworkConfig(Config config) {
        super.createNetworkConfig(config)

        if (!multiInstanceEnabled) return

        def join = config.networkConfig.join,
            interfaces = config.networkConfig.interfaces

        join.multicastConfig.enabled = false
        interfaces.enabled = true

        if (isLocalDevelopment) {
            join.tcpIpConfig.enabled = true
            join.tcpIpConfig.addMember('127.0.0.1')
            interfaces.addInterface('127.0.0.1')
        } else {
            // NOTE - these values are specific to Toolbox's AWS ECS-based deployment.
            // Contact XH for assistance with the settings required for your application's deployment environment.
            join.awsConfig.enabled = true
            interfaces.addInterface('172.30.*.*')
        }
    }
}
