package io.xh.toolbox.blueprints

import grails.testing.gorm.DataTest
import grails.testing.services.ServiceUnitTest
import io.xh.hoist.config.AppConfig
import io.xh.hoist.jsonblob.JsonBlob
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
        JsonBlob.findAllByType(BLUEPRINT_TYPE)*.name.sort() == PRESETS*.id.sort()

        when:
        def draft = JsonBlob.findByTypeAndName(BLUEPRINT_TYPE, 'bp-preset-p3')
        def publish = JsonBlob.findByTypeAndName(PUBLISH_TYPE, 'bp-preset-p3:1')
        Map draftMeta = parseObject(draft.meta), publishMeta = parseObject(publish.meta)

        then:
        [draft.owner, draft.acl, publish.owner, publish.acl] == [OWNER, '*', OWNER, '*']
        parseObject(draft.value) == [blueprint: preset('p3-morning-report'), pendingRenames: []]
        draftMeta.subMap('name', 'draftVersion', 'publishedVersion', 'updatedBy') ==
            [name: 'P3. A morning report', draftVersion: 2, publishedVersion: 1, updatedBy: OWNER]
        draftMeta.updated instanceof Number
        !draftMeta.containsKey('description')
        parseObject(publish.value) == [blueprint: preset('p3-morning-report')]
        publishMeta.subMap('blueprintId', 'version', 'publishedBy', 'renames') ==
            [blueprintId: 'bp-preset-p3', version: 1, publishedBy: OWNER, renames: []]
        publishMeta.published instanceof Number
    }

    def 'completes a seed that was cut short, without duplicating its publish'() {
        given:
        service.seedPresets()
        JsonBlob.findByTypeAndName(BLUEPRINT_TYPE, 'bp-preset-w1').delete(flush: true)

        when:
        service.seedPresets()

        then:
        JsonBlob.count() == PRESETS.size() * 2
        JsonBlob.countByTypeAndName(PUBLISH_TYPE, 'bp-preset-w1:1') == 1
    }

    def 'seeds hoist-core\'s blueprints only when it provides BlueprintService and storage is enabled'() {
        given:
        service.blueprintService = blueprintService ? [ensureGlobal: { String name, String desc, Map bp, String owner ->
            ensureGlobalCalls << [name, desc, bp, owner]
        }] : null
        blueprintConfig.enabled = enabled

        when:
        service.seedPresets()

        then:
        ensureGlobalCalls*.get(0) == expected
        ensureGlobalCalls.every { it[1] == null && it[3] == OWNER }
        !ensureGlobalCalls || ensureGlobalCalls[0][2] == preset('p1-one-grid')

        where:
        blueprintService | enabled || expected
        true             | true    || PRESETS*.name
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
