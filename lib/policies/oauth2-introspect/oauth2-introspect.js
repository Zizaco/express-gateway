const tokenIntrospectionGenerator = require('./token-introspector');
const BearerStrategy = require('passport-http-bearer');
const passport = require('passport');
const uuid = require('uuid/v4');
const logger = require('../../logger').policy;
const { getSafeSensitiveValue } = require('../../logger');

module.exports = function (actionParams) {
  actionParams.session = false;
  const scannedTokens = [];
  const tokenIntrospection = tokenIntrospectionGenerator(actionParams);
  const strategyName = `bearer-introspect-${uuid()}`;

  passport.use(strategyName, new BearerStrategy({ passReqToCallback: true }, (req, accessToken, done) => {
    const requestedScopes = req.egContext.apiEndpoint.scopes;

    const scopeCheck = (tokenData, done) => {
      const avaiableScopes = tokenData && tokenData.scopes ? tokenData.scopes.split(' ') : [];

      if (tokenData && requestedScopes.every(scope => avaiableScopes.includes(scope))) {
        logger.debug('token-introspector - token verified : ' + JSON.stringify(tokenData), { req });
        return done(null, tokenData);
      }

      return done(null, false);
    };

    if (scannedTokens[accessToken] && ((Date.now() - scannedTokens[accessToken].lastCheck) / 1000) < actionParams.ttl) {
      logger.debug('token-introspector - token found in cache : ' + getSafeSensitiveValue(accessToken), { req });
      return scopeCheck(scannedTokens[accessToken].tokenData, done);
    }

    tokenIntrospection(accessToken, 'access_token', req)
      .then(tokenData => {
        logger.debug('token-introspector - new scanned token : ' + getSafeSensitiveValue(accessToken) + ' with : ' + JSON.stringify(tokenData), { req });
        scannedTokens[accessToken] = { lastCheck: Date.now(), tokenData };

        return scopeCheck(tokenData, done);
      })
      .catch(() => { done(null, false); });
  }));

  return (req, res, next) => {
    passport.authenticate(strategyName, actionParams, actionParams.getCommonAuthCallback(req, res, next))(req, res, next);
  };
};
