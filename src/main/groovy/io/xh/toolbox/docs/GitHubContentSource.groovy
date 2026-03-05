package io.xh.toolbox.docs

import io.xh.hoist.log.LogSupport

import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse
import java.util.zip.GZIPInputStream
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream

/**
 * ContentSource backed by a downloaded GitHub tarball, cached locally.
 * Downloads a repo at a specific ref (tag, branch, or SHA) and extracts
 * it to ~/.cache/toolbox-docs/<repo-name>/<ref>/.
 */
class GitHubContentSource implements ContentSource, LogSupport {

    private static final String GITHUB_API = 'https://api.github.com/repos'

    final String repo
    final String ref
    final File cacheDir
    final File root

    GitHubContentSource(String repo, String ref) {
        this.repo = repo
        this.ref = ref

        def repoName = repo.replace('/', '-')
        this.cacheDir = new File(System.getProperty('user.home'), ".cache/toolbox-docs/${repoName}/${ref}")
        this.root = ensureDownloaded()
        logInfo("Using GitHub content source: ${repo}@${ref} -> ${root}")
    }

    @Override
    String readFile(String relativePath) {
        def file = resolveFile(relativePath)
        return file?.exists() ? file.text : null
    }

    @Override
    boolean fileExists(String relativePath) {
        return resolveFile(relativePath)?.exists() ?: false
    }

    @Override
    String getSourceLabel() {
        return "github: ${repo}@${ref}"
    }

    private File resolveFile(String relativePath) {
        if (relativePath.contains('..')) return null
        def file = new File(root, relativePath).canonicalFile
        if (!file.absolutePath.startsWith(root.absolutePath)) return null
        return file
    }

    private File ensureDownloaded() {
        if (cacheDir.isDirectory()) {
            def extracted = findExtractedRoot()
            if (extracted) return extracted
        }

        logInfo("Downloading ${repo} archive for ref '${ref}'...")
        cacheDir.mkdirs()

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

        def gzipStream = new GZIPInputStream(response.body())
        def tarStream = new TarArchiveInputStream(gzipStream)

        def entry = tarStream.nextEntry
        while (entry != null) {
            def targetPath = new File(cacheDir, entry.name)
            if (entry.isDirectory()) {
                targetPath.mkdirs()
            } else {
                targetPath.parentFile.mkdirs()
                targetPath.bytes = tarStream.readAllBytes()
            }
            entry = tarStream.nextEntry
        }
        tarStream.close()

        logInfo("Downloaded and extracted to ${cacheDir}")

        def extracted = findExtractedRoot()
        if (!extracted) {
            throw new RuntimeException("Failed to find extracted content in ${cacheDir}")
        }
        return extracted
    }

    /** GitHub tarballs contain a single top-level directory (e.g. xh-hoist-core-abc1234). */
    private File findExtractedRoot() {
        def children = cacheDir.listFiles()?.findAll { it.isDirectory() }
        return children?.size() == 1 ? children[0] : null
    }
}
