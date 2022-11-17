package io.xh.toolbox.log

import ch.qos.logback.classic.pattern.ClassicConverter;
import ch.qos.logback.classic.spi.ILoggingEvent

import static io.xh.hoist.util.Utils.exceptionRenderer
import static io.xh.hoist.util.Utils.identityService

class MachineReadableConverter extends ClassicConverter {

      @Override
      public String convert(ILoggingEvent event) {
          def msg = event.message
          def args = event.argumentArray
          def username = identityService?.username

          List<String> ret = args.collect { arg ->
              switch (arg) {
                  case List: return delimitedTxt(arg.flatten())
                  default: return delimitedTxt([arg])
              }
          }.flatten()

          if (msg) ret << addMsgKey(quoteSentence(msg))
          if (username) ret.add(ret.size() - 1, "user=$username")

          return ret.findAll().join(', ')
      }


    //---------------------------------------------------------------------------
    // Implementation
    //---------------------------------------------------------------------------
    private List<String> delimitedTxt(List msgs) {
        List<String> msgsCol = msgs.collect {
            it instanceof Throwable ? addExceptionKey(exceptionRenderer.summaryTextForThrowable(it)) :
                    it instanceof Map ? kvTxt(it) :
                            addMsgKey(it.toString())
        }

        def (messages, rest) = msgsCol.flatten().split {it.startsWith('message=')}
        def (exception, ret) = rest.flatten().split {it.startsWith('exception=')}

        messages = messages.collect {it.replace('message=', '')}.join(' | ')
        messages = messages ? "message=${quoteSentence(messages)}" : ''
        ret << messages
        ret << exception
        return ret
    }


    private List kvTxt(Map msgs) {
        List<String> ret = msgs.collect {k,v ->
            v = v instanceof Throwable ?
                    exceptionRenderer.summaryTextForThrowable(v) :
                    quoteSentence(v.toString())
            return "$k=$v"
        }
        return ret
    }

    private String quoteSentence(String str) {
        if (str.contains(' ') && !str.startsWith('"')) {
            str = '"' + str.replaceAll(/"/, '\\\\"') + '"'
        }
        return str
    }

    private String addMsgKey(String str) {
        if (str.split('=').size() != 2) {
            str = "message=$str"
        }
        return str
    }

    private String addExceptionKey(String str) {
        return "exception=${quoteSentence(str)}"
    }
}