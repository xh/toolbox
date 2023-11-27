import {hoistCmp} from '@xh/hoist/core';
import {explodingPanel} from '../../../common';

export const errorWidget = hoistCmp.factory({
    render({componentName, viewModel, ...props}) {
        return explodingPanel({
            extraText:
                `Fortunately, ${componentName} automatically wraps its views in an ErrorBoundary, so ` +
                'the entire app will not crash - only this view, which will have its contents ' +
                'replaced by a managed error message.',
            ...props
        });
    }
});
