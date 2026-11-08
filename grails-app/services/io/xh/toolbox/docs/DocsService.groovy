package io.xh.toolbox.docs

import io.xh.hoist.BaseService
import io.xh.hoist.cache.Cache
import io.xh.hoist.config.ConfigService
import io.xh.hoist.http.JSONClient
import org.apache.hc.client5.http.classic.methods.HttpGet
import org.apache.hc.core5.net.URIBuilder

import static io.xh.hoist.util.DateTimeUtils.MINUTES
import static io.xh.hoist.util.InstanceConfigUtils.getInstanceConfig

/**
 * Serves hoist-react and hoist-core documentation to the Toolbox docs viewers (desktop and
 * mobile) by calling the public docs API of the Hoist Docs service (https://github.com/xh/hoist-docs).
 * Hoist Docs holds the versioned doc indexes and the ranked search that AI agents use over MCP, so
 * people and agents read the same content.
 *
 * The service URL comes from the `hoistDocsUrl` instance config when set (e.g. a local Hoist Docs
 * server on port 8081), else from the `hoistDocsUrl` soft config.
 *
 * Each call accepts the viewer's chosen version per source, as params named for the source
 * (`hoist-react`, `hoist-core`), passed through to Hoist Docs.
 */
class DocsService extends BaseService {

    static clearCachesConfigs = ['hoistDocsUrl']

    static final List<String> SOURCES = ['hoist-react', 'hoist-core']

    ConfigService configService

    private JSONClient client = new JSONClient()

    private Cache<String, Map> registries = createCache(name: 'registries', expireTime: 10 * MINUTES)
    private Cache<String, String> contents = createCache(name: 'contents', expireTime: 60 * MINUTES)

    /** Registry of all doc entries, with each source's categories and available versions. */
    Map getRegistry(Map<String, String> versions) {
        String key = versionKey(versions)
        def ret = registries.get(key)
        if (ret == null) {
            ret = get('docs/registry', versions)
            registries.put(key, ret)
        }
        return ret
    }

    /** Markdown content for a specific doc. */
    String getContent(String source, String docId, String version) {
        String key = "${source}:${version ?: ''}:${docId}"
        def ret = contents.get(key)
        if (ret == null) {
            ret = get('docs/content', [source: source, docId: docId, (source): version]).content as String
            contents.put(key, ret)
        }
        return ret
    }

    /** Ranked docs matching a query, each with its best section and an excerpt. */
    List<Map> search(String query, Map<String, String> versions) {
        get('docs/search', versions + [query: query, limit: '25', client: 'toolbox']).results as List<Map>
    }

    /** Requested version per source, from request params. */
    static Map<String, String> versionsFrom(Map params) {
        SOURCES.collectEntries { [it, params[it] as String] }.findAll { it.value } as Map<String, String>
    }

    String getHoistDocsUrl() {
        (getInstanceConfig('hoistDocsUrl') ?: configService.getString('hoistDocsUrl')).replaceAll(/\/+$/, '')
    }

    //------------------------
    // Implementation
    //------------------------
    private Map get(String path, Map params) {
        def uri = new URIBuilder("${hoistDocsUrl}/${path}")
        params.each { k, v -> if (v != null) uri.addParameter(k as String, v as String) }
        return client.executeAsMap(new HttpGet(uri.build()))
    }

    private static String versionKey(Map<String, String> versions) {
        SOURCES.collect { "${it}=${versions[it] ?: ''}" }.join('&')
    }

    void clearCaches() {
        registries.clear()
        contents.clear()
        super.clearCaches()
    }

    Map getAdminStats() {
        [hoistDocsUrl: hoistDocsUrl, registries: registries.size(), contents: contents.size()]
    }
}
