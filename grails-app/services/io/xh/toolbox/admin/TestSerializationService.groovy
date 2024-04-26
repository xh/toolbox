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


class SerializationTestService extends BaseService {

    private ReplicatedValue<TestObject> replicatedValue = getReplicatedValue('testVal')

    void init() {
        def val = replicatedValue.get()
        if (!val) {
            replicatedValue.set(new TestObject(foo: 'foo', bar: new Date(), baz: [submap: 'hi'], biz: null))
            val = replicatedValue.get()
        }
        logInfo('Results', val.foo, val.bar, val.baz, val.biz)
    }
}

class TestObject implements Serializable, LogSupport, KryoSerializable {
    String foo
    Date bar
    Map baz
    Object biz

    void write(Kryo kryo, Output output) {
        output.writeString(foo)
        kryo.writeObjectOrNull(output, bar, Date)
        kryo.writeClassAndObject(output, baz)
        kryo.writeClassAndObject(output, biz)
    }

    void read(Kryo kryo, Input input) {
        foo = input.readString()
        bar = kryo.readObject(input, Date)
        baz = kryo.readClassAndObject(input) as Map
        biz = kryo.readClassAndObject(input)
    }
}