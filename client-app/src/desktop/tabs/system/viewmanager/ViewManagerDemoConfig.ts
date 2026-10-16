import type {ViewInfo, ViewManagerConfig} from '@xh/hoist/cmp/viewmanager';
import {trim} from 'lodash';
import {fmtDemoConfig, raw} from '../../../common/Demo';

/** The ViewManagerModel config options set from the rail, applied on rebuild. */
export interface DemoModelConfig {
    type: string;
    instance: string;
    typeDisplayName: string;
    defaultDisplayName: string;
    globalDisplayName: string;
    initialViewName: string;
    enableAutoSave: boolean;
    enableDefault: boolean;
    enableGlobal: boolean;
    enableSharing: boolean;
    manageGlobal: boolean;
    preserveUnsavedChanges: boolean;
}

/** Build a `ViewManagerConfig` from the rail values. */
export function createModelConfig(config: DemoModelConfig): ViewManagerConfig {
    return {
        type: trim(config.type),
        // A blank text option falls back to the framework default.
        instance: trim(config.instance) || undefined,
        typeDisplayName: trim(config.typeDisplayName) || undefined,
        defaultDisplayName: trim(config.defaultDisplayName) || undefined,
        globalDisplayName: trim(config.globalDisplayName) || undefined,
        enableAutoSave: config.enableAutoSave,
        enableDefault: config.enableDefault,
        enableGlobal: config.enableGlobal,
        enableSharing: config.enableSharing,
        preserveUnsavedChanges: config.preserveUnsavedChanges,
        // On defers to the server. The client config can only restrict it.
        manageGlobal: config.manageGlobal ? undefined : false,
        initialViewSpec: createInitialViewSpec(config)
    };
}

/** The `createAsync` call that `createModelConfig` produces, leaving out framework defaults. */
export function createConfigSnippet(config: DemoModelConfig): string {
    const live = createModelConfig(config),
        nonDefault = <K extends keyof typeof FRAMEWORK_DEFAULTS>(key: K) =>
            live[key] === FRAMEWORK_DEFAULTS[key] ? undefined : live[key];

    const call = fmtDemoConfig<ViewManagerConfig>('ViewManagerModel.createAsync', {
        type: live.type,
        instance: nonDefault('instance'),
        typeDisplayName: live.typeDisplayName,
        defaultDisplayName: nonDefault('defaultDisplayName'),
        globalDisplayName: nonDefault('globalDisplayName'),
        initialViewSpec: live.initialViewSpec ? raw(initialViewSpecCode(config)) : undefined,
        enableDefault: nonDefault('enableDefault'),
        enableAutoSave: nonDefault('enableAutoSave'),
        enableSharing: nonDefault('enableSharing'),
        enableGlobal: nonDefault('enableGlobal'),
        manageGlobal: live.manageGlobal === false ? false : undefined,
        preserveUnsavedChanges: nonDefault('preserveUnsavedChanges')
    });
    return `const viewManagerModel = await ${call};`;
}

//------------------------
// Implementation
//------------------------
/** Framework defaults for the rail's config options. The snippet leaves these out. */
const FRAMEWORK_DEFAULTS = {
    instance: 'default',
    defaultDisplayName: 'default',
    globalDisplayName: 'global',
    enableAutoSave: true,
    enableDefault: true,
    enableGlobal: true,
    enableSharing: true,
    preserveUnsavedChanges: true
} as const;

/**
 * Pick the initial view by name. Required when the default view is off - otherwise the in-code
 * default is the fallback. Keep in step with `initialViewSpecCode` below, which shows this code.
 */
function createInitialViewSpec(config: DemoModelConfig): (views: ViewInfo[]) => ViewInfo {
    const name = trim(config.initialViewName),
        {enableDefault} = config;
    if (!name && enableDefault) return undefined;
    return views => views.find(it => it.name === name) ?? (enableDefault ? null : views[0]);
}

function initialViewSpecCode(config: DemoModelConfig): string {
    const name = trim(config.initialViewName),
        fallback = config.enableDefault ? 'null' : 'views[0]';
    if (!name) return `views => ${fallback}`;
    const literal = `'${name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    return `views => views.find(it => it.name === ${literal}) ?? ${fallback}`;
}
