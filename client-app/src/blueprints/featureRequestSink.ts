import type {FeatureRequestSink} from '@xh/hoist-chat-kit/genui/architect';
import {XH} from '@xh/hoist/core';

/** Where a feature request came from, which the server stores with it. */
export interface FeatureRequestOrigin {
    blueprintType: string;
    blueprintId: string;
    app: string;
}

/**
 * The Architect's feature requests, stored by Toolbox's server for XH to review in the Admin
 * console's Requests tab. The server checks and caps them again, and a refusal reaches the user.
 */
export function featureRequestSink(origin: () => FeatureRequestOrigin): FeatureRequestSink {
    return {
        async submitAsync(request) {
            const {id} = await XH.postJson({
                url: 'blueprints/featureRequest',
                body: {request, ...origin()}
            });
            return {id, message: 'Saved for the Toolbox team to review.'};
        }
    };
}
