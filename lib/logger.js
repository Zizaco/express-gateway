const { createLogger, format, transports } = require('winston');
const { combine, json, splat, timestamp } = format;

const { ENV } = process.env;

const formatLogFields = label => {
  return format(info => {
    const { message, req, ...rest } = info;

    let traceLink = {};
    if (req) {
      const spanContext = req._datadog && req._datadog.span && req._datadog.span.context();
      if (spanContext) {
        traceLink = {
          trace_id: spanContext.toTraceId(),
          span_id: spanContext.toSpanId()
        };
      }
    }

    return {
      project_tangram: 'mdm',
      env: ENV || 'na',
      bu_code: 'hmbu',
      message: `${label}: ${message}`,
      ...traceLink,
      ...rest
    };
  });
};

const logFormat = (loggerLabel) => combine(
  timestamp(),
  splat(),
  formatLogFields(loggerLabel)(),
  json()
);

const createLoggerWithLabel = (label) => createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [new transports.Console({})],
  format: logFormat(label)
});

const getSafeSensitiveValue = str => {
  const lengthToMask = str.length / 2;
  const [toKeep] = str.split(lengthToMask - 1);
  return toKeep + '*'.repeat(lengthToMask);
};

module.exports = {
  gateway: createLoggerWithLabel('[EG:gateway]'),
  policy: createLoggerWithLabel('[EG:policy]'),
  config: createLoggerWithLabel('[EG:config]'),
  db: createLoggerWithLabel('[EG:db]'),
  admin: createLoggerWithLabel('[EG:admin]'),
  plugins: createLoggerWithLabel('[EG:plugins]'),
  createLoggerWithLabel,
  getSafeSensitiveValue
};
