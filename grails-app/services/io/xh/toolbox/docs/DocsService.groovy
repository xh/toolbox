package io.xh.toolbox.docs

import grails.util.Metadata
import io.xh.hoist.BaseService
import io.xh.hoist.exception.NotFoundException

import static io.xh.hoist.util.Utils.hoistCoreVersion
import static io.xh.hoist.util.Utils.hoistReactVersion
import static io.xh.hoist.util.Utils.isLocalDevelopment

/**
 * Service providing documentation content from hoist-react, hoist-core and hoist-chat-kit to the
 * Toolbox Docs Viewer. Builds a unified {@link DocRegistry} of all available doc entries and serves
 * their markdown content on demand.
 *
 * Each source library is backed by a {@link ContentSource} resolved at init with the following
 * strategy:
 *
 *   1. In local development, check for a sibling checkout of the library (e.g. `../hoist-react`)
 *      with a `docs/README.md` file. If found, use a {@link LocalContentSource} that reads
 *      directly from the filesystem - allowing docs to be authored and previewed without
 *      committing or pushing.
 *
 *   2. For hoist-chat-kit only, check for the package installed in `client-app/node_modules`.
 *      The kit publishes its docs with its source, so this keeps the docs in step with the kit
 *      the client runs.
 *
 *   3. Otherwise, fall back to a {@link GitHubContentSource} that downloads the library's
 *      tarball from GitHub. For a concrete released version, the corresponding `v{version}` tag
 *      is fetched; for anything else (a SNAPSHOT, a dist-tag such as `next`, or a range) the
 *      `develop` branch is used. The full archive is extracted into memory at init for fast
 *      subsequent reads.
 *
 * Sources that fail to resolve (e.g. missing local checkout and GitHub unreachable) are
 * silently excluded - the viewer will display whichever sources loaded successfully.
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
            'hoist-react'   : resolveSource('hoist-react', hoistReactVersion),
            'hoist-core'    : resolveSource('hoist-core', hoistCoreVersion),
            'hoist-chat-kit': resolveSource('hoist-chat-kit', hoistChatKitVersion, CHAT_KIT_PACKAGE)
        ].findAll { it.value != null }
        registry = new DocRegistry(sources)
    }

    /**
     * @param name - repo name, under the `xh` GitHub org.
     * @param version - the library's dependency spec, used to pick a GitHub ref.
     * @param packagePath - optional path to the library's installed npm package, checked after a
     *      local checkout and before GitHub.
     */
    private ContentSource resolveSource(String name, String version, String packagePath = null) {
        try {
            if (isLocalDevelopment) {
                def localDir = new File("../${name}").canonicalFile
                if (new File(localDir, 'docs/README.md').exists()) {
                    return new LocalContentSource(localDir.absolutePath)
                }
            }

            if (packagePath) {
                def packageDir = new File(packagePath)
                if (new File(packageDir, 'docs/doc-registry.json').exists()) {
                    return new LocalContentSource(packageDir.absolutePath)
                }
            }

            // `version` is the raw dependency spec from package.json, so it is not guaranteed
            // to be a released semver - it may be a dist-tag (e.g. `next`) or a range. Anything
            // that is not a concrete release maps to `develop`, which is what those specs track.
            def isRelease = version ==~ /^\d+\.\d+\.\d+$/
            def ref = isRelease ? "v${version}" : 'develop'
            return new GitHubContentSource("xh/${name}", ref)
        } catch (Exception e) {
            logError("Failed to resolve ${name} content source", e)
            return null
        }
    }

    /** The `@xh/hoist-chat-kit` dependency spec from the client's package.json, set at build. */
    private String getHoistChatKitVersion() {
        return Metadata.current.getProperty('info.toolbox.hoistChatKitVersion', String, null)
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

    /** The installed kit package, relative to the server's working directory (the project root). */
    private static final String CHAT_KIT_PACKAGE = 'client-app/node_modules/@xh/hoist-chat-kit'
}
