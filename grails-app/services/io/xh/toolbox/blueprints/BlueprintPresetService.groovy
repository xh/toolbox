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
     * under `blueprints/scenarios/`, its name, and the one-line description the library shows.
     */
    static final List<Map> PRESETS = [
        [type: PORTFOLIO, token: 'one-grid', file: 'p1-one-grid', name: 'P1. One grid',
         description: 'Positions in one grid, grouped by sector and symbol.'],
        [type: PORTFOLIO, token: 'linked-dashboard', file: 'p2-linked-dashboard', name: 'P2. A linked dashboard',
         description: 'Positions by strategy and trader, linked to their orders and to day P&L by sector.'],
        [type: PORTFOLIO, token: 'morning-report', file: 'p3-morning-report', name: 'P3. A morning report',
         description: 'Day P&L by sector and region, positions in the grouping you choose, and price history.'],
        [type: PORTFOLIO, token: 'risk-report', file: 'p5-risk-report', name: 'P5. A risk and stress report',
         description: 'Shocked P&L by fund, with a hypothetical portfolio to stress beside the real one.'],
        [type: PORTFOLIO, token: 'portfolio-overview', file: 's1-overview-showcase', name: 'S1. Portfolio overview',
         description: "A fund's NAV, P&L and positions, with its manager and style."],
        [type: PORTFOLIO, token: 'risk-and-time', file: 's2-risk-time-showcase', name: 'S2. Risk and time',
         description: "Price history for the holding you select, and where today's P&L came from."],
        [type: PORTFOLIO, token: 'joining-sources', file: 's3-joins-showcase', name: 'S3. Joining sources',
         description: "Positions with each fund's NAV, manager and style, and each symbol's latest close, joined in."],
        [type: PORTFOLIO, token: 'inputs-and-actions', file: 's4-inputs-showcase', name: 'S4. Inputs and actions',
         description: 'A toolbar of inputs that sets what the positions show, and buttons that run actions.'],
        [type: PORTFOLIO, token: 'symbol-detail', file: 'd1-symbol-detail', name: 'Symbol detail',
         description: "One symbol across all funds: its close over three months, and each fund's position."],
        [type: WEATHER, token: 'weather-one-city', file: 'w1-one-city', name: 'W1. Weather for one city',
         description: 'Current conditions and the temperature forecast for one city.'],
        [type: WEATHER, token: 'weather-two-cities', file: 'w2-two-cities', name: 'W2. Two cities side by side',
         description: 'Two cities side by side: temperature, chance of rain and wind.'],
        [type: WEATHER, token: 'weather-around-the-world', file: 's5-weather-showcase', name: 'S5. Weather around the world',
         description: 'Current conditions in four cities, each with its temperature over the next 24 hours.'],
        [type: WEATHER, token: 'weather-new-york', file: 'w3-new-york', name: 'W3. New York weather',
         description: "New York's weather now, with its temperature and precipitation forecast."],
        [type: WEATHER, token: 'weather-new-york-london', file: 'w4-new-york-london', name: 'W4. New York and London',
         description: 'New York and London compared: humidity, temperature and precipitation.'],
        [type: WEATHER, token: 'weather-global-comparison', file: 'w5-global-comparison', name: 'W5. Global weather comparison',
         description: 'Two cities you choose, compared on humidity, temperature and precipitation.']
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
                if (seedHoistCore) blueprintService.ensureGlobal(preset.type, preset.token, preset.name, preset.description, blueprint, OWNER)
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
            meta: [name: preset.name, description: preset.description, draftVersion: 2, publishedVersion: 1, updated: now, updatedBy: OWNER]
        ], OWNER)
        logInfo('Seeded blueprint preset', [type: preset.type, token: id])
    }

    // A stored preset whose content differs from its file is published again, as a user's save and
    // publish would, so clients that cache by publish version see the change. A changed name or
    // description alone only updates the draft's meta.
    private void refreshJsonBlobs(draft, Map preset, Map blueprint, long now) {
        Map meta = JSONParser.parseObject(draft.meta as String),
            labels = [name: preset.name, description: preset.description]
        if (JSONParser.parseObject(draft.value as String).blueprint == blueprint) {
            if (meta.subMap('name', 'description') != labels) jsonBlobService.update(draft.token as String, [meta: meta + labels], OWNER)
            return
        }

        String id = preset.token,
               publishType = publishBlobType(preset.type as String)
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
            meta: meta + labels + [draftVersion: (meta.draftVersion as int) + 1, publishedVersion: version, updated: now, updatedBy: OWNER]
        ], OWNER)
        logInfo('Republished changed blueprint preset', [type: preset.type, token: id, version: version])
    }

    private Map loadPreset(String file) {
        InputStream stream = getClass().getResourceAsStream("/blueprints/scenarios/${file}.json")
        return stream ? JSONParser.parseObject(stream) : null
    }
}
