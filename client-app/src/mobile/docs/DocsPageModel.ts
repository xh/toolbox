import {DocViewModel} from '../../core/docs/DocViewModel';

/**
 * Mobile Docs reader model. The `default.docs.docRef` route is the source of truth for which doc is
 * shown, so this adds nothing to the shared `DocViewModel` beyond initializing from the route on mount.
 */
export class DocsPageModel extends DocViewModel {
    override onLinked() {
        this.loadInitialDocFromRoute();
    }
}
