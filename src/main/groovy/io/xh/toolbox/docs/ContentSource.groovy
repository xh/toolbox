package io.xh.toolbox.docs

/**
 * Abstraction for reading documentation content from hoist-react or hoist-core.
 * Implementations handle local filesystem vs. GitHub archive access.
 */
interface ContentSource {

    /** Read file content as a string. Returns null if file does not exist. */
    String readFile(String relativePath)

    /** Check if a file exists at the given relative path. */
    boolean fileExists(String relativePath)

    /** Descriptive label for logging/display (e.g. local path or GitHub ref). */
    String getSourceLabel()
}
