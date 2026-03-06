package io.xh.toolbox.docs

import groovy.json.JsonSlurper
import io.xh.hoist.log.LogSupport

/**
 * Unified registry of documentation entries for both hoist-react and hoist-core.
 * Entries are loaded from docs/doc-registry.json in each project and validated
 * against the active ContentSources at init.
 */
class DocRegistry implements LogSupport {

    final List<DocEntry> entries
    final Map<String, Map> sourceMetadata

    DocRegistry(Map<String, ContentSource> sources) {
        def allEntries = []
        def metadata = [:]

        sources.each { sourceName, source ->
            def json = loadFromJson(source, sourceName)
            metadata[sourceName] = [
                label: sourceName == 'hoist-react' ? 'Hoist React' : 'Hoist Core',
                categories: json.viewerCategories ?: []
            ]
            allEntries.addAll(buildEntries(json, sourceName, source))
        }

        this.sourceMetadata = metadata
        this.entries = allEntries

        logInfo("Doc registry loaded: ${entries.size()} entries available")
    }

    List<Map> toMaps() {
        return entries.collect { entry ->
            [
                id         : entry.id,
                source     : entry.source,
                title      : entry.title,
                category   : entry.category,
                description: entry.description,
                keywords   : entry.keywords
            ]
        }
    }

    DocEntry findEntry(String source, String docId) {
        return entries.find { it.source == source && it.id == docId }
    }

    //--------------------------------------------------------------------------
    // JSON loading
    //--------------------------------------------------------------------------
    private Map loadFromJson(ContentSource source, String sourceName) {
        def jsonText = source.readFile('docs/doc-registry.json')
        if (!jsonText) {
            logWarn("docs/doc-registry.json not found for ${sourceName}")
            return [viewerCategories: [], entries: []]
        }
        try {
            return new JsonSlurper().parseText(jsonText) as Map
        } catch (Exception e) {
            logError("Failed to parse docs/doc-registry.json for ${sourceName}", e)
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
        def validated = inventory.findAll { entry ->
            if (source.fileExists(entry.id)) {
                return true
            } else {
                logWarn("Doc file not found for ${entry.source}:${entry.id}, skipping")
                return false
            }
        }

        logInfo("${sourceName}: ${validated.size()} of ${inventory.size()} entries available")
        return validated
    }

    //--------------------------------------------------------------------------
    // Data class
    //--------------------------------------------------------------------------
    static class DocEntry {
        /** Unique identifier AND relative file path (e.g. 'docs/base-classes.md'). */
        String id
        String source
        String title
        String category
        String description
        List<String> keywords = []
    }
}
