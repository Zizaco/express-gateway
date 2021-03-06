const passport = require('passport');
const LocalAPIKeyStrategy = require('./passport-apikey-strategy');
const services = require('../../services/index');
const logger = require('../../logger').policy;
const authService = services.auth;
const credentialType = 'key-auth';
const scannedTokens = [];
passport.use(new LocalAPIKeyStrategy({ passReqToCallback: true }, (req, apikey, ttl, autoRefreshCache, done) => {
  // key will look like "h1243h1kl23h4kjh:asfasqwerqw"
  if (!apikey) {
    return done(null, false);
  }

  const keyParts = apikey.split(':');
  const endpointScopes = req.egContext.apiEndpoint.scopes && req.egContext.apiEndpoint.scopes.map(s => s.scope || s);
  const cacheKey = apikey + JSON.stringify(endpointScopes);

  if (scannedTokens[cacheKey] && ((Date.now() - scannedTokens[cacheKey].lastCheck) / 1000) < ttl) {
    const consumer = scannedTokens[cacheKey].consumer;
    consumer.authorizedScopes = endpointScopes;
    return done(null, consumer);
  }

  authService.authenticateCredential(keyParts[0], keyParts[1], credentialType)
    .then(consumer => {
      if (!consumer) {
        return done(null, false);
      }

      if (autoRefreshCache && ttl >= 5) { // schedule credential cache refresh
        const backgrounRefresh = () => {
          setTimeout(() => {
            authService.authorizeCredential(keyParts[0], credentialType, endpointScopes)
              .then(authorized => {
                if (authorized) {
                  consumer.authorizedScopes = endpointScopes;
                  scannedTokens[cacheKey] = { consumer, lastCheck: Date.now() };
                  backgrounRefresh(); // schedule next refresh
                }
              });
          }, ttl * 1000 - 3000); // 3 seconds before expiration
        };

        backgrounRefresh();
      }

      return authService.authorizeCredential(keyParts[0], credentialType, endpointScopes)
        .then(authorized => {
          if (!authorized) {
            return done(null, false, { unauthorized: true });
          }
          consumer.authorizedScopes = endpointScopes;
          scannedTokens[cacheKey] = { consumer, lastCheck: Date.now() };
          return done(null, consumer);
        });
    })
    .catch(err => {
      logger.warn(err);
      done(err);
    });
}));

module.exports = function (params) {
  return function (req, res, next) {
    params.session = false;
    passport.authenticate('localapikey', params, params.getCommonAuthCallback(req, res, next))(req, res, next);
  };
};
