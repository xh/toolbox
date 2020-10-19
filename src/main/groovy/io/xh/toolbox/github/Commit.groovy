package io.xh.toolbox.github

import io.xh.hoist.json.JSONFormatCached

class Commit extends JSONFormatCached {

    final String id
    final String repo
    final String abbreviatedOid
    final Map author
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
        author = mp.author
        committedDate = mp.committedDate
        messageHeadline = mp.messageHeadline
        messageBody = mp.messageBody
        changedFiles = mp.changedFiles
        additions = mp.additions
        deletions = mp.deletions
        url = mp.url
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
