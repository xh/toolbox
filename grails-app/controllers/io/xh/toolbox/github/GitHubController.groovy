package io.xh.toolbox.github

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

@AccessAll
class GitHubController extends BaseController {

    def gitHubService

    def allCommits() {
        renderJSON(gitHubService.commitsByRepo)
    }

    def commits(String id) {
        renderJSON(gitHubService.getCommitsForRepo(id))
    }

}
