package io.xh.toolbox.docs

import io.xh.hoist.BaseService
import io.xh.hoist.exception.NotFoundException

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

        def content = contentSource.readFile(entry.filePath)
        if (content == null) throw new NotFoundException("Content file missing: ${entry.filePath}")

        return content
    }

    /** Metadata about each content source (mode, label) plus category definitions. */
    Map getSourceInfo() {
        return DocRegistry.SOURCES.collectEntries { name, meta ->
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
        def ret = [:]
        ret['hoist-react'] = resolveHoistReactSource()
        ret['hoist-core'] = resolveHoistCoreSource()
        return ret.findAll { k, v -> v != null }
    }

    private ContentSource resolveHoistReactSource() {
        try {
            // Check for sibling local checkout
            def localDir = new File(appDir, '../hoist-react').canonicalFile
            if (new File(localDir, 'docs/README.md').exists()) {
                return new LocalContentSource(localDir.absolutePath)
            }

            // Fall back to GitHub — derive version from installed npm package
            def version = getHoistReactVersion()
            if (version) {
                def ref = version.endsWith('-SNAPSHOT') ? 'develop' : "v${version}"
                return new GitHubContentSource('xh/hoist-react', ref)
            }

            log.warn("Could not resolve hoist-react content source")
            return null
        } catch (Exception e) {
            log.error("Failed to resolve hoist-react content source", e)
            return null
        }
    }

    private ContentSource resolveHoistCoreSource() {
        try {
            // Check gradle.properties for runHoistInline
            def gradleProps = readGradleProperties()
            def runInline = gradleProps?.getProperty('runHoistInline') == 'true'

            if (runInline) {
                def localDir = new File(appDir, '../hoist-core').canonicalFile
                if (localDir.isDirectory()) {
                    return new LocalContentSource(localDir.absolutePath)
                }
            }

            // Fall back to GitHub — use hoistCoreVersion from gradle.properties
            def version = gradleProps?.getProperty('hoistCoreVersion')
            if (version) {
                def ref = version.endsWith('-SNAPSHOT') ? 'develop' : "v${version}"
                return new GitHubContentSource('xh/hoist-core', ref)
            }

            log.warn("Could not resolve hoist-core content source")
            return null
        } catch (Exception e) {
            log.error("Failed to resolve hoist-core content source", e)
            return null
        }
    }

    /** Read the hoist-react version from the installed npm package. */
    private String getHoistReactVersion() {
        def pkgFile = new File(appDir, 'client-app/node_modules/@xh/hoist/package.json')
        if (!pkgFile.exists()) return null

        def json = new groovy.json.JsonSlurper().parse(pkgFile)
        return json.version
    }

    /** Read gradle.properties from the app root. */
    private Properties readGradleProperties() {
        def file = new File(appDir, 'gradle.properties')
        if (!file.exists()) return null

        def props = new Properties()
        file.withInputStream { props.load(it) }
        return props
    }

    /** Application root directory. */
    private File getAppDir() {
        return new File(System.getProperty('user.dir'))
    }
}
