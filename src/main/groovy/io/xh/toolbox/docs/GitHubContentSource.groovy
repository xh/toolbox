package io.xh.toolbox.docs

import io.xh.hoist.log.LogSupport

import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.util.zip.GZIPInputStream
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream

/**
 * ContentSource backed by a GitHub tarball downloaded and held in memory.
 * Downloads a repo at a specific ref (tag, branch, or SHA) and extracts
 * text files into a map of relative path -> content.
 */
class GitHubContentSource implements ContentSource, LogSupport {

    private static final String GITHUB_API = 'https://api.github.com/repos'

    final String repo
    final String ref
    private final Map<String, String> files

    GitHubContentSource(String repo, String ref) {
        this.repo = repo
        this.ref = ref
        this.files = downloadAndExtract()
        logInfo("Using GitHub content source: ${repo}@${ref} (${files.size()} files)")
    }

    String readFile(String relativePath) {
        return files[relativePath]
    }

    boolean fileExists(String relativePath) {
        return files.containsKey(relativePath)
    }

    String getSourceLabel() {
        return "github: ${repo}@${ref}"
    }

    //-----------------------
    // Implementation
    //-----------------------
    private Map<String, String> downloadAndExtract() {
        return withInfo("Downloading ${repo}@${ref}") {
            def url = "${GITHUB_API}/${repo}/tarball/${ref}"
            def client = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build()

            def request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header('Accept', 'application/vnd.github+json')
                .GET()
                .build()

            def response = client.send(request, HttpResponse.BodyHandlers.ofInputStream())
            if (response.statusCode() != 200) {
                throw new RuntimeException("GitHub API returned ${response.statusCode()} for ${url}")
            }

            def ret = [:] as Map<String, String>
            def tarStream = new TarArchiveInputStream(new GZIPInputStream(response.body()))

            // GitHub tarballs have a single top-level dir prefix (e.g. xh-hoist-core-abc1234/).
            // Strip it so keys are relative paths like 'docs/base-classes.md'.
            String prefix = null
            def entry = tarStream.nextEntry
            while (entry != null) {
                if (!entry.isDirectory()) {
                    if (prefix == null) {
                        prefix = entry.name.substring(0, entry.name.indexOf('/') + 1)
                    }
                    def relativePath = entry.name.substring(prefix.length())
                    ret[relativePath] = new String(tarStream.readAllBytes(), 'UTF-8')
                }
                entry = tarStream.nextEntry
            }
            tarStream.close()

            return ret
        }
    }
}
