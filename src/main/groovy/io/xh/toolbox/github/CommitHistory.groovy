package io.xh.toolbox.github

import io.xh.hoist.json.JSONFormat

import java.time.Instant

class CommitHistory implements JSONFormat {

    String repo
    String lastCommitTimestamp
    Instant firstLoaded
    Instant lastUpdated
    // TODO - sortedSet for commits?
    List<Commit> commits

    CommitHistory(String forRepo) {
        repo = forRepo
        commits = []
        firstLoaded = lastUpdated = Instant.now()
        sortCommits()
    }

    List<Commit> updateWithNewCommits(List<Commit> newCommits) {
        def now = Instant.now()
        firstLoaded = firstLoaded ?: now
        lastUpdated = now

        newCommits = newCommits.findAll{!hasCommit(it)}
        commits.addAll(0, newCommits)
        sortCommits()
        return newCommits
    }

    boolean hasCommit(Commit commit) {
        return commits.find{it.id == commit.id} != null
    }

    int size() {
        return commits.size()
    }

    private void sortCommits() {
        commits.sort{a, b -> b.committedDate <=> a.committedDate}
        lastCommitTimestamp = commits ? commits.first().committedDateStr : null
    }

    Map formatForJSON() {
        return [
            repo: repo,
            lastCommitTimestamp: lastCommitTimestamp,
            firstLoaded: firstLoaded,
            lastUpdated: lastUpdated,
            commits: commits
        ]
    }
}
