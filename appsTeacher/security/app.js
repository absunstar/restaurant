module.exports = function init(site) {
  const $companies = site.connectCollection("companies");

  site.post("/api/security/permissions", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "You Are Not Login";
      res.json(response);
      return;
    }

    response.done = true;
    response.permissions = site.security.permissions;
    res.json(response);
  });

  site.post("/api/security/roles", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "You Are Not Login";
      res.json(response);
      return;
    }

    response.done = true;
    response.roles = site.security.roles;

    res.json(response);
  });

  site.get({
    name: "security",
    path: __dirname + "/site_files/html/index.html",
    parser: "html js",
    compress: false,
  });

  site.get({
    name: "security/users",
    path: __dirname + "/site_files/html/users.html",
    parser: "html js",
    compress: false,
  });

  site.get({
    name: "security/roles",
    path: __dirname + "/site_files/html/roles.html",
    parser: "html js",
    compress: false,
  });

  site.get({
    name: "/images",
    path: __dirname + "/site_files/images",
  });

  site.post("/api/users/all", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "You Are Not Login";
      res.json(response);
      return;
    }

    let where = req.body.where || {};
    let search = req.body.search || {};

    if (search) {
      where.$or = [];

      where.$or.push({
        firstName: site.get_RegExp(where["search"], "i"),
      });

      where.$or.push({
        lastName: site.get_RegExp(where["search"], "i"),
      });

      where.$or.push({
        mobile: site.get_RegExp(where["search"], "i"),
      });

      delete where["search"];
    }
    where["id"] = { $ne: 1 };
    where["host"] = site.getHostFilter(req.host);

    site.security.getUsers(
      {
        where: where,
        limit: 1000,
      },
      (err, docs, count) => {
        if (!err) {
          response.done = true;

          for (let i = 0; i < docs.length; i++) {
            let u = docs[i];
            u.image = u.image || "/images/user.png";
          }

          response.users = docs;
          response.count = count;
        }
        res.json(response);
      }
    );
  });

  site.post("/api/user/add", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "You Are Not Login";
      res.json(response);
      return;
    }

    let user = req.body;
    user.$req = req;
    user.$res = res;

    user.company = site.getCompany(req);
    user.branch = site.getBranch(req);
    let numObj = {
      company: site.getCompany(req),
      screen: user.type.name,
      date: new Date(),
    };

    let cb = site.getNumbering(numObj);
    if (!user.code && !cb.auto) {
      response.error = "Must Enter Code";
      res.json(response);
      return;
    } else if (cb.auto) {
      user.code = cb.code;
    }

    site.security.addUser(user, (err, _id) => {
      if (!err) {
        response.done = true;
      } else {
        response.error = err.message;
      }
      res.json(response);
    });
  });

  site.post("/api/user/update", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "You Are Not Login";
      res.json(response);
      return;
    }

    let user = req.body;
    user.$req = req;
    user.$res = res;
    delete user.$$hashKey;

    site.security.updateUser(user, (err) => {
      if (!err) {
        response.done = true;
      } else {
        response.error = err.message;
      }
      res.json(response);
    });
  });

  site.post("/api/user/delete", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "You Are Not Login";
      res.json(response);
      return;
    }

    let id = req.body.id;
    if (id) {
      site.security.deleteUser(
        {
          id: id,
          $req: req,
          $res: res,
        },
        (err, result) => {
          if (!err) {
            response.done = true;
          } else {
            response.error = err.message;
          }
          res.json(response);
        }
      );
    } else {
      response.error = "No ID Requested";
      res.json(response);
    }
  });

  site.post("/api/user/branches/all", (req, res) => {
    let response = {
      done: false,
    };
    if (req.data && req.data.where) {
      site.security.getUser(req.data.where, (err, user) => {
        if (!err && user) {
          response.done = true;
          let branchList = [];
          site.getApp("companies").memoryList.forEach((co) => {
            if (user.isAdmin) {
              co.branchList = co.branchList || [];
              co.branchList.forEach((br) => {
                branchList.push({
                  company: {
                    id: co.id,
                    code: co.code,
                    nameAr: co.nameAr,
                    nameEn: co.nameEn,
                  },
                  branch: {
                    code: br.code,
                    nameAr: br.nameAr,
                    nameEn: br.nameEn,
                  },
                });
              });
            } else if (user.branchList && user.branchList.length > 0) {
              user.branchList.forEach((b) => {
                if (co.id === b.company.id) {
                  co.branchList = co.branchList || [];
                  co.branchList.forEach((br) => {
                    if (b.branch.code == br.code) {
                      branchList.push({
                        company: {
                          id: co.id,
                          code: co.code,
                          nameAr: co.nameAr,
                          nameEn: co.nameEn,
                        },
                        branch: {
                          code: br.code,
                          nameAr: br.nameAr,
                          nameEn: br.nameEn,
                        },
                      });
                    }
                  });
                }
              });
            }
          });
          response.list = branchList;
          res.json(response);
        } else {
          response.error = err ? err.message : "No User Exists : " + req.data.where.email;
          res.json(response);
        }
      });
    } else {
      response.error = "no email";
      res.json(response);
    }
  });

  site.post("/api/user/view", (req, res) => {
    let response = {
      done: false,
    };
    // if (!req.session.user) {
    //   response.error = 'You Are Not Login';
    //   res.json(response);
    //   return;
    // }
    let where = {};
    if (req.body.id) {
      where = {
        id: req.body.id,
      };
    } else if (req.body._id) {
      where = {
        _id: site.mongodb.ObjectID(req.body._id),
      };
    }

    site.security.getUser(where, (err, doc) => {
      if (!err && doc) {
        response.done = true;

        if (doc.createdDate) {
          doc.$createdDate = site.xtime(doc.createdDate, req.session.lang);
        }
        let date = new Date(doc.visit_date);
        date.setMinutes(date.getMinutes() + 1);
        if (new Date() < date) {
          doc.$isOnline = true;
        } else {
          doc.$isOnline = false;
          if (doc.visitDate) {
            doc.$lastSeen = site.xtime(doc.visitDate, req.session.lang);
          }
        }
        if (req.body.type == "notifications") {
          for (let i = 0; i < doc.notificationsList.length; i++) {
            doc.notificationsList[i].$time = site.xtime(doc.notificationsList[i].date, req.session.lang);
          }
        }

        response.doc = doc;
      } else if (err) {
        response.error = err.message;
      }
      res.json(response);
    });
  });

  site.post("/api/user/register", (req, res) => {
    let response = {};

    if (req.body.$encript) {
      if (req.body.$encript === "64") {
        req.body.email = site.fromBase64(req.body.email);
        req.body.password = site.fromBase64(req.body.password);
      } else if (req.body.$encript === "123") {
        req.body.email = site.from123(req.body.email);
        req.body.password = site.from123(req.body.password);
      }
    }

    site.security.register(
      {
        email: req.body.email,
        password: req.body.password,
        ip: req.ip,
        permissions: ["user"],
        files: [],
        name: req.body.email,
        $req: req,
        $res: res,
      },
      function (err, doc) {
        if (!err) {
          response.user = doc;
          response.done = true;
        } else {
          response.error = err.message;
        }
        res.json(response);
      }
    );
  });

  site.post("/api/user/login", function (req, res) {
    let response = {
      accessToken: req.session.accessToken,
    };
    if (req.body.$encript) {
      if (req.body.$encript === "64") {
        req.body.email = site.fromBase64(req.body.email);
        req.body.password = site.fromBase64(req.body.password);
        req.body.company = site.fromJson(site.fromBase64(req.body.company));
        req.body.branch = site.fromJson(site.fromBase64(req.body.branch));
      } else if (req.body.$encript === "123") {
        req.body.email = site.from123(req.body.email);
        req.body.password = site.from123(req.body.password);
        req.body.company = site.fromJson(site.from123(req.body.company));
        req.body.branch = site.fromJson(site.from123(req.body.branch));
      }
    }

    let obj_where = {
      password: req.body.password,
      company: req.body.company,
      branch: req.body.branch,
      $req: req,
      $res: res,
    };
    if (req.body.mobile_login == true) {
      if (req.body.email.contains("@") || req.body.email.contains(".")) {
        obj_where.email = req.body.email;
      } else {
        obj_where.mobile = req.body.email;
      }
    } else {
      obj_where.email = req.body.email;
    }
    // if (site.security.isUserLogin(req, res)) {
    //   response.error = "Login Error , You Are Loged "
    //   response.done = true
    //   res.json(response)
    //   return
    // }

    site.security.login(obj_where, function (err, user) {
      if (!err && user) {
        req.session.user = user;
        req.session.company = req.body.company;
        req.session.branch = req.body.branch;
        site.saveSession(req.session);

        response.user = {
          id: user.id,
          _id: user._id,
          email: user.email,
          targetId: user.refInfo ? user.refInfo.id : null,
          type: user.type,
          permissions: user.permissions,
          company: req.body.company,
          branch: req.body.branch,
        };
        response.done = true;
      } else {
        response.error = err.message;
      }

      res.json(response);
    });
  });

  site.post("/api/user/logout", function (req, res) {
    let response = {
      accessToken: req.session.accessToken,
      done: true,
    };

    site.security.logout(req, res, (err, ok) => {
      if (ok) {
        response.done = true;
        res.json(response);
      } else {
        response.error = "You Are Not Loged";
        response.done = true;
        res.json(response);
      }
    });
  });

  site.post("/api/role/add", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "You Are Not Login";
      res.json(response);
      return;
    }

    let role = req.body;
    role.$req = req;
    role.$res = res;
    site.security.addRole(role, (err, doc) => {
      if (!err) {
        response.done = true;
      } else {
        response.error = err.message;
      }
      res.json(response);
    });
  });

  site.post("/api/role/edit", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "You Are Not Login";
      res.json(response);
      return;
    }

    let role = req.body;
    role.$req = req;
    role.$res = res;
    site.security.updateRole(role, (err) => {
      if (!err) {
        response.done = true;
      } else {
        response.error = err.message;
      }
      res.json(response);
    });
  });

  site.post("/api/role/delete", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "You Are Not Login";
      res.json(response);
      return;
    }

    let role = req.data;
    role.$req = req;
    role.$res = res;

    site.security.deleteRole(role, (err, doc) => {
      if (!err) {
        response.done = true;
      } else {
        response.error = err.message;
      }
      res.json(response);
    });
  });

  site.post("/api/get_dir_names", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "You Are Not Login";
      res.json(response);
      return;
    }

    let z = req.body;
    let w = [];

    site.words.list.forEach((x) => {
      z.forEach((xx) => {
        if (xx.name && xx.name.replace(/-/g, "_") == x.name) {
          w.push(x);
        }
      });
    });

    response.doc = w;

    res.json(response);
  });
};
