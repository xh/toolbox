package io.xh.toolbox.docs

import io.xh.hoist.BaseService
import io.xh.hoist.exception.NotFoundException

import static io.xh.hoist.util.Utils.hoistCoreVersion
import static io.xh.hoist.util.Utils.hoistReactVersion
import static io.xh.hoist.util.Utils.isLocalDevelopment

class DocsService extends BaseService {

    private DocRegistry registry
    private Map<String, ContentSource> sources

    void init() {
        buildSourcesAndRegistry()
        super.init()
    }

    DocRegistry getRegistry() {
        return registry
    }

    /** Markdown content for a specific doc entry. */
    String getContent(String source, String docId) {
        def entry = registry.findEntry(source, docId)
        if (!entry) throw new NotFoundException("Doc not found: ${source}:${docId}")

        def contentSource = sources[source]
        if (!contentSource) throw new NotFoundException("Unknown source: ${source}")

        def content = contentSource.readFile(entry.id)
        if (!content) throw new NotFoundException("Content file missing: ${entry.id}")

        logDebug("Served ${source}:${docId} (${entry.id}, ${content.length()} chars) via ${contentSource.sourceLabel}")
        return content
    }

    //--------------------------------------------------------------------------
    // Implementation
    //--------------------------------------------------------------------------
    private void buildSourcesAndRegistry() {
        sources = [
            'hoist-react': resolveSource('hoist-react', hoistReactVersion),
            'hoist-core' : resolveSource('hoist-core', hoistCoreVersion)
        ].findAll { it.value != null }
        registry = new DocRegistry(sources)
    }

    private ContentSource resolveSource(String name, String version) {
        try {
            if (isLocalDevelopment) {
                def localDir = new File("../${name}").canonicalFile
                if (new File(localDir, 'docs/README.md').exists()) {
                    return new LocalContentSource(localDir.absolutePath)
                }
            }

            def ref = version.contains('SNAPSHOT') ? 'develop' : "v${version}"
            return new GitHubContentSource("xh/${name}", ref)
        } catch (Exception e) {
            logError("Failed to resolve ${name} content source", e)
            return null
        }
    }

    void clearCaches() {
        buildSourcesAndRegistry()
        super.clearCaches()
    }

    Map getAdminStats() {
        return [
            sources: sources.collectEntries { name, src -> [name, src.sourceLabel] },
            entries: registry.entries.size()
        ]
    }

}
