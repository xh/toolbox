import {XH} from '@xh/hoist/core';
import {encodeDocId} from './docs/DocUtils';

/** Default Hoist Docs URL, used when the `sourceUrls` config does not set `hoistDocs`. */
const DEFAULT_HOIST_DOCS_URL = 'https://docs.xh.io';

/** Root URL of the Hoist Docs app, which hosts the desktop docs viewer. */
export function hoistDocsUrl(): string {
    return XH.getConf('sourceUrls', {})?.hoistDocs ?? DEFAULT_HOIST_DOCS_URL;
}

/** URL of one doc in the Hoist Docs viewer, or of the viewer itself when no doc is given. */
export function hoistDocUrl(source?: string, docPath?: string, section?: string): string {
    const base = `${hoistDocsUrl()}/app/docs`;
    if (!source || !docPath) return base;
    const url = `${base}/${source}/${encodeDocId(docPath)}`;
    return section ? `${url}?section=${encodeURIComponent(section)}` : url;
}

/** Open the Hoist Docs viewer in a new browser tab. */
export function openHoistDocs() {
    window.open(hoistDocUrl(), '_blank');
}
