import type {BlueprintRepository} from '@xh/hoist-chat-kit/blueprint';
import {HoistCoreBlueprintRepository} from '@xh/hoist-chat-kit/blueprint';
import {XH} from '@xh/hoist/core';
import {JsonBlobBlueprintRepository} from './JsonBlobBlueprintRepository';

export type RepositoryKind = 'jsonBlob' | 'hoistCore';

/**
 * The repository for one blueprint type. `hoistCore` needs hoist-core's blueprint storage enabled
 * on the server.
 * @param type - the blueprint type's name.
 * @param kind - defaults to the `blueprintsRepository` config.
 */
export function createRepository(
    type: string,
    kind: RepositoryKind = XH.getConf('blueprintsRepository', 'jsonBlob')
): BlueprintRepository {
    return kind === 'hoistCore'
        ? new HoistCoreBlueprintRepository({type})
        : new JsonBlobBlueprintRepository({type});
}
