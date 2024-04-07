package io.xh.toolbox.github

import io.xh.hoist.json.JSONFormat

class CommitHistory implements JSONFormat {

    String repo
    String lastCommitTimestamp
    Date firstLoaded
    Date lastUpdated
    // TODO - sortedSet for commits?
    List<Commit> commits

    CommitHistory(String repo, List<Commit> commits = []) {
        this.repo = repo
        this.commits = commits
        this.firstLoaded = this.lastUpdated = new Date()
        sortCommits()
    }

    void updateWithNewCommits(List<Commit> newCommits) {
        newCommits = newCommits.findAll{!hasCommit(it)}
        commits.addAll(0, newCommits)
        lastUpdated = new Date()
        sortCommits()
    }

    boolean hasCommit(Commit commit) {
        return commits.find{it.id == commit.id} != null
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
