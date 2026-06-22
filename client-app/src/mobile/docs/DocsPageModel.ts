import {DocViewModel} from '../../core/docs/DocViewModel';

/**
 * Mobile Docs reader model. The mobile docs route (`default.docs`) carries the doc params directly
 * on its single Navigator page - there is no `docRef` child segment as on desktop - so the bare
 * `docRouteName` default from `DocViewModel` is correct here and needs no override. This just
 * initializes from the route on mount.
 */
export class DocsPageModel extends DocViewModel {
    override onLinked() {
        this.loadInitialDocFromRoute();
    }
}
