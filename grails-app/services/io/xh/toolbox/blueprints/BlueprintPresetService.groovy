package io.xh.toolbox.blueprints

import io.xh.hoist.BaseService
import io.xh.hoist.config.AppConfig
import io.xh.hoist.json.JSONParser

/**
 * Seeds the Blueprints designer's preset blueprints at startup, so the client never does. Each
 * preset is a global blueprint: owned by {@link #OWNER}, readable by every user, and published
 * once. It is created if missing, and published again if its stored content differs from its file,
 * in both repositories the client can use:
 *
 *   - JsonBlobs, in the layout of the client's `JsonBlobBlueprintRepository`.
 *   - hoist-core's `BlueprintService`, via `ensureGlobal`, when hoist-core provides it and blueprint
 *     storage is enabled.
 *
 * Also gives hoist-core's `xhBlueprintConfig` Toolbox's values while it is still unconfigured.
 */
class BlueprintPresetService extends BaseService {

    /** Owner of the presets - a fixed name, not a login, so presets are copied rather than edited. */
    static final String OWNER = 'toolbox'

    static final String PORTFOLIO = 'toolbox.portfolio', WEATHER = 'toolbox.weather'

    /**
     * Each preset's blueprint type, its token - its id in both repositories, and in links - its file
     * under `blueprints/scenarios/`, and its name.
     */
    static final List<Map> PRESETS = [
        [type: PORTFOLIO, token: 'one-grid', file: 'p1-one-grid', name: 'P1. One grid'],
        [type: PORTFOLIO, token: 'linked-dashboard', file: 'p2-linked-dashboard', name: 'P2. A linked dashboard'],
        [type: PORTFOLIO, token: 'morning-report', file: 'p3-morning-report', name: 'P3. A morning report'],
        [type: PORTFOLIO, token: 'risk-report', file: 'p5-risk-report', name: 'P5. A risk and stress report'],
        [type: PORTFOLIO, token: 'portfolio-overview', file: 's1-overview-showcase', name: 'S1. Portfolio overview'],
        [type: PORTFOLIO, token: 'risk-and-time', file: 's2-risk-time-showcase', name: 'S2. Risk and time'],
        [type: PORTFOLIO, token: 'joining-sources', file: 's3-joins-showcase', name: 'S3. Joining sources'],
        [type: PORTFOLIO, token: 'inputs-and-actions', file: 's4-inputs-showcase', name: 'S4. Inputs and actions'],
        [type: PORTFOLIO, token: 'symbol-detail', file: 'd1-symbol-detail', name: 'Symbol detail'],
        [type: WEATHER, token: 'weather-one-city', file: 'w1-one-city', name: 'W1. Weather for one city'],
        [type: WEATHER, token: 'weather-two-cities', file: 'w2-two-cities', name: 'W2. Two cities side by side'],
        [type: WEATHER, token: 'weather-around-the-world', file: 's5-weather-showcase', name: 'S5. Weather around the world'],
        [type: WEATHER, token: 'weather-new-york', file: 'w3-new-york', name: 'W3. New York weather'],
        [type: WEATHER, token: 'weather-new-york-london', file: 'w4-new-york-london', name: 'W4. New York and London'],
        [type: WEATHER, token: 'weather-global-comparison', file: 'w5-global-comparison', name: 'W5. Global weather comparison']
    ]

    /** The JsonBlob types of the client's `JsonBlobBlueprintRepository`, for a blueprint type. */
    static String draftBlobType(String type) { "blueprint.$type" }
    static String publishBlobType(String type) { "blueprintPublish.$type" }

    /** What Toolbox, a demo, sets in `xhBlueprintConfig`: storage on, and every user may create and share. */
    static final Map TOOLBOX_CONFIG = [enabled: true, createRoles: ['*'], globalShareRoles: ['*']]

    def configService,
        jsonBlobService,
        blueprintService  // hoist-core's, present only in a hoist-core that provides it

