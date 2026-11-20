import type {BlueprintRepository} from '@xh/hoist-chat-kit/blueprint';
import {HoistCoreBlueprintRepository} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import {JsonBlobBlueprintRepository} from './JsonBlobBlueprintRepository';

export type RepositoryKind = 'jsonBlob' | 'hoistCore';

/**
 * The Designer's repository. `hoistCore` needs hoist-core's blueprint storage enabled on the server.
 * @param kind - defaults to the `blueprintsRepository` config.
 */
export function createRepository(
    kind: RepositoryKind = XH.getConf('blueprintsRepository', 'jsonBlob')
): BlueprintRepository {
    return kind === 'hoistCore'
        ? new HoistCoreBlueprintRepository()
        : new JsonBlobBlueprintRepository();
}
