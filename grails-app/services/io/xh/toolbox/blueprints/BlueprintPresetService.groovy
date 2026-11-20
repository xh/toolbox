package io.xh.toolbox.blueprints

import io.xh.hoist.BaseService
import io.xh.hoist.config.AppConfig
import io.xh.hoist.json.JSONParser

/**
 * Seeds the Blueprints designer's preset blueprints at startup, so the client never does. Each
 * preset is a global blueprint: owned by {@link #OWNER}, readable by every user, and published
 * once. It is created only if missing, in both repositories the client can use:
 *
 *   - JsonBlobs, in the layout of the client's `JsonBlobBlueprintRepository`.
 *   - hoist-core's `BlueprintService`, when hoist-core provides it and blueprint storage is enabled.
 *
 * Also gives hoist-core's `xhBlueprintConfig` Toolbox's values while it is still unconfigured.
 */
class BlueprintPresetService extends BaseService {

    /** Owner of the presets - a fixed name, not a login, so presets are copied rather than edited. */
    static final String OWNER = 'toolbox'

    static final String BLUEPRINT_TYPE = 'toolboxBlueprint'
    static final String PUBLISH_TYPE = 'toolboxBlueprintPublish'

    /** Each preset's stable ID, its file under `blueprints/scenarios/`, and its name. */
    static final List<Map> PRESETS = [
        [id: 'bp-preset-p1', file: 'p1-one-grid', name: 'P1. One grid'],
        [id: 'bp-preset-p2', file: 'p2-linked-dashboard', name: 'P2. A linked dashboard'],
        [id: 'bp-preset-p3', file: 'p3-morning-report', name: 'P3. A morning report'],
        [id: 'bp-preset-p5', file: 'p5-risk-report', name: 'P5. A risk and stress report'],
        [id: 'bp-preset-w1', file: 'w1-one-city', name: 'W1. Weather for one city'],
        [id: 'bp-preset-w2', file: 'w2-two-cities', name: 'W2. Two cities side by side'],
        [id: 'bp-preset-s3', file: 's3-joins-showcase', name: 'S3. Joining sources'],
        [id: 'bp-preset-s5', file: 's5-weather-showcase', name: 'S5. Weather around the world']
    ]

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
                if (seedHoistCore) blueprintService.ensureGlobal(preset.name, null, blueprint, OWNER)
            } catch (Exception e) {
                logError('Failed to seed blueprint preset', [id: preset.id], e)
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
        String id = preset.id,
               publishName = "$id:1"
        long now = System.currentTimeMillis()
        if (!jsonBlobService.find(PUBLISH_TYPE, publishName, OWNER, OWNER)) jsonBlobService.create([
            type: PUBLISH_TYPE,
            name: publishName,
            owner: OWNER,
            acl: '*',
            value: [blueprint: blueprint],
            meta: [blueprintId: id, version: 1, published: now, publishedBy: OWNER, renames: []]
        ], OWNER)
        if (jsonBlobService.find(BLUEPRINT_TYPE, id, OWNER, OWNER)) return
        jsonBlobService.create([
            type: BLUEPRINT_TYPE,
            name: id,
            owner: OWNER,
            acl: '*',
            value: [blueprint: blueprint, pendingRenames: []],
            meta: [name: preset.name, draftVersion: 2, publishedVersion: 1, updated: now, updatedBy: OWNER]
        ], OWNER)
        logInfo('Seeded blueprint preset', [id: id])
    }

    private Map loadPreset(String file) {
        InputStream stream = getClass().getResourceAsStream("/blueprints/scenarios/${file}.json")
        return stream ? JSONParser.parseObject(stream) : null
    }
}
