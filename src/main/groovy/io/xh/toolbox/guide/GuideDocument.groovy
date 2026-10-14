package io.xh.toolbox.guide

import io.xh.hoist.json.JSONFormat

/**
 * One document in the guideline assistant's library, read from a markdown resource in
 * `src/main/resources/guide`. Its `# ` heading is its name, and each paragraph below is a passage
 * that retrieval can cite.
 */
class GuideDocument implements JSONFormat {

    final String id
    final String name
    final List<String> passages

    GuideDocument(String id, String markdown) {
        def blocks = markdown.split(/\n\s*\n/)*.trim().findAll()
        this.id = id
        this.name = blocks.head().replaceFirst(/^#\s*/, '')
        this.passages = blocks.tail()
    }

    Map formatForJSON() {
        return [documentId: id, documentName: name, passageCount: passages.size()]
    }
}
