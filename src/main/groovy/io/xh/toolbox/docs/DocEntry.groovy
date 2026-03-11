package io.xh.toolbox.docs

import io.xh.hoist.json.JSONFormat

/**
 * A single documentation entry within the docs viewer. Each entry maps to a markdown file
 * served by a ContentSource, with metadata used for navigation and search in the client UI.
 *
 * The `id` field doubles as both the unique identifier and the relative file path within the
 * source project (e.g. 'docs/base-classes.md').
 */
class DocEntry implements JSONFormat {
    String id
    String source
    String title
    String category
    String description
    List<String> keywords = []

    Object formatForJSON() {
        return [
            id         : id,
            source     : source,
            title      : title,
            category   : category,
            description: description,
            keywords   : keywords
        ]
    }
}
