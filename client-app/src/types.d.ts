/**
 * Module declarations for non-code imports processed by webpack.
 * Markdown files are emitted via file-loader and return a URL string.
 */
declare module '*.md' {
    const url: string;
    export default url;
}
