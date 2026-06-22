import {DocViewModel} from '../../core/docs/DocViewModel';

/**
 * Mobile Docs reader model. The mobile docs route (`default.docs`) carries the doc params directly
 * on its single Navigator page - there is no `docRef` child segment as on desktop - and is the
 * source of truth for which doc is shown. So this overrides `docRouteName` to the bare route and
 * otherwise just initializes from the route on mount.
 */
export class DocsPageModel extends DocViewModel {
    protected override get docRouteName(): string {
        return this.BASE_ROUTE;
    }

    override onLinked() {
        this.loadInitialDocFromRoute();
    }
}
