package io.xh.toolbox.github

import io.xh.hoist.json.JSONFormatCached

import java.time.Instant
import java.time.format.DateTimeFormatter

class Commit extends JSONFormatCached  implements Serializable {

    final String id
    final String repo
    final String abbreviatedOid
    final Map author
    final String committedDateStr
    final Date committedDate
    final String messageHeadline
    final String messageBody
    final Integer changedFiles
    final Integer additions
    final Integer deletions
    final String url

    Commit(Map mp) {
        id = "${mp.repo}-${mp.abbreviatedOid}"
        repo = mp.repo
        abbreviatedOid = mp.abbreviatedOid
        author = mp.author as Map
        committedDateStr = mp.committedDate
        committedDate = parseDate(committedDateStr)
        messageHeadline = mp.messageHeadline
        messageBody = mp.messageBody
        changedFiles = mp.changedFiles as Integer
        additions = mp.additions as Integer
        deletions = mp.deletions as Integer
        url = mp.url
    }

    String toString() {id}
    int hashCode() {Objects.hashCode(id)}
    boolean equals(Object other) {other instanceof Commit && Objects.equals(other.id, id)}

    private Date parseDate(String dateStr) {
        return Date.from(Instant.from(DateTimeFormatter.ISO_INSTANT.parse(dateStr)))
    }

    Map formatForJSON() {
        return [
            id: id,
            repo: repo,
            abbreviatedOid: abbreviatedOid,
            author: author,
            committedDate: committedDate,
            messageHeadline: messageHeadline,
            messageBody: messageBody,
            changedFiles: changedFiles,
            additions: additions,
            deletions: deletions,
            url: url
        ]
    }
}
