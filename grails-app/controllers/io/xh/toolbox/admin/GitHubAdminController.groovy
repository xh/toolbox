package io.xh.toolbox.admin

import io.xh.hoist.security.Access
import io.xh.toolbox.BaseController

@Access(['HOIST_ADMIN_READER'])
class GitHubAdminController extends BaseController {

    def gitHubService

    def loadCommitsForAllRepos(Boolean forceFullLoad) {
        renderJSON(gitHubService.loadCommitsForAllRepos(forceFullLoad))
    }

    def loadCommits(String repo, Boolean forceFullLoad) {
        renderJSON(gitHubService.loadCommitsForRepo(repo, forceFullLoad))
    }

}
