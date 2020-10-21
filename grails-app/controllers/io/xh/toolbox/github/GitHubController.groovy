package io.xh.toolbox.github

import io.xh.hoist.exception.DataNotAvailableException
import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController

@AccessAll
class GitHubController extends BaseController {

    def gitHubService

    def allCommits() {
        def ret = gitHubService.commitsByRepo
        if (ret.isEmpty()) {
            throw new DataNotAvailableException("GitHub commits have not been loaded on this Toolbox instance - the service might not be configured to run.")
        } else {
            renderJSON(ret)
        }
    }

}