    void init() {
        if (!isPrimary) return
        applyToolboxConfig()
        seedPresets()
    }

    void seedPresets() {
        boolean seedHoistCore = blueprintService && configService.getMap('xhBlueprintConfig', [:]).enabled
        PRESETS.each { Map preset ->
            Map blueprint = loadPreset(preset.file as String)
            if (!blueprint) {
                logWarn('Blueprint preset not found on the classpath', [file: preset.file])
                return
            }
            try {
                seedJsonBlobs(preset, blueprint)
                if (seedHoistCore) blueprintService.ensureGlobal(preset.type, preset.token, preset.name, null, blueprint, OWNER)
            } catch (Exception e) {
                logError('Failed to seed blueprint preset', [token: preset.token], e)
            }
        }
    }

    //------------------
    // Implementation
    //------------------
    private void applyToolboxConfig() {
        if (configService.hasConfig('xhBlueprintConfig') && !configService.getMap('xhBlueprintConfig')) {
            AppConfig.withTransaction { configService.setValue('xhBlueprintConfig', TOOLBOX_CONFIG, OWNER) }
            logInfo('Set xhBlueprintConfig to Toolbox values', TOOLBOX_CONFIG)
        }
    }

    // The draft at version 2 and one publish, as a create and a publish leave them. Each blob is
    // created only if missing, so a seed cut short completes on the next start.
    private void seedJsonBlobs(Map preset, Map blueprint) {
        String id = preset.token,
               draftType = draftBlobType(preset.type as String),
               publishType = publishBlobType(preset.type as String),
               publishName = "$id:1"
        long now = System.currentTimeMillis()
        if (!jsonBlobService.find(publishType, publishName, OWNER, OWNER)) jsonBlobService.create([
            type: publishType,
            name: publishName,
            owner: OWNER,
            acl: '*',
            value: [blueprint: blueprint],
            meta: [blueprintId: id, version: 1, published: now, publishedBy: OWNER, renames: []]
        ], OWNER)
        def draft = jsonBlobService.find(draftType, id, OWNER, OWNER)
        if (draft) {
            refreshJsonBlobs(draft, preset, blueprint, now)
            return
        }
        jsonBlobService.create([
            type: draftType,
            name: id,
            owner: OWNER,
            acl: '*',
            value: [blueprint: blueprint, pendingRenames: []],
            meta: [name: preset.name, draftVersion: 2, publishedVersion: 1, updated: now, updatedBy: OWNER]
        ], OWNER)
        logInfo('Seeded blueprint preset', [type: preset.type, token: id])
    }

    // A stored preset whose content differs from its file is published again, as a user's save and
    // publish would, so clients that cache by publish version see the change.
    private void refreshJsonBlobs(draft, Map preset, Map blueprint, long now) {
        if (JSONParser.parseObject(draft.value as String).blueprint == blueprint) return

        String id = preset.token,
               publishType = publishBlobType(preset.type as String)
        Map meta = JSONParser.parseObject(draft.meta as String)
        int version = (meta.publishedVersion as int) + 1
        String publishName = "$id:$version"
        if (!jsonBlobService.find(publishType, publishName, OWNER, OWNER)) jsonBlobService.create([
            type: publishType,
            name: publishName,
            owner: OWNER,
            acl: '*',
            value: [blueprint: blueprint],
            meta: [blueprintId: id, version: version, published: now, publishedBy: OWNER, renames: []]
        ], OWNER)
        jsonBlobService.update(draft.token as String, [
            value: [blueprint: blueprint, pendingRenames: []],
            meta: meta + [draftVersion: (meta.draftVersion as int) + 1, publishedVersion: version, updated: now, updatedBy: OWNER]
        ], OWNER)
        logInfo('Republished changed blueprint preset', [type: preset.type, token: id, version: version])
    }

    private Map loadPreset(String file) {
        InputStream stream = getClass().getResourceAsStream("/blueprints/scenarios/${file}.json")
        return stream ? JSONParser.parseObject(stream) : null
    }
}
