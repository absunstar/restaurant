module.exports = function init(site) {
  let app = {
    name: "requestConsultations",
    allowMemory: false,
    memoryList: [],
    allowCache: false,
    cacheList: [],
    allowRoute: true,
    allowRouteGet: true,
    allowRouteAdd: true,
    allowRouteUpdate: true,
    allowRouteDelete: true,
    allowRouteView: true,
    allowRouteAll: true,
  };

  app.$collection = site.connectCollection(app.name);
  app.$collectionReply = site.connectCollection("requestConsultationsReply");

  app.init = function () {
    if (app.allowMemory) {
      app.$collection.findMany({}, (err, docs) => {
        if (!err) {
          if (docs.length == 0) {
            app.cacheList.forEach((_item, i) => {
              app.$collection.add(_item, (err, doc) => {
                if (!err && doc) {
                  app.memoryList.push(doc);
                }
              });
            });
          } else {
            docs.forEach((doc) => {
              app.memoryList.push(doc);
            });
          }
        }
      });
    }
  };
  app.add = function (_item, callback) {
    app.$collection.add(_item, (err, doc) => {
      if (callback) {
        callback(err, doc);
      }
      if (app.allowMemory && !err && doc) {
        app.memoryList.push(doc);
      }
    });
  };
  app.update = function (_item, callback) {
    app.$collection.edit(
      {
        where: {
          id: _item.id,
        },
        set: _item,
      },
      (err, result) => {
        if (callback) {
          callback(err, result);
        }
        if (app.allowMemory && !err && result) {
          let index = app.memoryList.findIndex(
            (itm) => itm.id === result.doc.id
          );
          if (index !== -1) {
            app.memoryList[index] = result.doc;
          } else {
            app.memoryList.push(result.doc);
          }
        } else if (app.allowCache && !err && result) {
          let index = app.cacheList.findIndex(
            (itm) => itm.id === result.doc.id
          );
          if (index !== -1) {
            app.cacheList[index] = result.doc;
          } else {
            app.cacheList.push(result.doc);
          }
        }
      }
    );
  };
  app.delete = function (_item, callback) {
    app.$collection.delete(
      {
        id: _item.id,
      },
      (err, result) => {
        if (callback) {
          callback(err, result);
        }
        if (app.allowMemory && !err && result.count === 1) {
          let index = app.memoryList.findIndex((a) => a.id === _item.id);
          if (index !== -1) {
            app.memoryList.splice(index, 1);
          }
        } else if (app.allowCache && !err && result.count === 1) {
          let index = app.cacheList.findIndex((a) => a.id === _item.id);
          if (index !== -1) {
            app.cacheList.splice(index, 1);
          }
        }
      }
    );
  };
  app.view = function (_item, callback) {
    if (callback) {
      if (app.allowMemory) {
        if ((item = app.memoryList.find((itm) => itm.id == _item.id))) {
          callback(null, item);
          return;
        }
      } else if (app.allowCache) {
        if ((item = app.cacheList.find((itm) => itm.id == _item.id))) {
          callback(null, item);
          return;
        }
      }

      app.$collection.find({ id: _item.id }, (err, doc) => {
        callback(err, doc);

        if (!err && doc) {
          if (app.allowMemory) {
            app.memoryList.push(doc);
          } else if (app.allowCache) {
            app.cacheList.push(doc);
          }
        }
      });
    }
  };
  app.all = function (_options, callback) {
    if (callback) {
      if (app.allowMemory) {
        callback(null, app.memoryList);
      } else {
        app.$collection.findMany(_options, callback);
      }
    }
  };

  if (app.allowRoute) {
    if (app.allowRouteGet) {
      site.get(
        {
          name: app.name,
        },
        (req, res) => {
          res.render(
            app.name + "/requestConsultations.html",
            {
              title: app.name,
              appName: req.word("Request A Consultations"),
              setting: site.getSiteSetting(req.host),
            },
            { parser: "html", compres: true }
          );
        }
      );

      site.get(
        {
          name: "requestConsultationsView",
        },
        (req, res) => {
          res.render(
            app.name + "/requestConsultationsView.html",
            {
              title: app.name,
              appName: req.word("Request A Consultations View"),
              setting: site.getSiteSetting(req.host),
            },
            { parser: "html", compres: true }
          );
        }
      );

      site.get(
        {
          name: "requestConsultationsManage",
        },
        (req, res) => {
          res.render(
            app.name + "/index.html",
            {
              title: "requestConsultationsManage",
              appName: req.word("Request A Consultations Manage"),
              setting: site.getSiteSetting(req.host),
            },
            { parser: "html", compres: true }
          );
        }
      );
    }

    if (app.allowRouteAdd) {
      site.post(
        { name: `/api/${app.name}/add`, require: { permissions: ["login"] } },
        (req, res) => {
          let response = {
            done: false,
          };

          let _data = req.data;

          _data.status = site.consultationsStatusList[0];
          _data.repliesList = [];
          _data.date = new Date();
          _data.watchCount = 0;
          _data.user = {
            firstName: req.session.user.firstName,
            lastName: req.session.user.lastName,
            id: req.session.user.id,
            image: req.session.user.image,
          };

          app.add(_data, (err, doc) => {
            if (!err && doc) {
              response.done = true;
              response.doc = doc;
            } else {
              response.error = err.mesage;
            }
            res.json(response);
          });
        }
      );

      site.post(
        {
          name: `/api/requestConsultationsReply/add`,
          require: { permissions: ["login"] },
        },
        (req, res) => {
          let response = {
            done: false,
          };

          let _data = req.data;

          _data.user = {
            firstName: req.session.user.firstName,
            lastName: req.session.user.lastName,
            id: req.session.user.id,
            image: req.session.user.image,
          };
          _data.supportCount = 0;
          _data.oppositionCount = 0;
          _data.date = new Date();
          _data.repliesList = [];
          _data.supportList = [];
          _data.oppositionList = [];
          app.$collectionReply.add(_data, (err, doc) => {
            if (!err && doc) {
              response.done = true;
              response.doc = doc;
            } else {
              response.error = err.mesage;
            }
            res.json(response);
          });
        }
      );
    }

    if (app.allowRouteUpdate) {
      site.post(
        {
          name: `/api/${app.name}/update`,
          require: { permissions: ["login"] },
        },
        (req, res) => {
          let response = {
            done: false,
          };

          let _data = req.data;
          _data.editUserInfo = req.getUserFinger();

          app.update(_data, (err, result) => {
            if (!err) {
              response.done = true;
              response.result = result;
            } else {
              response.error = err.message;
            }
            res.json(response);
          });
        }
      );

      site.post(
        {
          name: `/api/${app.name}/updateReply`,
          require: { permissions: ["login"] },
        },
        (req, res) => {
          let response = {
            done: false,
          };
          let _data = req.data;
          app.view({ id: _data.id }, (err, doc) => {
            let index = doc.repliesList.findIndex(
              (itm) => itm.code === _data.code
            );
            if (_data.type == "addReply") {
              if (!_data.comment) {
                response.error = "Must Add Comment";
                res.json(response);
              }
              doc.repliesList.push({
                user: {
                  firstName: req.session.user.firstName,
                  lastName: req.session.user.lastName,
                  id: req.session.user.id,
                  image: req.session.user.image,
                },
                date: new Date(),
                supportCount: 0,
                oppositionCount: 0,
                comment: _data.comment,
                repliesList: [],
                supportList: [],
                oppositionList: [],
                code: Math.random().toString(30).slice(2) + doc.id,
              });
            }
            if (_data.type == "addSubReply") {
              if (!_data.comment) {
                response.error = "Must Add Comment";
                res.json(response);
              }
             
              doc.repliesList[index].repliesList.push({
                user: {
                  firstName: req.session.user.firstName,
                  lastName: req.session.user.lastName,
                  id: req.session.user.id,
                  image: req.session.user.image,
                },
                date: new Date(),
                comment: _data.comment,
                code: Math.random().toString(30).slice(2) + doc.id,
              });
            } else if (_data.type == "support") {
              doc.repliesList[index].supportCount += 1;
           
              doc.repliesList[index].supportList.unshift({
                user: {
                  firstName: req.session.user.firstName,
                  lastName: req.session.user.lastName,
                  id: req.session.user.id,
                  image: req.session.user.image,
                },
                date: new Date(),
              });
            } else if (_data.type == "opposition") {
              doc.repliesList[index].oppositionCount += 1;
              doc.repliesList[index].oppositionList.unshift({
                user: {
                  firstName: req.session.user.firstName,
                  lastName: req.session.user.lastName,
                  id: req.session.user.id,
                  image: req.session.user.image,
                },
                date: new Date(),
              });
            } else if (_data.type == "unsupport") {
              doc.repliesList[index].supportCount -= 1;
              doc.repliesList[index].supportList = doc.repliesList[
                index
              ].supportList.filter((person) => person.user.id != _data.userId);
            } else if (_data.type == "unopposition") {
              doc.repliesList[index].oppositionCount -= 1;
              doc.repliesList[index].oppositionList = doc.repliesList[
                index
              ].oppositionList.filter(
                (person) => person.user.id != _data.userId
              );
            } else if (_data.type == "approve") {
              doc.repliesList[index].approve = true;
              doc.approveReply = true;
            } else if (_data.type == "unapprove") {
              doc.repliesList[index].approve = false;
              doc.approveReply = false;
            }
            app.update(doc, (err, result) => {
              if (!err) {
                response.done = true;
                response.result = result;
              } else {
                response.error = err.message;
              }
              res.json(response);
            });
          });
        }
      );
    }

    if (app.allowRouteDelete) {
      site.post(
        {
          name: `/api/${app.name}/delete`,
          require: { permissions: ["login"] },
        },
        (req, res) => {
          let response = {
            done: false,
          };
          let _data = req.data;

          app.delete(_data, (err, result) => {
            if (!err && result.count === 1) {
              response.done = true;
              response.result = result;
            } else {
              response.error = err?.message || "Deleted Not Exists";
            }
            res.json(response);
          });
        }
      );
    }

    if (app.allowRouteView) {
      site.post({ name: `/api/${app.name}/view`, public: true }, (req, res) => {
        let response = {
          done: false,
        };

        let _data = req.data;
        app.view(_data, (err, doc) => {
          if (!err && doc) {
            response.done = true;
            doc.$time = site.xtime(doc.date, req.session.lang || "Ar");
            for (let i = 0; i < doc.repliesList.length; i++) {
              let _doc = doc.repliesList[i];
              if (req.session.user) {
                _doc.$userSupport = _doc.supportList.some(
                  (_f) => _f.user.id === req.session.user.id
                );
                _doc.$userOpposition = _doc.oppositionList.some(
                  (_f) => _f.user.id === req.session.user.id
                );
              }

              _doc.$time = site.xtime(_doc.date, req.session.lang || "Ar");
              if (_doc.repliesList && _doc.repliesList.length > 0) {
                _doc.repliesList.forEach((_reply) => {
                  _reply.$time = site.xtime(
                    _reply.date,
                    req.session.lang || "Ar"
                  );
                });
              }
            }
            response.doc = doc;
            doc.watchCount += 1;
            app.update(doc);
          } else {
            response.error = err?.message || "Not Exists";
          }
          res.json(response);
        });
      });
    }

    if (app.allowRouteAll) {
      site.post({ name: `/api/${app.name}/all`, public: true }, (req, res) => {
        let where = req.body.where || {};
        let search = req.body.search || "";
        let limit = req.body.limit || 100;
        let select = req.body.select || {
          id: 1,
          lawyer: 1,
          user: 1,
          name: 1,
          consultationClassification: 1,
          typeConsultation: 1,
          details: 1,
          status: 1,
          approveReply: 1,
        };
        if (where && where.fromDate && where.toDate) {
          let d1 = site.toDate(where.fromDate);
          let d2 = site.toDate(where.toDate);
          d2.setDate(d2.getDate() + 1);
          where.date = {
            $gte: d1,
            $lte: d2,
          };
          delete where.fromDate;
          delete where.toDate;
        }

        if (search) {
          where.$or = [];

          where.$or.push({
            number: search,
          });
          where.$or.push({
            year: search,
          });
          where.$or.push({
            "office.name": site.get_RegExp(search, "i"),
          });
          where.$or.push({
            "court.name": site.get_RegExp(search, "i"),
          });
          where.$or.push({
            "circle.name": site.get_RegExp(search, "i"),
          });
          where.$or.push({
            "lawsuitDegree.name": site.get_RegExp(search, "i"),
          });
          where.$or.push({
            "statusLawsuit.name": site.get_RegExp(search, "i"),
          });
          where.$or.push({
            "typesLawsuit.name": site.get_RegExp(search, "i"),
          });
          where.$or.push({
            lawsuitTopic: site.get_RegExp(search, "i"),
          });
          where.$or.push({
            description: site.get_RegExp(search, "i"),
          });
        }
        app.all(
          { where: where, limit, select, sort: { id: -1 } },
          (err, docs) => {
            res.json({ done: true, list: docs });
          }
        );
      });

      site.post(
        { name: `/api/requestConsultationsReply/all`, public: true },
        (req, res) => {
          let where = req.body.where || {};
          let search = req.body.search || "";
          let limit = req.body.limit || 500;
          let select = req.body.select || {};
          if (where && where.fromDate && where.toDate) {
            let d1 = site.toDate(where.fromDate);
            let d2 = site.toDate(where.toDate);
            d2.setDate(d2.getDate() + 1);
            where.date = {
              $gte: d1,
              $lte: d2,
            };
            delete where.fromDate;
            delete where.toDate;
          }

          if (search) {
            where.$or = [];
            where.$or.push({
              comment: site.get_RegExp(search, "i"),
            });
          }
          app.$collectionReply.findMany(
            { where: where, limit, select, sort: { date: -1 } },
            (err, docs) => {
              if (docs && docs.length > 0)
                for (let i = 0; i < docs.length; i++) {
                  let _doc = docs[i];
                  if (req.session.user) {
                    _doc.$userSupport = _doc.supportList.some(
                      (_f) => _f.user.id === req.session.user.id
                    );
                    _doc.$userOpposition = _doc.oppositionList.some(
                      (_f) => _f.user.id === req.session.user.id
                    );
                  }

                  _doc.$time = site.xtime(_doc.date, req.session.lang || "Ar");
                  if (_doc.repliesList && _doc.repliesList.length > 0) {
                    _doc.repliesList.forEach((_reply) => {
                      _reply.$time = site.xtime(
                        _reply.date,
                        req.session.lang || "Ar"
                      );
                    });
                  }
                }
              res.json({ done: true, list: docs });
            }
          );
        }
      );
    }
  }

  app.init();
  site.addApp(app);
};
