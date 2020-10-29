const superagent = require('superagent');
const logger = require('../../logger').policy;

module.exports = (options) => {
  return (token, tokenTypeHint) => {
    const data = { token };

    if (tokenTypeHint) {
      data.token_type_hint = tokenTypeHint;
    }

    logger.debug('token-introspector - options.endpoint :' + options.endpoint);
    logger.debug('token-introspector - options :' + JSON.stringify(Object.fromEntries(Object.entries(options).filter( e => e[0].toLowerCase() !== "authorization_value" ))));
    logger.debug('token-introspector - data :' + JSON.stringify(Object.fromEntries(Object.entries(data).filter( e => e[0].toLowerCase() !== "token" ))));

    return superagent
      .post(options.endpoint)
      .set('authorization', options.authorization_value)
      .type('form')
      .send(data)
      .then(res => {
        logger.debug("token-introspector - token: " + token ? token.substring(0,5) : "(empty)")
        logger.debug("token-introspector - res: " + JSON.stringify(res.body))
        if (res.body.active === true) {
          return res.body;
        }

        throw new Error('Token not active');
      })
      .catch(err => {
        logger.debug("token-introspector - err.response: " + err.response)
        logger.debug("token-introspector - err.message: " + err.message)
        logger.debug("token-introspector - err: " + err)
      })
  };
};
