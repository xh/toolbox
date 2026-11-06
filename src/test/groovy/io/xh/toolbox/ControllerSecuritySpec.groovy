package io.xh.toolbox

import grails.web.Action
import io.xh.hoist.test.HoistAssertions
import org.springframework.core.io.support.PathMatchingResourcePatternResolver
import org.springframework.core.type.classreading.CachingMetadataReaderFactory
import spock.lang.Specification

import java.lang.reflect.Modifier

/**
 * Hoist denies any controller action that lacks an access annotation on the method or class, but
 * nothing flags a missing one at startup. This spec asserts that every Toolbox controller has all
 * of its actions secured.
 */
class ControllerSecuritySpec extends Specification {

    def 'controllers are discovered'() {
        expect: 'guards against the scan silently finding nothing'
        controllerClasses.size() > 10
        controllerClasses.every { c -> c.methods.any { it.isAnnotationPresent(Action) } }
    }

    def '#controller.simpleName has all actions secured'() {
        expect:
        HoistAssertions.assertAllActionsSecured(controller)

        where:
        controller << controllerClasses
    }

    /** All concrete classes named *Controller under io.xh.toolbox, found on the classpath. */
    static List<Class> getControllerClasses() {
        def resolver = new PathMatchingResourcePatternResolver(),
            readers = new CachingMetadataReaderFactory(resolver)

        resolver.getResources('classpath*:io/xh/toolbox/**/*Controller.class')
            .collect { readers.getMetadataReader(it).classMetadata.className }
            .unique()
            .sort()
            .collect { Class.forName(it) }
            .findAll { !Modifier.isAbstract(it.modifiers) && !it.isInterface() }
    }
}
