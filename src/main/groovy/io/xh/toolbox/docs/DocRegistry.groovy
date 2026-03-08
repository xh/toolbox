package io.xh.toolbox.docs

import io.xh.hoist.json.JSONFormat
import io.xh.hoist.log.LogSupport

import static io.xh.hoist.json.JSONParser.parseObject

/**
 * Unified registry of documentation entries for both hoist-react and hoist-core.
 * Entries are loaded from docs/doc-registry.json in each project and validated
 * against the active ContentSources at init.
 */
class DocRegistry implements LogSupport, JSONFormat {


    final Map<String, Map> sourceMetadata
    final List<DocEntry> entries

    DocRegistry(Map<String, ContentSource> sources) {
        def allEntries = [],
            metadata = [:]

        sources.each { sourceName, source ->
            def raw = loadRaw(source, sourceName)
            metadata[sourceName] = [
                label: sourceName == 'hoist-react' ? 'Hoist React' : 'Hoist Core',
                categories: raw.viewerCategories ?: []
            ]
            allEntries.addAll(buildEntries(raw, sourceName, source))
        }

        sourceMetadata = metadata
        entries = allEntries

        logInfo("Doc registry loaded: ${entries.size()} entries available")
    }

    DocEntry findEntry(String source, String docId) {
        return entries.find { it.source == source && it.id == docId }
    }

    Object formatForJSON() {
        return [
            entries: entries,
            sources: sourceMetadata
        ]
    }

    //--------------------------------------------------------------------------
    // JSON loading
    //--------------------------------------------------------------------------
    private Map loadRaw(ContentSource source, String sourceName) {
        try {
            return parseObject(source.readFile('docs/doc-registry.json'))
        } catch (Exception e) {
            logError("Failed to load doc-registry.json for ${sourceName}", e)
            return [viewerCategories: [], entries: []]
        }
    }

    private List<DocEntry> buildEntries(Map json, String sourceName, ContentSource source) {
        def rawEntries = json.entries ?: []
        def inventory = rawEntries.collect { Map raw ->
            new DocEntry(
                id: raw.id,
                source: sourceName,
                title: raw.title,
                category: raw.viewerCategory,
                description: raw.description,
                keywords: raw.keywords ?: []
            )
        }

        // Validate file existence against active content source.
        def ret = inventory.findAll { entry ->
            if (source.fileExists(entry.id)) {
                return true
            } else {
                logWarn("Doc file not found for ${entry.source}:${entry.id}, skipping")
                return false
            }
        }

        logInfo("${sourceName}: ${ret.size()} of ${inventory.size()} entries available")
        return ret
    }
}
