package io.xh.toolbox.log

import ch.qos.logback.classic.pattern.ClassicConverter;
import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.classic.spi.ThrowableProxy

import static io.xh.hoist.util.Utils.exceptionRenderer
import static io.xh.hoist.util.Utils.getIdentityService

class MachineReadableConverter extends ClassicConverter {

      @Override
      public String convert(ILoggingEvent event) {
          def msg = event.message
          
          if (!msg.startsWith('USE_XH_LOG_SUPPORT')) {
              return event.formattedMessage
          }

          def args = event.argumentArray.flatten()

          String tStack = ''
          if (msg == 'USE_XH_LOG_SUPPORT_WITH_STACKTRACE') {
              Throwable t = getThrowable(args)
              if (t) {
                  args.removeLast()
                  tStack = '\n' + new ThrowableProxy(t)
                          .stackTraceElementProxyArray
                          .collect {it.getSTEAsString()}
                          .join('\n')
              }
          }

          List<String> processed = args.collect { delimitedTxt(flatten(it)) }.flatten()

          def username = null
          try{username = identityService.username} catch(ignored) {}
          if (username) processed << "user=$username"

          def (messages, rest) = processed.flatten().split {it.startsWith('message=')}
          def (exception, ret) = rest.flatten().split {it.startsWith('exception=')}
          messages = messages.collect {it.replace('message=', '')}.join(' | ')
          messages = messages ? "message=${quoteSentence(messages)}" : ''
          ret << messages
          ret << exception

          return ret.findAll().join(', ') + tStack
      }

    //---------------------------------------------------------------------------
    // Implementation
    //---------------------------------------------------------------------------
    private List<String> delimitedTxt(List msgs) {
        return msgs.collect {
            it instanceof Throwable ? addExceptionKey(safeErrorSummary(it)) :
                    it instanceof Map ? kvTxt(it) :
                            addMsgKey(it.toString())
        }.flatten()
    }

    private List<String> kvTxt(Map msgs) {
         return msgs.collect {k,v ->
            v = v instanceof Throwable ? safeErrorSummary(v) :
                    quoteSentence(v.toString())
            return "$k=$v"
        }
    }

    private safeErrorSummary(Throwable t) {
        def ret = t.message
        try{ret = exceptionRenderer.summaryTextForThrowable(t)} catch(ignored) {}
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

    private Throwable getThrowable(List msgs) {
        def last = msgs.last()
        return last instanceof Throwable ? last : null
    }

    private List flatten(Object[] msgs) {
        Arrays.asList(msgs).flatten()
    }
}