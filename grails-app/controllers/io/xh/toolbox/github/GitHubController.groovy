package io.xh.toolbox.github

import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

@AccessAll
class GitHubController extends BaseController {

    def gitHubService

    def commits(String id) {
        renderJSON(gitHubService.getCommitsForRepo(id))
    }

    // TODO - move to admin controller
    def loadCommitsForRepo(String repo) {
        gitHubService.loadCommitsForRepo(repo)
        renderJSON(success: true)
    }

}
