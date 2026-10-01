package io.xh.toolbox.github

import io.xh.hoist.json.JSONFormatCached

import java.time.Instant
import java.time.format.DateTimeFormatter

/**
 * Immutable value object for a published GitHub release, as fetched by GitHubService.
 */
class Release extends JSONFormatCached {

    final String id
    final String repo
    final String tagName
    final String name
    final String description
    final String publishedAtStr
    final Date publishedAt
    final String url

    Release(Map mp) {
        id = "${mp.repo}-${mp.tagName}"
        repo = mp.repo
        tagName = mp.tagName
        name = mp.name
        description = mp.description
        publishedAtStr = mp.publishedAt
        publishedAt = parseDate(publishedAtStr)
        url = mp.url
    }

    String toString() {id}
    int hashCode() {Objects.hashCode(id)}
    boolean equals(Object other) {other instanceof Release && Objects.equals(other.id, id)}

    private Date parseDate(String dateStr) {
        return Date.from(Instant.from(DateTimeFormatter.ISO_INSTANT.parse(dateStr)))
    }

    Map formatForJSON() {
        return [
            id: id,
            repo: repo,
            tagName: tagName,
            name: name,
            description: description,
            publishedAt: publishedAt,
            url: url
        ]
    }
}
