package io.xh.toolbox.docs

import io.xh.hoist.BaseService
import io.xh.hoist.cache.Cache
import io.xh.hoist.config.ConfigService
import io.xh.hoist.exception.DataNotAvailableException
import io.xh.hoist.http.JSONClient
import org.apache.hc.client5.http.classic.methods.HttpGet
import org.apache.hc.core5.net.URIBuilder

import java.util.concurrent.ConcurrentHashMap

import static io.xh.hoist.util.DateTimeUtils.MINUTES
import static io.xh.hoist.util.DateTimeUtils.SECONDS
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
 *
 * Hoist Docs being down or slow must not take the viewers down with it. Calls time out after
 * {@link #TIMEOUT_MS}, and registry and content fall back to the last copy fetched. With nothing to
 * fall back on, calls throw a {@link DataNotAvailableException}, which the viewers show as a
 * "docs unavailable" message rather than an error.
 */
class DocsService extends BaseService {

    static clearCachesConfigs = ['hoistDocsUrl']

    static final List<String> SOURCES = ['hoist-react', 'hoist-core']
    static final long TIMEOUT_MS = 5 * SECONDS

    ConfigService configService

    private JSONClient client = new JSONClient()

    private Cache<String, Map> registries = createCache(name: 'registries', expireTime: 10 * MINUTES)
    private Cache<String, String> contents = createCache(name: 'contents', expireTime: 60 * MINUTES)

    // Last good responses, kept past cache expiry to serve while Hoist Docs is unreachable.
    private Map<String, Map> lastRegistries = new ConcurrentHashMap<>()
    private Map<String, String> lastContents = new ConcurrentHashMap<>()

    /** Registry of all doc entries, with each source's categories and available versions. */
    Map getRegistry(Map<String, String> versions) {
        String key = versionKey(versions)
        def ret = registries.get(key)
        if (ret == null) {
            ret = withFallback(lastRegistries, key) { get('docs/registry', versions) }
            registries.put(key, ret)
        }
        return ret
    }

    /** Markdown content for a specific doc. */
    String getContent(String source, String docId, String version) {
        String key = "${source}:${version ?: ''}:${docId}"
        def ret = contents.get(key)
        if (ret == null) {
            ret = withFallback(lastContents, key) {
                get('docs/content', [source: source, docId: docId, (source): version]).content as String
            }
            contents.put(key, ret)
        }
        return ret
    }

    /** Ranked docs matching a query, each with its best section and an excerpt. */
    List<Map> search(String query, Map<String, String> versions) {
        try {
            return get('docs/search', versions + [query: query, limit: '25', client: 'toolbox']).results as List<Map>
        } catch (Exception e) {
            throw unavailable(e)
        }
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
        return client.executeAsMap(new HttpGet(uri.build()), TIMEOUT_MS)
    }

    /** Run a fetch, remembering its result - or, if it fails, return the last result remembered. */
    private <T> T withFallback(Map<String, T> lastGood, String key, Closure<T> fetch) {
        try {
            T ret = fetch()
            lastGood.put(key, ret)
            return ret
        } catch (Exception e) {
            T last = lastGood.get(key)
            if (last == null) throw unavailable(e)
            logWarn('Hoist Docs unreachable - serving last fetched copy', key, e.message)
            return last
        }
    }

    private DataNotAvailableException unavailable(Exception e) {
        logWarn('Hoist Docs unreachable', hoistDocsUrl, e.message)
        return new DataNotAvailableException('Hoist Docs is unavailable')
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
        [
            hoistDocsUrl  : hoistDocsUrl,
            registries    : registries.size(),
            contents      : contents.size(),
            lastRegistries: lastRegistries.size(),
            lastContents  : lastContents.size()
        ]
    }
}
