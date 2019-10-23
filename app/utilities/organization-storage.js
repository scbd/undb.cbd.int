define(['app', 'lodash','./km-storage'], function(app, _) {
    app.factory("OrganizationStorage", ["IStorage",  function(storage) {

        this.get = function(identifier, params, config, allowDrafts) {
            config = _.assign({ headers: { realm:undefined } }, config | {})

            return storage.get(identifier, params, config)
                    .error(function(error, code){
                        if (code == 404 && allowDrafts == "true")
                            return getDraft(identifier, params, config)

                        return { error:error, code:code }
                    })
        }

        this.drafts = { get:getDraft };

        function getDraft(identifier, params, config){
            if(!config || !config.headers || !config.headers.realm)
                return storage.drafts.getRealm(identifier, params, config)
                    .then(function(resp){
                        config = _.assign(config, { headers: { realm:resp.realm } } )
                        return storage.drafts.get(identifier, params, config)
                    })
            return storage.drafts.get(identifier, params, config)
        }

        return this;
    }]);
});
