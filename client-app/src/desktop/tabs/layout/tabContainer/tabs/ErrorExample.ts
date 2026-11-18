import {hoistCmp} from '@xh/hoist/core';
import {explodingPanel} from '../../../../common/ExplodingPanel';

export const errorExample = hoistCmp.factory({
    render() {
        return explodingPanel({
            extraText:
                'Fortunately, Hoist tabs are automatically wrapped in an ErrorBoundary, so ' +
                'the entire app will not crash - only this tab, which will have its contents ' +
                'replaced by a managed error message.'
        });
    }
});
