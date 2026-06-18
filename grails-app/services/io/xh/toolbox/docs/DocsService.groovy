package io.xh.toolbox.docs

import io.xh.hoist.BaseService
import io.xh.hoist.exception.NotFoundException

import static io.xh.hoist.util.Utils.hoistCoreVersion
import static io.xh.hoist.util.Utils.hoistReactVersion
import static io.xh.hoist.util.Utils.isLocalDevelopment

/**
 * Service providing documentation content from hoist-react and hoist-core to the Toolbox
 * Docs Viewer. Builds a unified {@link DocRegistry} of all available doc entries and serves
 * their markdown content on demand.
 *
 * Each source library (hoist-react, hoist-core) is backed by a {@link ContentSource} resolved
 * at init with the following strategy:
 *
 *   1. In local development, check for a sibling checkout of the library (e.g. `../hoist-react`)
 *      with a `docs/README.md` file. If found, use a {@link LocalContentSource} that reads
 *      directly from the filesystem — allowing docs to be authored and previewed without
 *      committing or pushing.
 *
 *   2. Otherwise, fall back to a {@link GitHubContentSource} that downloads the library's
 *      tarball from GitHub. For SNAPSHOT versions, the `develop` branch is used; for released
 *      versions, the corresponding `v{version}` tag is fetched. The full archive is extracted
 *      into memory at init for fast subsequent reads.
 *
 * Sources that fail to resolve (e.g. missing local checkout and GitHub unreachable) are
 * silently excluded — the viewer will display whichever sources loaded successfully.
 * Calling {@code clearCaches()} rebuilds all sources and the registry from scratch.
 */
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
