package io.xh.toolbox.app

import io.xh.hoist.BaseService
import io.xh.hoist.config.ConfigService
import io.xh.hoist.http.JSONClient
import io.xh.hoist.json.JSONSerializer
import io.xh.toolbox.github.Commit
import io.xh.toolbox.github.CommitHistory
import org.apache.http.client.methods.HttpPost
import org.apache.http.entity.StringEntity

class GitHubService extends BaseService {

    ConfigService configService
    Map<String, CommitHistory> commitsByRepo = new HashMap()

    CommitHistory getCommitsForRepo(String repoName) {commitsByRepo[repoName]}

    CommitHistory loadCommitsForRepo(String repoName) {
        def hasNextPage = true,
            cursor = '',
            pageCount = 1,
            commitHistory = this.getCommitsForRepo(repoName),
            newCommits = new ArrayList<Commit>()

        if (!commitHistory) {
            commitHistory = new CommitHistory(repoName)
            this.commitsByRepo.put(repoName, commitHistory)
        }

        while (hasNextPage) {
            log.info("Fetching page ${pageCount} for repo ${repoName} | cursor ${cursor}")
            try {
                def raw = loadCommitsForRepoInternal(repoName, commitHistory.lastCommitDate, cursor)
                if (raw?.data?.repository?.name != repoName) {
                    throw new RuntimeException("JSON returned by GitHub API not in expected format")
                }

                def history = raw.data.repository.defaultBranchRef.target.history,
                    pageInfo = history.pageInfo,
                    rawCommits = history.nodes as List

                log.info("Fetched ${newCommits.size() + rawCommits.size()} / ${history.totalCount} commits for this batch")
                cursor = pageInfo.endCursor
                hasNextPage = pageInfo.hasNextPage && pageCount < 3
                pageCount++

                rawCommits.each{it ->
                    newCommits.push(new Commit(
                        repo: repoName,
                        abbreviatedOid: it.abbreviatedOid,
                        author: [
                            email: it.author.email,
                            name: it.author.user?.name ?: it.author.email
                        ],
                        committedDate: it.committedDate,
                        messageHeadline: it.messageHeadline,
                        messageBody: it.messageBody,
                        changedFiles: it.changedFiles,
                        additions: it.additions,
                        deletions: it.deletions,
                        url: it.url
                    ))
                }

            } catch (e) {
                log.error("Failure fetching commits for $repoName", e)
                hasNextPage = false
            }
        }

        if (newCommits.size()) {
            log.info("Commit load complete | got ${newCommits.size()} new commits")
            commitHistory.updateWithNewCommits(newCommits)
        } else {
            log.info("No new commits found - staying at cursor ${cursor}")
        }

        return commitHistory
    }

    Map loadCommitsForRepoInternal(String repoName, String sinceTimestamp = null, String cursor = null) {
        def query = getCommitsQueryJson(repoName, sinceTimestamp, cursor),
            post = new HttpPost('https://api.github.com/graphql')

        post.setHeader('Accept', 'application/json')
        post.setHeader('Content-type', 'application/json')
        post.setHeader('Authorization', "bearer ${configService.getString('gitHubAccessToken')}")
        post.setEntity(new StringEntity(query))

        jsonClient.executeAsMap(post)
    }

    private String getCommitsQueryJson(String repoName, String sinceTimestamp, cursor) {
        return JSONSerializer.serialize([query: getCommitsQueryString(repoName, sinceTimestamp, cursor)])
    }

    private String getCommitsQueryString(String repoName, String sinceTimestamp, String cursor) {
        return """
query XHRepoCommits {
    repository(owner: "xh", name: "$repoName") {
        name
        defaultBranchRef {
            target {
                ... on Commit {
                    id
                    history(after: ${cursor ? '"' + cursor + '"' : 'null'}, since: ${sinceTimestamp ? '"' + sinceTimestamp + '"' : 'null'}) {
                        totalCount
                        pageInfo {
                            endCursor
                            hasNextPage
                        }
                        nodes {
                            abbreviatedOid
                            committedDate
                            author {
                                email
                                user {
                                    name
                                    login
                                }
                            }
                            messageHeadline
                            messageBody
                            url
                            changedFiles
                            additions
                            deletions
                        }
                    }
                }
            }
        }
    }
}
""".toString()
    }

    private JSONClient _jsonClient
    private JSONClient getJsonClient() {
        if (!_jsonClient) {
            _jsonClient = new JSONClient()
        }
        return _jsonClient
    }

    void clearCaches() {
        this.commitsByRepo = new HashMap()
        this._jsonClient = null
    }

}
