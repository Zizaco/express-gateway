module.exports = {
  policy: require('./key-auth'),
  schema: {
    $id: 'http://express-gateway.io/schemas/policies/key-auth.json',
    allOf: [
      { $ref: 'http://express-gateway.io/schemas/base/auth.json' },
      {
        type: 'object',
        properties: {
          apiKeyHeader: {
            type: 'string',
            default: 'Authorization',
            description: 'HTTP Header to look for the apiScheme + apiKey string'
          },
          apiKeyHeaderScheme: {
            type: 'string',
            default: 'apiKey',
            description: 'HTTP Authorization Scheme to verify before extracting the API Key'
          },
          apiKeyField: {
            type: 'string',
            default: 'apiKey',
            description: 'Query String parameter name to look for to extract the apiKey'
          },
          disableHeaders: {
            type: 'boolean',
            default: false,
            description: 'Entirely disable lookup API Key from the header'
          },
          disableHeadersScheme: {
            type: 'boolean',
            default: false,
            description: 'Enable or disable apiScheme check'
          },
          disableQueryParam: {
            type: 'boolean',
            default: false,
            description: 'Entirely disable lookup API Key from the query string'
          },
          ttl: {
            title: 'TTL',
            type: 'integer',
            default: 0,
            description: 'Time, in seconds, in which the current token, if validated before, will be consider as valid without making a new request to the database'
          }
        }
      }
    ]
  }
};
