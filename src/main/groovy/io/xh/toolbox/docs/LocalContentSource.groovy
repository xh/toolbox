package io.xh.toolbox.docs

import groovy.util.logging.Slf4j

/**
 * ContentSource backed by a local filesystem checkout.
 */
@Slf4j
class LocalContentSource implements ContentSource {

    final File root

    LocalContentSource(String rootPath) {
        this.root = new File(rootPath).canonicalFile
        if (!root.isDirectory()) {
            throw new IllegalArgumentException("Root directory does not exist: $root")
        }
        log.info("Using local content source: $root")
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
        return "local: ${root.absolutePath}"
    }

    private File resolveFile(String relativePath) {
        if (relativePath.contains('..')) return null
        def file = new File(root, relativePath).canonicalFile
        if (!file.absolutePath.startsWith(root.absolutePath)) return null
        return file
    }
}
