package io.xh.toolbox.docs

import groovy.json.JsonSlurper
import io.xh.hoist.BaseService
import io.xh.hoist.exception.NotFoundException

import static grails.util.Holders.currentPluginManager
import static io.xh.hoist.util.Utils.isLocalDevelopment

class DocsService extends BaseService {

    private Map<String, ContentSource> sources = [:]
    private DocRegistry registry

    void init() {
        sources = resolveSources()
        registry = new DocRegistry(sources)
        super.init()
    }

    /** All doc entries as plain maps (metadata only, no content). */
    List<Map> getRegistry() {
        return registry.toMaps()
    }

    /** Markdown content for a specific doc entry. */
    String getContent(String source, String docId) {
        def entry = registry.findEntry(source, docId)
        if (!entry) throw new NotFoundException("Doc not found: ${source}:${docId}")

        def contentSource = sources[source]
        if (!contentSource) throw new NotFoundException("Unknown source: ${source}")

        def content = contentSource.readFile(entry.id)
        if (content == null) throw new NotFoundException("Content file missing: ${entry.id}")

        logDebug("Served ${source}:${docId} (${entry.id}, ${content.length()} chars) via ${contentSource.sourceLabel}")
        return content
    }

    /** Metadata about each content source (mode, label) plus category definitions. */
    Map getSourceInfo() {
        return registry.sourceMetadata.collectEntries { name, meta ->
            def src = sources[name]
            [name, [
                label     : meta.label,
                categories: meta.categories,
                mode      : src?.sourceLabel ?: 'unavailable'
            ]]
        }
    }

    //--------------------------------------------------------------------------
    // Source resolution
    //--------------------------------------------------------------------------
    private Map<String, ContentSource> resolveSources() {
        return [
            'hoist-react': resolveHoistReactSource(),
            'hoist-core' : resolveHoistCoreSource()
        ].findAll { it.value != null }
    }

    private ContentSource resolveHoistReactSource() {
        try {
            // In local dev, check for sibling checkout with docs
            if (isLocalDevelopment) {
                def localDir = new File(appDir, '../hoist-react').canonicalFile
                if (new File(localDir, 'docs/README.md').exists()) {
                    return new LocalContentSource(localDir.absolutePath)
                }
            }

            // Fall back to GitHub — read version from installed npm package
            def pkgFile = new File(appDir, 'client-app/node_modules/@xh/hoist/package.json')
            if (pkgFile.exists()) {
                def version = new JsonSlurper().parse(pkgFile).version as String
                if (version) {
                    def ref = version.contains('SNAPSHOT') ? 'develop' : "v${version}"
                    return new GitHubContentSource('xh/hoist-react', ref)
                }
            }

            logWarn("Could not resolve hoist-react content source")
            return null
        } catch (Exception e) {
            logError("Failed to resolve hoist-react content source", e)
            return null
        }
    }

    private ContentSource resolveHoistCoreSource() {
        try {
            // In local dev, check for sibling checkout with docs
            if (isLocalDevelopment) {
                def localDir = new File(appDir, '../hoist-core').canonicalFile
                if (new File(localDir, 'docs/README.md').exists()) {
                    return new LocalContentSource(localDir.absolutePath)
                }
            }

            // Fall back to GitHub — version from plugin manager at runtime
            def version = currentPluginManager().getGrailsPlugin('hoist-core').version
            if (version) {
                def ref = version.endsWith('-SNAPSHOT') ? 'develop' : "v${version}"
                return new GitHubContentSource('xh/hoist-core', ref)
            }

            logWarn("Could not resolve hoist-core content source")
            return null
        } catch (Exception e) {
            logError("Failed to resolve hoist-core content source", e)
            return null
        }
    }

    /** Project root directory — reliable in local dev where Gradle sets user.dir. */
    private File getAppDir() {
        return new File(System.getProperty('user.dir'))
    }
}
