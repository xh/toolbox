package io.xh.toolbox.app

import io.xh.hoist.BaseService
import io.xh.hoist.config.ConfigService
import io.xh.hoist.http.JSONClient
import io.xh.hoist.json.JSONParser
import io.xh.hoist.json.JSONSerializer
import io.xh.toolbox.github.Commit
import org.apache.http.client.methods.HttpPost
import org.apache.http.entity.StringEntity

import java.time.Instant
import java.time.format.DateTimeFormatter

class GitHubService extends BaseService {

    ConfigService configService

    Map<String, List<Commit>> commitsByRepo = new HashMap<>()

    List<Commit> getCommitsForRepo(String repoName) {
        return commitsByRepo[repoName] ?: []
    }

    List<Commit> loadCommitsForRepo(String repoName) {
        def cursor = null,
            hasNextPage = true,
            pageCount = 1,
            commits = new ArrayList<Commit>()

        while (hasNextPage) {
            log.info("Fetching page ${pageCount} for repo ${repoName} | cursor ${cursor}")
            try {
                def raw = loadCommitsForRepoInternal(repoName, cursor)
                if (raw?.data?.repository?.name != repoName) {
                    throw new RuntimeException("JSON returned by GitHub API not in expected format")
                }

                def history = raw.data.repository.defaultBranchRef.target.history,
                    pageInfo = history.pageInfo,
                    rawCommits = history.nodes as List

                log.info("Fetched ${commits.size() + rawCommits.size()} / ${history.totalCount} commits")
                cursor = pageInfo.endCursor
                // TODO - decide what to do in local dev env - maybe fetch two pages?
                hasNextPage = pageInfo.hasNextPage && pageCount < 3
                pageCount++

                rawCommits.each{it ->
                    commits.push(new Commit(
                        repo: repoName,
                        abbreviatedOid: it.abbreviatedOid,
                        author: [
                            email: it.author.email,
                            name: it.author.user?.name ?: it.author.email
                        ],
                        committedDate: parseDate(it.committedDate),
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

        log.info("Commit load complete | got ${commits.size()} commits")
        commitsByRepo.put(repoName, commits)
        return commits
    }

    Map loadCommitsForRepoInternal(String repoName, String cursor = null) {
        log.info(JSONParser.parseObject(getCommitsQueryJson(repoName, cursor)).toString())
        def post = new HttpPost('https://api.github.com/graphql')
        post.setHeader('Accept', 'application/json')
        post.setHeader('Content-type', 'application/json')
        post.setHeader('Authorization', "bearer ${configService.getString('gitHubAccessToken')}")
        post.setEntity(new StringEntity(getCommitsQueryJson(repoName, cursor)))
        jsonClient.executeAsMap(post)
    }

    private Date parseDate(String rawDate) {
        return Date.from(Instant.from(DateTimeFormatter.ISO_INSTANT.parse(rawDate)))
    }

    private String getCommitsQueryJson(String repoName, cursor = null) {
        return JSONSerializer.serialize([query: getCommitsQueryString(repoName, cursor)])
    }

    private String getCommitsQueryString(String repoName, String cursor = null) {
        return """
query XHRepoCommits {
    repository(owner: "xh", name: "$repoName") {
        name
        defaultBranchRef {
            target {
                ... on Commit {
                    id
                    history(after: ${cursor ? '"' + cursor + '"' : 'null'}) {
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

}
