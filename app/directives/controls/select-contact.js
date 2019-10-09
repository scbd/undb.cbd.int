define(['text!./select-contact.html','app','lodash','ngDialog',
// 'directives/bbi/forms/edit-bbi-contact',
// 'directives/bbi/forms/edit-organization',
'providers/locale',
'filters/term',
'ngInfiniteScroll'
],
function(template,app,_) {

    app.directive("selectContact", ['realm',function(realm) {

        return {
            restrict: "E",
            template: template,
            replace: true,
            transclude: false,
            scope: {
                model: "=ngModel",
                locales: "=locales",
                caption: "@caption",
                subFilter : "=?",
                schema      : '@'
            },
            link: function($scope, $element, $attrs) {

                  $scope.schemaMap=function(){
                    if($scope.schema==='bbiContact') return 'Contact Person';
                    if($scope.schema==='organization') return 'Organization';
                  }
                //==================================
                //
                //==================================
                $scope.killWatch = $scope.$watch('model', function() {

                  if($scope.model && ($scope.model.identifier || $scope.model.identifier_s || Array.isArray($scope.model))){

                    $scope.killWatch();
                    $scope.loadModel();
                  }else
                    $scope.loadingDocuments=false;
                });

                $scope.multiple = $attrs.multiple !== undefined;
                $scope.getLogo = function(doc) {

          				  if(!doc || !doc.relavantDocuments) return false;
          					return _.find(doc.relavantDocuments,{name:'logo'});
          			};
                //====================
                //
                //====================
                $scope.getAichiNumber= function(term) {

                  if(!term ) return;

                     return term.slice(-2);
                };
            },
            controller: ["$scope", "$http", "$filter", "underscore",   "$q",  'ngDialog','locale','$timeout',
                function($scope, $http, $filter, _,  $q,   ngDialog,locale,$timeout) {

                    $scope.locale=locale;
                    var workingContacts = null;
                    var currentPage = -1;
                    var queryCanceler;
                    $scope.recordCount = 0;
                    $scope.loadingDocuments = false;
                    $scope.search = {};
                    $scope.options  = {
        				countries         : function() { return $http.get("/api/v2013/thesaurus/domains/countries/terms",            { cache: true }).then(function(o){ return $filter("orderBy")(o.data, "name"); }); },
        				organizationTypes : function() {
        					return $q.all([$http.get("/api/v2013/thesaurus/domains/Organization%20Types/terms", { cache: true }),
        							           $http.get("/api/v2013/thesaurus/terms/5B6177DD-5E5E-434E-8CB7-D63D67D5EBED",   { cache: true })])
        					.then(function(o){
        						var orgs = o[0].data;
        						orgs.push(o[1].data);
        						return orgs;
        					});
        				}
        			};


                    //============================================================
                    //
                    //
                    //============================================================
                    $scope.showContacts = function() {
                        $scope.loadExisting();
                        $scope.showExisting=true;
                        $scope.errorMessage = undefined;
                        $scope.search.keyword='';
                        ngDialog.open({
                            template: 'organizationModal',
                            closeByDocument: false,
                            scope: $scope,
                            // width: '60%'
                        });
                    }

                    //============================================================
                    //
                    //
                    //============================================================
                    $scope.deleteContact = function(index) {

                        var contacts = $scope.selectedContacts;

                        if (index < 0 || index >= contacts.length)
                            return;

                        if (confirm("Are you you want to remove this contact from the list?")) {
                            $timeout(function(){
                              var tempArr=[];
                              if ($scope.multiple){
                                  contacts.splice(index, 1);

                                  for(var i=0;i<contacts.length;i++)
                                    tempArr.push({'identifier':contacts[i].header.identifier});
                                  $scope.model = tempArr;
                              }
                              else{
                                  $scope.selectedContacts=[];
                                  $scope.model = undefined;
                              }
                              $scope.loadingDocuments = false;
                            });
                        }
                    };

                    //============================================================
                    //
                    //
                    //============================================================
                    $scope.closeContact = function() {

                        closeDialog();
                        workingContacts = undefined;
                        //clear the dropdown list display text which remains after the dialog is closed.
                        $scope.$broadcast('clearSelectSelection');
                    };


                    //============================================================
                    //
                    //
                    //============================================================
                    $scope.loadExisting = function() {

                        if($scope.loadingDocuments || $scope.existingContacts && $scope.recordCount == $scope.existingContacts.length)
                            return;

                        $scope.loadingDocuments = true;
                        currentPage += 1;
                        $scope.searchOrganizations();
                    };

  //============================================================
  //
  //
  //============================================================
  $scope.$watch('search.keyword', function(newVal) {
      if(newVal !=undefined){
          $scope.searchOrganizations(true);
      }
  })

                    //============================================================
                    //
                    //
                    //============================================================
                    $scope.searchOrganizations = function(clear) {

                        if (queryCanceler) {
                            // console.log('trying to abort pending request...');
                            queryCanceler.resolve(true);
                        }
                        var fields = 'schema_s,thematicArea_ss,logo_s,identifier_s,aichiTarget_ss,relevantDocuments_ss, _state_s,revision:_revision_i, name:title_s, acronym:acronym_s, organizationType_s,' +
                                         'address_EN_t, city_EN_t, state_EN_t, postalCode_EN_t, country_s, phones:phones_ss, faxes:faxes_ss, emails:emails_ss, websites:websites_ss' +
                                         ',designation:designation_t,organization:organization_t,organizationAcronym:organizationAcronym_t,department:department_t'

                        var q = '';//'realm_ss:'+realm+' AND '; //'realm_ss:' + 'chm-dev' +
                        if($scope.search.keyword){
                            var qFields = ['text_EN_txt', 'title_s', 'acronym_s', 'organizationType_EN_s', 'address_s', 'state_s', 'postalCode_s', 'country_EN_s', 'emails_ss']
                            q += '(' + qFields.join(':"*' + $scope.search.keyword + '*" OR ') + ':" *'
                                     + $scope.search.keyword + '*") AND ';
                            if(clear){
                                currentPage = -1;
                                $scope.recordCount = 0;
                                $scope.loadingDocuments = false;
                            }
                        }
                        if(currentPage===-1)
                            currentPage=0;

                        var queryListParameters = {
                            'q'     : q + 'schema_s:' + $scope.schema,
                            'sort'  : 'updatedDate_dt desc',
                          //  'fl'    : fields,
                            'wt'    : 'json',
                            'start' : currentPage * 25,
                            'rows'  : 25,
                        };

                        queryCanceler = $q.defer();
                        $q.when($http.get('/api/v2013/index/select', {  params: queryListParameters, timeout: queryCanceler}))
                          .then(function (data) {
                            queryCanceler = null;
                            if(!$scope.existingContacts || currentPage === 0){
                                var docs = data.data.response.docs;
                                    _.each(docs, function(record){
                                      formatOrganization(record);
                                    });
                                $scope.existingContacts = docs;
                                $scope.recordCount = data.data.response.numFound;

                            }
                            else {
                                _.each(data.data.response.docs, function(record){
                                    $scope.existingContacts.push(formatOrganization(record));
                                });
                            }
                        }).catch(function(error) {
                            console.log('ERROR: ' + error);
                        })
                        .finally(function(){
                            $scope.loadingDocuments = false;
                        });
                    }

                    //============================================================
                    //
                    //
                    //============================================================
                    $scope.selectContact = function(contact) {
                        $scope.killWatch();
                        if(!$scope.selectedContacts)$scope.selectedContacts=[];

                        if ($scope.multiple) {
                          loadSelectedContact(contact.identifier_s ||contact.identifier,$scope.selectedContacts).then(function(){
                            if(!Array.isArray($scope.model))$scope.model=[];
                            $scope.model.push({
                                identifier: contact.identifier_s || contact.identifier //+ '@' + (contact.revision||'1')
                            });
                          });


                        } else {

                          $scope.selectedContacts=[];

                          loadSelectedContact(contact.identifier_s ||contact.identifier,$scope.selectedContacts).then(function(res){

                              $scope.model = {identifier:contact.identifier_s||contact.identifier, version:res.data.header.version};//+ '@' + (contact.revision||'1')};
                          });
                        }
                        closeDialog();
                        $scope.loadingDocuments = true;
                        workingContacts = undefined;
                        //clear the dropdown list display text which remains after the dialog is closed.
                        $scope.$broadcast('clearSelectSelection');
                    }

                    //============================================================
                    //
                    //
                    //============================================================
                    function loadSelectedContact(identifier) {
                          $scope.loadingDocuments=true;
                         
                              var header = {headers: {realm:undefined}}
                            return $http.get('/api/v2013/documents/'+identifier, header)
                            .success(loadDocument)
                            .catch(function(){
                                return callDraft(identifier,header)
                            });
                     


                    }// loadSelectedContact

                    function loadDocument(doc){
                        $scope.selectedContacts.push(doc);
                        $scope.loadingDocuments=false;
                        if(doc.organization && doc.organization.identifier)
                            return loadOrgData(doc.organization.identifier,doc);
                    }

                    function callDraft(identifier, headers){
                        return $http.get('/api/v2013/documents/'+identifier+'/versions/draft', headers)
                                    .success(loadDraft)
                    }

                    function loadDraft(doc){

                        doc.header.version='draft';
                        $scope.selectedContacts.push(doc);
                        $scope.loadingDocuments=false;
                        if(doc.organization && doc.organization.identifier)
                            return loadOrgData(doc.organization.identifier,doc);
                        else
                            return 'draft';
                    }

                    //============================================================
                    //
                    //
                    //============================================================
                    function loadOrgData(identifier,doc) {
                          $scope.loadingDocuments=true;
                          $http.get('/api/v2013/documents/'+identifier, {
                          }).success(function(responceDoc) {
                               delete(responceDoc.header);
                               Object.assign(doc,responceDoc);
                               $scope.loadingDocuments=false;
                          }).catch(function(){
                              $http.get('/api/v2013/documents/'+identifier+'/versions/draft', {
                              }).success(function(responceDoc) {
                               delete(responceDoc.header);
                               Object.assign(doc,responceDoc);
                               $scope.loadingDocuments=false;
                              }).catch(function(err){throw err;});
                          });

                    }// loadOrgData

                    //============================================================
                    //
                    //
                    //============================================================
                    function loadSelectedContacts() {
                        $scope.loadingDocuments=true;
                        if(!$scope.selectedContacts) $scope.selectedContacts=[];
                        if(Array.isArray($scope.model))
                            for(var i=0;i<$scope.model.length;i++)
                              loadSelectedContact($scope.model[i].identifier,$scope.selectedContacts);

                        else
                            loadSelectedContact($scope.model.identifier,$scope.selectedContacts);

                    }// loadSelectedContacts
                    $scope.loadModel = loadSelectedContacts;

                    //============================================================
                    //
                    //
                    //============================================================
                    $scope.isSelected = function(contact) {

                        if (!$scope.selectedContacts || $scope.selectedContacts.length === 0) return true;

                        for(var i=0; i<$scope.selectedContacts.length ;i++)
                          if($scope.selectedContacts[i].header.identifier===contact.header.identifier)
                            return false;

                        return true;
                    }


              //============================================================
              //
              //
              //============================================================
                    function closeDialog() {
                        ngDialog.close();
                        $scope.errorMessage = undefined;
                        currentPage = -1;
                        queryCanceler = null;
                        $scope.recordCount = 0;
                        $scope.loadingDocuments = false;
                        $scope.search = {};
                    };

                    //============================================================
                    //
                    //
                    //============================================================
                    function formatOrganization(organization){

                        organization.header = {
                            identifier :  organization.identifier_s
                        }
                        if(organization.organizationType_s)
                            organization.organizationType = {
                                identifier :  organization.organizationType_s
                            }
                        if(organization.country_s)
                            organization.country = {
                                identifier :  organization.country_s
                            }

                        if(organization.address_EN_t)
                            organization.address = { en : organization.address_EN_t }
                        if(organization.city_EN_t)
                             organization.city = { en : organization.city_EN_t }
                        if(organization.state_EN_t)
                             organization.state = { en : organization.state_EN_t }
                        if(organization.postalCode_EN_t)
                             organization.postalCode = { en : organization.postalCode_EN_t }

                        return organization;
                    }
                }
            ]
        };
    }]);

});
