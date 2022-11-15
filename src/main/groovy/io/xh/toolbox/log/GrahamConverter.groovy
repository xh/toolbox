package io.xh.toolbox.log

import ch.qos.logback.classic.pattern.ClassicConverter;
import ch.qos.logback.classic.spi.ILoggingEvent;

class GrahamConverter extends ClassicConverter {

          @Override
          public String convert(ILoggingEvent event) {
                  return event.message.replaceAll(/ \| /, ', ')
              }
      }