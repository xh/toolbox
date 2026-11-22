package io.xh.toolbox.blueprints

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import io.xh.hoist.config.AppConfig
import io.xh.hoist.jsonblob.JsonBlob
import io.xh.hoist.json.JSONSerializer
import io.xh.hoist.jsonblob.JsonBlobService
import io.xh.hoist.test.HoistUnitTest
import spock.lang.Specification

import static io.xh.hoist.json.JSONParser.parseObject
import static io.xh.toolbox.blueprints.BlueprintPresetService.*

/**
 * Tests the presets {@link BlueprintPresetService} seeds: JsonBlobs in the client's layout, written
 * through the real `JsonBlobService`, and calls to hoist-core's `ensureGlobal` when it is there.
 * The preset files here are minimal fixtures under `src/test/resources/blueprints/scenarios/`.
 */
class BlueprintPresetServiceSpec extends Specification implements ServiceUnitTest<BlueprintPresetService>, DataTest, HoistUnitTest {

    Map blueprintConfig = [:]
    List<List> configWrites = []
    List<List> ensureGlobalCalls = []

    Class[] getDomainClassesToMock() { [JsonBlob, AppConfig] }

    def setup() {
        service.jsonBlobService = defineService(JsonBlobService)
        service.configService = new Expando(
            hasConfig: { String name -> name == 'xhBlueprintConfig' },
            getMap: { String name, Map notFound = null -> blueprintConfig },
            setValue: { String name, Object value, String by -> configWrites << [name, value, by] }
        )
    }

    private static Map preset(String file) {
        parseObject(BlueprintPresetService.getResourceAsStream("/blueprints/scenarios/${file}.json"))
    }

    def 'seeds each preset once, as a draft and one publish in the client\'s JsonBlob layout'() {
        when:
        service.seedPresets()
        service.seedPresets()

        then:
        JsonBlob.count() == PRESETS.size() * 2
        JsonBlob.findAllByType('blueprint.toolbox.portfolio')*.name.sort() == PRESETS.findAll { it.type == PORTFOLIO }*.token.sort()
        JsonBlob.findAllByType('blueprint.toolbox.weather')*.name.sort() == PRESETS.findAll { it.type == WEATHER }*.token.sort()

        when:
        def draft = JsonBlob.findByTypeAndName('blueprint.toolbox.portfolio', 'morning-report')
        def publish = JsonBlob.findByTypeAndName('blueprintPublish.toolbox.portfolio', 'morning-report:1')
        Map draftMeta = parseObject(draft.meta), publishMeta = parseObject(publish.meta)

        then:
        [draft.owner, draft.acl, publish.owner, publish.acl] == [OWNER, '*', OWNER, '*']
        parseObject(draft.value) == [blueprint: preset('p3-morning-report'), pendingRenames: []]
        draftMeta.subMap('name', 'draftVersion', 'publishedVersion', 'updatedBy') ==
            [name: 'P3. A morning report', draftVersion: 2, publishedVersion: 1, updatedBy: OWNER]
        draftMeta.updated instanceof Number
        draftMeta.description == PRESETS.find { it.token == 'morning-report' }.description
        parseObject(publish.value) == [blueprint: preset('p3-morning-report')]
        publishMeta.subMap('blueprintId', 'version', 'publishedBy', 'renames') ==
            [blueprintId: 'morning-report', version: 1, publishedBy: OWNER, renames: []]
        publishMeta.published instanceof Number
    }

    def 'completes a seed that was cut short, without duplicating its publish'() {
        given:
        service.seedPresets()
        JsonBlob.findByTypeAndName('blueprint.toolbox.weather', 'weather-one-city').delete(flush: true)

        when:
        service.seedPresets()

        then:
        JsonBlob.count() == PRESETS.size() * 2
        JsonBlob.countByTypeAndName('blueprintPublish.toolbox.weather', 'weather-one-city:1') == 1
    }

    def 'republishes a seeded preset whose stored content differs from its file, once'() {
        given:
        service.seedPresets()
        def draft = JsonBlob.findByTypeAndName('blueprint.toolbox.portfolio', 'morning-report')
        draft.value = '{"blueprint": {"stale": true}, "pendingRenames": []}'
        draft.save(flush: true)

        when:
        service.seedPresets()
        service.seedPresets()

        then:
        JsonBlob.count() == PRESETS.size() * 2 + 1
        parseObject(JsonBlob.findByTypeAndName('blueprintPublish.toolbox.portfolio', 'morning-report:2').value) == [blueprint: preset('p3-morning-report')]
        parseObject(JsonBlob.findByTypeAndName('blueprintPublish.toolbox.portfolio', 'morning-report:2').meta).subMap('blueprintId', 'version', 'publishedBy') ==
            [blueprintId: 'morning-report', version: 2, publishedBy: OWNER]

        when:
        def refreshed = JsonBlob.findByTypeAndName('blueprint.toolbox.portfolio', 'morning-report')

        then:
        parseObject(refreshed.value) == [blueprint: preset('p3-morning-report'), pendingRenames: []]
        parseObject(refreshed.meta).subMap('name', 'draftVersion', 'publishedVersion') ==
            [name: 'P3. A morning report', draftVersion: 3, publishedVersion: 2]
    }

    def 'takes a changed name or description without publishing again'() {
        given:
        service.seedPresets()
        def draft = JsonBlob.findByTypeAndName('blueprint.toolbox.portfolio', 'morning-report')
        draft.meta = JSONSerializer.serialize(parseObject(draft.meta) + [name: 'Old name', description: 'Old description'])
        draft.save(flush: true)

        when:
        service.seedPresets()

        then:
        JsonBlob.count() == PRESETS.size() * 2
        parseObject(JsonBlob.findByTypeAndName('blueprint.toolbox.portfolio', 'morning-report').meta).subMap('name', 'description', 'publishedVersion') ==
            [name: 'P3. A morning report', description: PRESETS.find { it.token == 'morning-report' }.description, publishedVersion: 1]
    }

    def 'every preset has a one-line description'() {
        expect:
        PRESETS.every { it.description instanceof String && it.description.length() <= 120 && !it.description.contains('\n') }
    }

    def 'seeds hoist-core\'s blueprints only when it provides BlueprintService and storage is enabled'() {
        given:
        service.blueprintService = blueprintService ? [ensureGlobal: { String type, String token, String name, String desc, Map bp, String owner ->
            ensureGlobalCalls << [type, token, name, desc, bp, owner]
        }] : null
        blueprintConfig.enabled = enabled

        when:
        service.seedPresets()

        then:
        ensureGlobalCalls.collect { it[0..2] } == expected
        ensureGlobalCalls.every { it[3] && it[5] == OWNER }
        ensureGlobalCalls*.get(3) == (expected ? PRESETS*.description : [])
        !ensureGlobalCalls || ensureGlobalCalls[0][4] == preset('p1-one-grid')

        where:
        blueprintService | enabled || expected
        true             | true    || PRESETS.collect { [it.type, it.token, it.name] }
        true             | false   || []
        false            | true    || []
    }

    def 'gives xhBlueprintConfig Toolbox\'s values only while it is unconfigured'() {
        when:
        service.init()

        then:
        configWrites == [['xhBlueprintConfig', TOOLBOX_CONFIG, OWNER]]

        when:
        configWrites.clear()
        blueprintConfig.enabled = false
        service.init()

        then:
        configWrites == []
    }
}
