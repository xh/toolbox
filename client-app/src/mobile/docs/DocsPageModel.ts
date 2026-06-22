import {XH} from '@xh/hoist/core';
import {DocViewModel} from '../../core/docs/DocViewModel';

/**
 * Mobile Docs reader model. The reader mounts at a `docs` route segment that carries the doc params
 * directly (no `docRef` child as on desktop). That segment lives in two places: a standalone
 * `default.docs` (deep-links / home) and a drilldown child of each example (`default.<example>.docs`)
 * so the reader stacks on top of the example and back returns to it. Both forms end in `.docs`, and
 * route write-backs (e.g. following an in-content doc link) must stay on whichever one is current.
 */
export class DocsPageModel extends DocViewModel {
    protected override isDocsRoute(name: string): boolean {
        return name.endsWith('.docs');
    }

    protected override get docRouteName(): string {
        return XH.routerState.name;
    }

    override onLinked() {
        this.loadInitialDocFromRoute();
    }
}
