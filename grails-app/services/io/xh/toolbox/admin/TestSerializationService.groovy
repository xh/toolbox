/*
 * This file belongs to Hoist, an application development toolkit
 * developed by Extremely Heavy Industries (www.xh.io | info@xh.io)
 *
 * Copyright © 2023 Extremely Heavy Industries Inc.
 */

package io.xh.toolbox.admin

import com.esotericsoftware.kryo.Kryo
import com.esotericsoftware.kryo.KryoSerializable
import com.esotericsoftware.kryo.io.Input
import com.esotericsoftware.kryo.io.Output
import io.xh.hoist.BaseService
import io.xh.hoist.cluster.ReplicatedValue
import io.xh.hoist.log.LogSupport

import static io.xh.hoist.json.JSONSerializer.serializePretty
import static java.lang.System.currentTimeMillis

class SerializationTestService extends BaseService {

    private ReplicatedValue<TestObject> replicatedValue = getReplicatedValue('testVal')

    void init() {
        replicatedValue.set(new TestObject(foo: 'foo', bar: new Date(), baz: [submap: 'hi'], biz: null))
        def val = replicatedValue.get()
        logInfo('Results', val.foo, val.bar, val.baz, val.biz)
    }
}

class TestObject implements Serializable, LogSupport, KryoSerializable {
    String foo
    Date bar
    Map baz
    Object biz

    void write(Kryo kryo, Output output) {
        withSingleInfo('Serializing') {
            output.writeString(foo)
            kryo.writeObjectOrNull(output, bar, Date)
            kryo.writeClassAndObject(output, baz)
            kryo.writeClassAndObject(output, biz)
        }
    }

    void read(Kryo kryo, Input input) {
        withSingleInfo('Deserializing') {
            foo = input.readString()
            bar = kryo.readObject(input, Date)
            baz = kryo.readClassAndObject(input) as Map
            biz = kryo.readClassAndObject(input)

        }
    }

    private void withSingleInfo(String msg, Closure c) {
        Long start = currentTimeMillis()
        c()
        logInfo(msg, [_elapsedMs: currentTimeMillis() - start])
    }
}