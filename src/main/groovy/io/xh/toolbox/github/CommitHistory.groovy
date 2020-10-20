package io.xh.toolbox.github

import io.xh.hoist.json.JSONFormat

class CommitHistory implements JSONFormat {

    String repo
    String lastCommitDate
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

    void updateWithNewCommits(List<Commit> commits) {
        def currIds = commits.collect{it.id}
        commits = commits.findAll{!currIds.contains(it.id)}
        this.commits.addAll(0, commits)
        this.lastUpdated = new Date()
        sortCommits()
    }

    private void sortCommits() {
        commits.sort{a, b -> b.committedDate <=> a.committedDate}
        lastCommitDate = commits ? commits.first().committedDateStr : null
    }

    Map formatForJSON() {
        return [
            repo: repo,
            lastCommitDate: lastCommitDate,
            firstLoaded: firstLoaded,
            lastUpdated: lastUpdated,
            commits: commits
        ]
    }
}
