const superagent = require('superagent');
const { getSafeSensitiveValue } = require('../../logger');
const logger = require('../../logger').policy;

module.exports = (options) => {
  return (token, tokenTypeHint, req) => {
    const data = { token };

    if (tokenTypeHint) {
      data.token_type_hint = tokenTypeHint;
    }

    logger.debug('token-introspector - options.endpoint :' + options.endpoint, { req });
    logger.debug('token-introspector - authorization value used :' + getSafeSensitiveValue(options.authorization_value), { req });
    logger.debug('token-introspector - trying to introspect the following token :' + getSafeSensitiveValue(data.token), { req });
    logger.debug('token-introspector - options :' + JSON.stringify(Object.fromEntries(Object.entries(options).filter(e => e[0].toLowerCase() !== 'authorization_value'))), { req });
    logger.debug('token-introspector - data :' + JSON.stringify(Object.fromEntries(Object.entries(data).filter(e => e[0].toLowerCase() !== 'token'))), { req });

    return superagent
      .post(options.endpoint)
      .set('authorization', options.authorization_value)
      .type('form')
      .send(data)
      .then(res => {
        logger.debug('token-introspector - token: ' + token ? token.substring(0, 5) : '(empty)', { req });
        logger.debug('token-introspector - res: ' + JSON.stringify(res.body), { req });
        if (res.body.active === true) {
          return res.body;
        }

        throw new Error('Token not active');
      })
      .catch(err => {
        logger.debug('token-introspector - err.response: ' + err.response, { req });
        logger.debug('token-introspector - err.message: ' + err.message, { req });
        logger.debug('token-introspector - err: ' + err, { req });
      });
  };
};
