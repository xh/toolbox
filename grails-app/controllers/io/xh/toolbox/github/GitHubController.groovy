package io.xh.toolbox.github

import io.xh.hoist.exception.DataNotAvailableException
import io.xh.hoist.security.AccessAll
import io.xh.toolbox.BaseController
import org.apache.commons.codec.binary.Hex
import org.apache.commons.lang3.StringUtils

import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

import static java.nio.charset.StandardCharsets.UTF_8

@AccessAll
class GitHubController extends BaseController {

    def configService
    def gitHubService

    def allCommits() {
        def ret = gitHubService.commitsByRepo
        if (ret.isEmpty()) {
            throw new DataNotAvailableException("GitHub commits have not been loaded on this Toolbox instance - the service might not be configured to run.")
        } else {
            renderJSON(ret)
        }
    }

    /**
     * Called by webhook registered on GitHub under our XH org.
     *
     * Note this endpoint has been whitelisted in AuthenticationService so it can be called without
     * attempting to process any auth. A configured secret validates that the request is OK.
     *
     * We might get triggers here for pushes on non-default branches, which won't result in any new
     * commits being loaded. Our incremental check is quick enough, however, that this seems fine.
     */
    def webhookTrigger() {
        def valid = validateGitHubSignature(request.reader.text, request.getHeader('x-hub-signature-256'))
        if (valid) gitHubService.loadCommitsForAllRepos()
        renderJSON(success: valid)
    }


    //------------------------
    // Implementation
    //------------------------
    private boolean validateGitHubSignature(String payload, String signature) {
        if (!payload) return false

        def secret = configService.getString('gitHubWebhookTriggerSecret', '')
        if (!secret) return false

        def algo = 'HmacSHA256',
            keySpec = new SecretKeySpec(secret.getBytes(UTF_8), algo),
            mac = Mac.getInstance(algo)

        mac.init(keySpec)
        def expected = 'sha256=' + Hex.encodeHexString(mac.doFinal(payload.getBytes(UTF_8)))

        return StringUtils.equals(expected, signature)
    }

}
