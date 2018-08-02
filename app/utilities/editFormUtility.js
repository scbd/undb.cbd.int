define(['app','linqjs', 'utilities/realm','utilities/workflows','utilities/km-storage'], function(app,Enumerable) {
  'use strict';
  app.factory('guid', function() {
  	function S4() {
  		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  	}
  	return function() {
  		return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4()).toUpperCase();
  	};
  });
  app.factory("htmlUtility", function() {
    return {
      encode: function(srcText) {
        return $('<div/>').text(srcText).html();
      }
    };
  });

  app.factory('Enumerable', [function() {

		return Enumerable;
	}]);

	app.factory('linqjs', [function() {
		return Enumerable;
	}]);
  app.factory('Thesaurus', ['linqjs', function(Enumerable) {
      return {
          buildTree: function(terms) {
              var oTerms = [];
              var oTermsMap = {};

              Enumerable.from(terms).forEach(function(value) {
                  var oTerm = {
                      identifier: value.identifier,
                      title: value.title,
                      description: value.description
                  }

                  oTerms.push(oTerm);
                  oTermsMap[oTerm.identifier] = oTerm;
              });

              for (var i = 0; i < oTerms.length; ++i) {
                  var oRefTerm = terms[i];
                  var oBroader = oTerms[i];

                  if (oRefTerm.narrowerTerms && oRefTerm.narrowerTerms.length > 0) {
                      angular.forEach(oRefTerm.narrowerTerms, function(identifier) {
                          var oNarrower = oTermsMap[identifier];

                          if (oNarrower) {
                              oBroader.narrowerTerms = oBroader.narrowerTerms || [];
                              oNarrower.broaderTerms = oNarrower.broaderTerms || [];

                              oBroader.narrowerTerms.push(oNarrower);
                              oNarrower.broaderTerms.push(oBroader);
                          }
                      });
                  }
              }

              return Enumerable.from(oTerms).where("o=>!o.broaderTerms").toArray();
          }
      }
  }]);
  app.factory('underscore', [function() {
  return _;
}]);
  app.factory('editFormUtility', ["IStorage", "workflows", "$q", "$route", "realm", function(storage, workflows, $q, $route, realm) {


    var schemasWorkflowTypes = {

      "organization"              : { name: "publishReferenceRecord", version: undefined },
      "undbActor"                 : { name: "publishReferenceRecord", version: undefined },
      "event"                     : { name: "publishReferenceRecord", version: undefined },
      "undbBizBioPledge"          : { name: "publishReferenceRecord", version: undefined },
      "undbParty"                 : { name: "publishReferenceRecord", version:  undefined },

    };

    var _self = {
      //==================================
      //
      //==================================
      getRealm: function(identifier, config) {

        if(documentRealmCache[identifier])
          return $q.when(documentRealmCache[identifier]);

        return storage.drafts.getRealm(identifier)
        .then(function(success) {
            if(!success.data) return false;

            return documentRealmCache[identifier] = success.data;
        })
        .catch(function(error){
          if (error.status == 404 || error.status == 403){
            return storage.documents.getRealm(identifier)
            .then(function(success) {
                if(!success.data) return false;

                return documentRealmCache[identifier] = success.data;
            })
          }
        })
      },
      //==================================
      //
      //==================================
      load: function(identifier, expectedSchema) {

        return storage.drafts.get(identifier, {
          info: ""
        }).then(
          function(success) {
            return success;
          },
          function(error) {
            if (error.status == 404 || error.status == 403)
              return storage.documents.get(identifier, {
                info: ""
              });
            throw error;
          }).then(
          function(success) {
            var info = success.data;

            if (expectedSchema && info.type != expectedSchema)
              throw {
                data: {
                  error: "Invalid schema type"
                },
                status: "badSchema"
              };

            var hasDraft = !!info.workingDocumentCreatedOn || !!info.createdOn;
            var securityPromise = hasDraft ?
              storage.drafts.security.canUpdate(info.identifier, info.type) :
              storage.drafts.security.canCreate(info.identifier, info.type);

            return securityPromise.then(
              function(isAllowed) {
                if (!isAllowed)
                  throw {
                    data: {
                      error: "Not allowed"
                    },
                    status: "notAuthorized"
                  };

                  return info.body;
              });
          });
      },

      //==================================
      //
      //==================================
      draftExists: function(identifier) {

        return storage.drafts.get(identifier, {
          info: ""
        }).then(function() {
          return true;
        }, function(error) {
          if (error.status == 404)
            return false;
          throw error;
        });
      },

      //==================================
      //
      //==================================
      saveDraft: function(document) {

        var identifier = document.header.identifier;
        var metadata = {};

        if (document.government)
          metadata.government = document.government.identifier;

        return _self.draftExists(identifier).then(
          function(hasDraft) {

            var securityPromise = hasDraft ?
              storage.drafts.security.canUpdate(identifier, document.header.schema, metadata) :
              storage.drafts.security.canCreate(identifier, document.header.schema, metadata);

            return securityPromise.then(
              function(isAllowed) {
                if (!isAllowed)
                  throw {
                    error: "Not authorized to save draft"
                  };

                return storage.drafts.put(identifier, document);
              });
          });
      },

      //==================================
      //
      //==================================
      documentExists: function(identifier) {

        return storage.documents.get(identifier).then(function() {
          return true;
        }, function(error) {
          if (error.status == 404)
            return false;
          throw error;
        });
      },


      //==================================
      //
      //==================================
      canPublish: function(document) {

        var identifier = document.header.identifier;
        var schema = document.header.schema;
        var metadata = {};

        if (document.government)
          metadata.government = document.government.identifier;

        // Check if document exists

        return _self.documentExists(identifier).then(function(exists) {

          // Check user security on document

          var qCanWrite = exists ? storage.documents.security.canUpdate(identifier, schema, metadata) :
            storage.documents.security.canCreate(identifier, schema, metadata);

          return qCanWrite;

        });
      },

      //==================================
      //
      //==================================
      publish: function(document) {

        var identifier = document.header.identifier;
        var schema = document.header.schema;
        var metadata = {};

        if (document.government)
          metadata.government = document.government.identifier;

        // Check if document exists

        return _self.documentExists(identifier).then(function(exists) {

          // Check user security on document

          var qCanWrite = exists ? storage.documents.security.canUpdate(identifier, schema, metadata) :
            storage.documents.security.canCreate(identifier, schema, metadata);

          return qCanWrite;

        }).then(function(canWrite) {

          if (!canWrite)
            throw {
              error: "Not allowed"
            };

          //Save document
          var processRequest;
          if ($route.current.params.workflowId) {
            // if the user is editing a locked record, remove the lock, update draft,
            // lock the draft and then update the workflow status.
            var metadata = {};
            processRequest = storage.drafts.locks.get(document.header.identifier, {
                lockID: ''
              })
              .then(function(lockInfo) {
                return storage.drafts.locks.delete(document.header.identifier, lockInfo.data[0].lockID)
                  .then(function() {
                    return storage.drafts.put(document.header.identifier, document);
                  })
                  .then(function(draftInfo) {
                    return storage.drafts.locks.put(document.header.identifier, {
                      lockID: lockInfo.data[0].lockID
                    });
                  }).then(function(draftInfo) {
                    console.log(draftInfo);

                  });
              })
              .then(function(data) {
                return workflows.updateActivity($route.current.params.workflowId, 'publishRecord', {
                  action: 'approve'
                })
              });
          } else {
            processRequest = storage.drafts.put(identifier, document).then(function(draftInfo) {
              return createWorkflow(draftInfo); // return workflow info
            }); //editFormUtility.publish(document);
          }
          return $q.when(processRequest);
        });
      },

      //==================================
      //
      //==================================
      publishRequest: function(document) {

        var identifier = document.header.identifier;
        var schema = document.header.schema;
        var metadata = {};

        if (document.government)
          metadata.government = document.government.identifier;

        // Check if doc & draft exists

        return _self.draftExists(identifier).then(function(exists) {

          // Check user security on drafts

          var qCanWrite = exists ?
            storage.drafts.security.canUpdate(identifier, schema, metadata) :
            storage.drafts.security.canCreate(identifier, schema, metadata);

          return qCanWrite;

        }).then(function(canWrite) {

          if (!canWrite)
            throw {
              error: "Not allowed"
            };

          //Save draft
          return storage.drafts.put(identifier, document);

        }).then(function(draftInfo) {
          return createWorkflow(draftInfo); // return workflow info
        });
      }
    };

    function createWorkflow(draftInfo, additionalInfo) {
      var type = schemasWorkflowTypes[draftInfo.type];

      if (!type)
        throw "No workflow type defined for this record type: " + draftInfo.type;

      var workflowData = {
        "realm":        draftInfo.Realm || realm,
        "documentID":   draftInfo.documentID,
        "identifier":   draftInfo.identifier,
        "title":        draftInfo.workingDocumentTitle,
        "abstract":     draftInfo.workingDocumentSummary,
        "metadata":     draftInfo.workingDocumentMetadata,
        "additionalInfo": additionalInfo
      };

      return workflows.create(type.name, type.version, workflowData); // return workflow info
    }


    return _self;

  }]);

});
