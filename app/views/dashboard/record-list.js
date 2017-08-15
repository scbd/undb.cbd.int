define(['lodash',
    'text!./del-dial.html',
    'app',
    'ngDialog',
    'authentication',
    'utilities/km-storage',
    'filters/moment',
    'filters/lstring',
    'filters/trunc',
    'utilities/realm',
    'filters/htmlToPlaintext',
], function(_, delDial, links) {
    'use strict';
    return ['$scope', '$route', '$http', '$location', '$q', 'user', 'IStorage', 'ngDialog', 'realm','$timeout','$interval',
        function($scope, $route, $http, $location, $q, user, storage, ngDialog, realm,$timeout,$interval) {

            $scope.pageSize = 15;
			      $scope.isAdmin = !!_.intersection(user.roles, ["Administrator"]).length;
            $scope.loading={data:true,facets:true};
            $scope.links = links.links;
            $scope.schema = _.camelCase($route.current.params.schema);
            $scope.facets = undefined;
            $scope.records = null;
            $scope.status = "";
            $scope.currentPage = 0;
            $scope.pages = [];
            $scope.onPage = loadPage;
            $scope.onText = _.debounce(function() {
                loadPage(0, true);
            }, 500);
            $scope.onDelete = del;
            $scope.onEdit = edit;
            $scope.onReloadList = reloadList;
            $scope.onWorkflow = viewWorkflow;
            $scope.qs = $location.search();
            $scope.delLoader={};
            $scope.schemaMap = function(schema) {
                var map = {
                    'undbActor'   : 'Actors' ,
                    'organization'  : 'Organizations',
                    'event'    : 'Actions',
                    'undbParty'   : 'Parties' ,
                };
                return map[schema];
            };
            getDrafts();
            getWorkflows();
            $scope.$root.page={};
            $scope.$root.page.title = $scope.schemaMap($scope.schema)+" List: UNDB Records";
            $scope.onAdd = function() {
                edit({
                    schema_s: $route.current.params.schema
                });
            };


            $scope.formatWID = function(workflowID) {
                return workflowID ? workflowID.replace(/(?:.*)(.{3})(.{4})$/g, "W$1-$2").toUpperCase() : "";
            };

           locationView();


            $scope.$on("RefreshList", function() {
                reloadList();
            });

            function reloadList() {
                refreshPager();
                loadPage(0);
                refreshFacetCounts();
            }
            //======================================================
            //
            //
            //======================================================
            function locationView() {
              if($location.search()['index-view']){
                $scope.status = $location.search()['index-view'];
                loadPage(0).then(indexUpdate);
              }else
                reloadList();
            }
            //======================================================
            //
            //
            //======================================================
            function indexUpdate() {
              var identifier = $location.search()['index-update'];

              if(identifier){
                $scope.updatedRecord=identifier;
                var intervallObj = $interval(function() {

                  if (_.find($scope.records,{identifier_s:identifier})){

                     $interval.cancel(intervallObj);
                     delete($scope.updatedRecord);
                  }else   loadPage(0);
                }, 5000,30);
                $timeout(function(){if(!_.find($scope.records,{identifier_s:identifier})){$scope.updatedRecordError=true;$interval.cancel(intervallObj);throw 'Index not updadted with: '+identifier;}},150000);

              }
            }
            //======================================================
            //
            //
            //======================================================
            function loadPage(pageIndex, refreshFacets) {

                pageIndex = pageIndex || 0;
                  var qDrafts,qWorkflows;

                  qDrafts=getDrafts();
                  qWorkflows=getWorkflows();

                if (pageIndex < 0)
                    return;

                if (pageIndex > 0 && pageIndex >= $scope.pages.length)
                    return;

                delete $scope.error;

                $scope.loading.data = true;

                // Execute query

                var qsParams = {
                    "q": buildQuery(),
                    "fl": "id,identifier_s, country_EN_s,city_t,schema_*, title_*, summary_*, description_*, created*, updated*, reportType_*_t, url_ss, _revision_i, _state_s, _latest_s, _workflow_s",
                    "sort": "updatedDate_dt desc",
                    "start": pageIndex * Number($scope.pageSize),
                    "rows": Number($scope.pageSize),
                };

                var qRecords = $http.get('/api/v2013/index', {
                    params: qsParams
                }).then(function(res) {

                    if ($route.current.params.auto && !res.data.response.numFound) {
                        $location.replace();
                        $location.url('actions/submit-form');
                        return;
                    }

                    if ($route.current.params.auto) {
                        $location.replace();
                        $location.search('auto', undefined);
                    }

                    $scope.recordCount = res.data.response.numFound;
                    $scope.records = _.map(res.data.response.docs, function(v) {
                        return _.defaults(v, {
                            schemaName: lstring(v, "schema_*_t", "schema_EN_t", "schema_s"),
                            title: lstring(v, "title_*_t", "title_EN_t", "title_t"),
                            summary: lstring(v, "summary_*_t", "description_*_t", "summary_EN_t", "description_EN_t", "summary_t", "description_t"),
                            reportTypeName: lstring(v, "reportType_*_t", "reportType_EN_t"),
                            url: toLocalUrl(v.url_ss),
                        });
                    });
                    _.each($scope.records,function(document){


                          //cleaning on dstaging index
                          _.each(document, function(val, property) {
                              if ((property.slice(-2) === '_t' || property.slice(-2) === '_s' || property==='title' ) && Array.isArray(val))
                                  document[property] = val[0];
                              if(_.isObject(val))
                                _.each(val, function(v, p) {
                                      if(Array.isArray(v))
                                      val[p]=v[0];
                                });
                          });
                    });
// for(var i=0;i<$scope.records.length;i++)
// $http.get('/solr/scbd/update?stream.body=%3Cdelete%3E%3Cid%3E'+$scope.records[i].id+'%3C/id%3E%3C/delete%3E&commit=true', {})


                    refreshPager(pageIndex);

                });

                var qFacets;

                if (!$scope.facets || refreshFacets) {
                    qFacets = refreshFacetCounts();
                }


                return $q.all([qRecords, qFacets,qDrafts,qWorkflows]).catch(function(res) {

                    $scope.records = [];
                    $scope.recordCount = -1;
                    $scope.error = res.data || res;

                    console.error($scope.error);

                }).finally(function() {

                    _.each($scope.drafts,function(document){
                          findDraft(document); // merg published and draft of same doc
                    });

                    _.each($scope.workflows,function(document){
                          removePublishedWorkflow(document); // merg published and draft of same doc
                    });

                  $scope.loading.data =false;

                });
            }

            //======================================================
            //
            //
            //======================================================
            function findDraft(doc) {
                  if(!doc)return;

                  _.each($scope.records,function(d){
                        if(!d)return;
                        if(d._state_s==='public' && d.identifier_s===doc.identifier_s )
                              d.publishedDraft=true;
                  });
                  _.each($scope.records,function(d){
                        if(!d || !d.publishedDraft) return;
                        _.each($scope.records,function(dd,indexx){
                               if(!dd || dd._state_s!=='draft') return;
                              if(dd.identifier_s===d.identifier_s ){
                                 $scope.records.splice(indexx, 1);
                              }
                        })
                  });
            }
            //======================================================
            //
            //
            //======================================================
            function removePublishedWorkflow(doc) {
                  if(!doc)return;

                  _.each($scope.records,function(d,index){
                        if(!d)return;
                        if(d._state_s==='public' && d.identifier_s===doc.identifier_s )
                              $scope.records.splice(index, 1);
                  });
            }
            //======================================================
            //
            //
            //======================================================
            function isLoading() {
              var returnValue = false;
                _.each($scope.loading,function(item){

                    if(item) returnValue = true;
                });
                return returnValue ;
            }
            $scope.isLoading=isLoading;
            //======================================================
            //
            //
            //======================================================
            function refreshFacetCounts() {

                var qFacets;

                $scope.loading.facets =true;
                // Execute facets query
                var qsFacetParams = {
                    "q": buildQuery({
                        status: undefined,
                        latest: undefined
                    }),
                    "row": 0,
                    "facet": true,
                    "facet.field": "_state_s",
                };

                qFacets = $http.get('/api/v2013/index', {
                    params: qsFacetParams
                }).then(function(res) {

                    var documentState = _(res.data.facet_counts.facet_fields._state_s).chunk(2).zipObject().value();

                    $scope.facets = _.defaults(documentState, {
                        public: 0,
                        draft: 0,
                        workflow: 0,
                        total: res.data.response.numFound
                    });
                });
                return $q.all(qFacets).catch(function(res) {

                    $scope.error = res.data || res;
                    console.error($scope.error);

                }).finally(function() {
                    $scope.loading.facets =false;
                });
            }
            //======================================================
            //
            //
            //======================================================
            function getDrafts() {

                var qFacets;

                $scope.loading.drafts =true;
                // Execute facets query
                var qsFacetParams = {
                    "q": buildQuery({
                        status: 'draft',
                    }),
                    "fl":"identifier_s,",
                    "row": 0,
                };

                qFacets = $http.get('/api/v2013/index', {
                    params: qsFacetParams
                }).then(function(res){
                    $scope.drafts=res.data.response.docs;
                });
                return $q.all(qFacets).catch(function(res) {

                    $scope.error = res.data || res;
                    console.error($scope.error);

                }).finally(function() {
                    $scope.loading.drafts =false;

                });
            }
            //======================================================
            //
            //
            //======================================================
            function getWorkflows() {

                var qFacets;

                $scope.loading.workflows =true;
                // Execute facets query
                var qsFacetParams = {
                    "q": buildQuery({
                        status: 'workflow',
                    }),
                    "fl":"identifier_s,",
                    "row": 0,
                };

                qFacets = $http.get('/api/v2013/index', {
                    params: qsFacetParams
                }).then(function(res){
                    $scope.workflows=res.data.response.docs;
                });
                return $q.all(qFacets).catch(function(res) {

                    $scope.error = res.data || res;
                    console.error($scope.error);

                }).finally(function() {
                    $scope.loading.workflows =false;

                });
            }
            //======================================================
            //
            //
            //======================================================
            function toLocalUrl(urls) {

                return urls;
            }

            //============================================================
            //
            //============================================================
            function delDialog() {

                var dialog = ngDialog.open({
                    template: delDial,
                    className: 'ngdialog-theme-default',
                    closeByDocument: false,
                    plain: true,
                    scope: $scope
                });
                $scope.ignoreDirtyCheck = true;
                return dialog.closePromise;
            }

            //======================================================
            //
            //
            //======================================================
            function buildQuery(options) {

                options = _.assign({
                    schema: $scope.schema,
                    status: $scope.status,
                    latest: true,
                    freetext: $scope.freetext
                }, options || {});

                var query = [];

                // Add Schema

                query.push("schema_s:" + escape(options.schema));
                query.push(["realm_ss:" + realm, "(*:* NOT realm_ss:*)"]);
        
                // Apply ownership/contributor

                query.push(_.union(["_contributor_is:" + user.userID],
                    _.map(user.userGroups, function(v) {
                        return "_ownership_s:" + escape(v);
                    })));

                // Status

                if (options.status) {
                    query.push("_state_s:" + escape(options.status));
                }
                // else if (options.latest !== undefined) {
                //     query.push("_latest_s:" + (options.latest ? "true" : "false"));
                // }

                // freetext

                if (options.freetext) {
                    var escapedWords = null;
                    options.freetext = options.freetext.trim();

                    //process quoted search
                    if ((options.freetext[0] === '"' && options.freetext[options.freetext.length - 1] === '"') || (options.freetext[0] === "'" && options.freetext[options.freetext.length - 1] === "'")) {
                        options.freetext = options.freetext.substr(1); //remove first quote
                        options.freetext = options.freetext.slice(0, -1); //remove lastquote

                        escapedWords = _(_.words(options.freetext)).map(function(w) {
                            return escape(w);
                        }).value();
                        query.push([
                            'title_t:("' + escapedWords.join(' ') + '")',
                            'description_t:("' + escapedWords.join(' ') + '")',
                            'text_EN_txt:("' + escapedWords.join(' ') + '")',
                            'title_EN_t:("' + escapedWords.join(' ') + '")',
                            'summary_EN_t:("' + escapedWords.join(' ') + '")',
                        ]);
                    } else {
                        escapedWords = _(_.words(options.freetext)).map(function(w) {
                            return escape(w) + '*';
                        }).value();
                        query.push([
                            'title_t:(' + escapedWords.join(' AND ') + ')',
                            'description_t:(' + escapedWords.join(' AND ') + ')',
                            'text_EN_txt:(' + escapedWords.join(' AND ') + ')',
                            'title_EN_t:(' + escapedWords.join(' AND ') + ')',
                            'summary_EN_t:(' + escapedWords.join(' AND ') + ')',
                        ]);
                    }
                }

                // AND / OR everything

                return andOr(query);
            }

            function andOr(query, sep) {

                sep = sep || 'AND';

                if (_.isArray(query)) {

                    query = _.map(query, function(criteria) {

                        if (_.isArray(criteria)) {
                            return andOr(criteria, sep == "AND" ? "OR" : "AND");
                        }

                        return criteria;
                    });

                    query = '(' + query.join(' ' + sep + ' ') + ')';
                }

                return query;
            }

            function lstring(value) {

                var fields = _.drop(arguments, 1);

                return _.reduce(['en', 'es', 'fr', 'ru', 'zh', 'ar'], function(text, locale) {

                    text[locale] = _.reduce(fields, function(v, f) {
                        return v || value[f.replace('*', locale.toUpperCase())] || "";
                    }, "");

                    if (!text[locale])
                        delete text[locale];

                    return text;

                }, {});
            }

            function escape(value) {

                if (value === undefined) throw "Value is undefined";
                if (value === null) throw "Value is null";
                if (value === "") throw "Value is null";

                if (_.isNumber(value)) value = value.toString();
                if (_.isDate(value)) value = value.toISOString();

                //TODO add more types

                value = value.toString();

                value = value.replace(/\\/g, '\\\\');
                value = value.replace(/\+/g, '\\+');
                value = value.replace(/\-/g, '\\-');
                value = value.replace(/\&\&/g, '\\&&');
                value = value.replace(/\|\|/g, '\\||');
                value = value.replace(/\!/g, '\\!');
                value = value.replace(/\(/g, '\\(');
                value = value.replace(/\)/g, '\\)');
                value = value.replace(/\{/g, '\\{');
                value = value.replace(/\}/g, '\\}');
                value = value.replace(/\[/g, '\\[');
                value = value.replace(/\]/g, '\\]');
                value = value.replace(/\^/g, '\\^');
                value = value.replace(/\"/g, '\\"');
                value = value.replace(/\~/g, '\\~');
                value = value.replace(/\*/g, '\\*');
                value = value.replace(/\?/g, '\\?');
                value = value.replace(/\:/g, '\\:');

                return value;
            }
            //======================================================
            //
            //
            //======================================================
            function refreshPager(currentPage) {
                currentPage = currentPage || 0;

                var pageCount = Math.ceil(Math.max($scope.recordCount || 0, 0) / Number($scope.pageSize));
                var pages = [];

                for (var i = 0; i < pageCount; i++) {
                    pages.push({
                        index: i,
                        text: i + 1
                    });
                }

                $scope.currentPage = currentPage;
                $scope.pages = pages;

            }
            //=======================================================================
            //
            //=======================================================================
            $scope.extractId = function(id) {
                return parseInt(id.replace('52000000cbd08', ''), 16);
            };

            //=======================================================================
            //
            //=======================================================================
            $scope.goTo = function(code) {

                    $location.path('dashboard/submit/' + $route.current.params.schema + '/' + code + '/view');
                  //  return 'dashboard/submit/' + $route.current.params.schema + '/' + code + '/view';
            };
            //======================================================
            //
            //
            //======================================================
            function edit(record) {
                var url = 'dashboard/submit/' + record.schema_s + '/';

                if (record && record.identifier_s)
                    url += record.identifier_s;
                else {
                    url += 'new';
                }
                $location.url(url);
            }

            //======================================================
            //schema_s
            //
            //======================================================
            function del(record) {

                  delSql(record);
            }

            //======================================================
            //
            //
            //======================================================
            // function delMongo(record) {
            //     var meta ={status:'deleted'};
            //     return mongoStorage.save('bbi-requests',{meta:meta,'_id':record.identifier_s}).then(function() {
  					// 				$scope.$emit('showSuccess', 'Assitance Request ' + record.identifier_s + ' Deleted');
            //         $timeout(function(){reloadList();$scope.delLoader={};},3000);
            //
  					// 		}).catch(	$scope.onError);
            // }

            //======================================================
            //schema_s
            //
            //======================================================
            function delSql(record) {

                var repo = null;
                var identifier = record.identifier_s;

                $q.when(record).then(function(r) {

                    if (r._state_s == "public") repo = storage.documents;
                    else if (r._state_s == "draft") repo = storage.drafts;
                    else throw new Alert("Cannot delete request");

                    return repo.exists(identifier);

                }).then(function(exist) {

                    if (!exist)
                        throw new Alert("Record not found.");

                    delDialog().then(function(ret) {
                        if (ret.value === 'delete') {
                            //do toast
                            return repo.delete(identifier).then(function() {
                                $timeout(function(){reloadList();$scope.delLoader={};},3000);
                                $scope.$emit('showInfo', 'Record successfully deleted.');

                            });
                        }
                    });



                }).catch(function(e) {

                    if (e instanceof Noop)
                        return;

                    if (e instanceof Alert) {
                        alert(e.message);
                        return;
                    }

                    $scope.error = e;
                });

                function Alert(msg) {
                    this.message = msg;
                }

                function Noop() {}
            }

            //======================================================
            //
            //
            //======================================================
            function viewWorkflow(record) {
                var baseUrl = 'https://chm.cbd.int';
                if(realm == 'CHM-DEV')
                    baseUrl = 'https://chm.staging.cbd.int';

                window.open(baseUrl + "/management/requests/" + record._workflow_s.replace(/^workflow-/i, "") + "/publishRecord",'_blank');
            }
        }
    ];
});