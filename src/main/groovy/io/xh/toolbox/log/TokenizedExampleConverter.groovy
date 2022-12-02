package io.xh.toolbox.log

import ch.qos.logback.classic.pattern.ClassicConverter;
import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.classic.spi.ThrowableProxy

import static io.xh.hoist.util.Utils.exceptionRenderer

/**
 * Logback Layout Converter to output log messages in a tokenized key/value pair format,
 * which may be easier for log reading tools to parse than Hoist's DefaultConverter layout.
 *
 * Developers wishing to output log entries with a different layout can create their own converter and
 * override the layout strings in Hoist-Core's @class LogbackConfig with their own layout strings in
 * their application's /grails-app/conf/logback.groovy file.
 */

class TokenizedExampleConverter extends ClassicConverter {

      static String MSG_KEY = 'msg'

      @Override
      public String convert(ILoggingEvent event) {
          def msg = event.message
          
          if (!msg?.startsWith('USE_XH_LOG_SUPPORT')) {
              return event.formattedMessage
          }

          def args = event.argumentArray.flatten()

          String tStack = ''
          if (msg == 'USE_XH_LOG_SUPPORT_WITH_STACKTRACE') {
              Throwable t = getThrowable(args)
              if (t) {
                  args.removeLast()
                  String indent = '           '
                  tStack = '\n' + indent + new ThrowableProxy(t)
                          .stackTraceElementProxyArray
                          .collect {it.getSTEAsString()}
                          .join('\n' + indent)
              }
          }

          List<String> processed = args.collect { delimitedTxt(it) }.flatten()

          def (messages, rest) = processed.split {it.startsWith(MSG_KEY + '=')}
          def (exception, ret) = rest.split {it.startsWith('exception=')}
          messages = messages.collect {it.replace(MSG_KEY + '=', '')}.join(' | ')
          messages = messages ? "$MSG_KEY=${quoteSentence(messages)}" : ''
          ret.add(0, messages)
          ret << exception

          return ret
                  .flatten() // flatten needed here because exception is a list
                  .findAll()
                  .join(', ') + tStack
      }

    //---------------------------------------------------------------------------
    // Implementation
    //---------------------------------------------------------------------------
    private List<String> delimitedTxt(Object obj) {
        if (!obj) return []
        if (obj instanceof Throwable) return [addExceptionKey(safeErrorSummary(obj))]
        if (obj instanceof Map) return kvTxt(obj)
        return [addMsgKey(obj.toString())]
    }

    private List<String> kvTxt(Map msgs) {
         return msgs.collect {k,v ->
            v = v instanceof Throwable ? safeErrorSummary(v) : quoteSentence(v.toString())
            k = k.replaceAll(/^_/, '')
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
            str = "$MSG_KEY=$str"
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
}