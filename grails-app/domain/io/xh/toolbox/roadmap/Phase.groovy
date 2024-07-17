package io.xh.toolbox.roadmap

import io.xh.hoist.json.JSONFormat

import com.hazelcast.config.CacheSimpleConfig.ExpiryPolicyFactoryConfig
import com.hazelcast.config.CacheSimpleConfig.ExpiryPolicyFactoryConfig.TimedExpiryPolicyFactoryConfig
import static com.hazelcast.config.CacheSimpleConfig.ExpiryPolicyFactoryConfig.TimedExpiryPolicyFactoryConfig.ExpiryPolicyType.CREATED
import static com.hazelcast.config.CacheSimpleConfig.ExpiryPolicyFactoryConfig.DurationConfig
import java.util.concurrent.TimeUnit

class Phase implements JSONFormat{

    String name = 'Q1 2020'
    Integer sortOrder
    boolean displayed = true
    String lastUpdatedBy
    Date lastUpdated

    static hasMany = [projects: Project]

    static mapping = {
        projects lazy: false
        cache true
    }

    // Example of Hoist's custom cache configuration for Hazelcast
    static cache = {
        evictionConfig.size = 1000
        expiryPolicyFactoryConfig = new ExpiryPolicyFactoryConfig(
          new TimedExpiryPolicyFactoryConfig(CREATED, new DurationConfig(1, TimeUnit.DAYS))
         )
    }

    static constraints = {
        name(blank: false, maxSize: 50)
        lastUpdatedBy(nullable: true, maxSize: 50)
    }

    Map formatForJSON() {
        return [
                id: id,
                name: name,
                sortOrder: sortOrder,
                displayed: displayed,
                projects: projects
        ]
    }
}
