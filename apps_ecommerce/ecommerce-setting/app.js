module.exports = function init(site) {
  const $ecommerce_setting = site.connectCollection("ecommerce_setting");
  const $product = site.connectCollection("product");
  const $product_group = site.connectCollection("product_group");

  site.get({
    name: "ecommerce_setting",
    path: __dirname + "/site_files/html/index.html",
    parser: "html",
    compress: false,
  });

  site.get({
    name: "/images",
    path: __dirname + "/site_files/images",
  });

  site.on("[company][created]", (doc) => {
    $product_group.add(
      {
        code: "1-Test",
        name_ar: "مجموعة منتجات إفتراضية",
        name_en: "Default Products Group",
        image_url: "/images/product_group.png",
        company: {
          id: doc.id,
          name_ar: doc.name_ar,
          name_en: doc.name_en,
        },
        branch: {
          code: doc.branch_list[0].code,
          name_ar: doc.branch_list[0].name_ar,
          name_en: doc.branch_list[0].name_en,
        },
        active: true,
      },
      (err, doc1) => {
        site.call("[product_group][product][add]", doc1);
      }
    );
  });

  site.on("[product_group][product][add]", (doc) => {
    $product.add(
      {
        product_group: {
          id: doc.id,
          code: doc.code,
          name_ar: doc.name_ar,
          name_en: doc.name_en,
        },
        name_ar: "منتج إفتراضي",
        name_en: "Default Product",
        code: "1-Test",
        image_url: "/images/product.png",
        company: {
          id: doc.company.id,
          name_ar: doc.company.name_ar,
          name_en: doc.company.name_en,
        },
        branch: {
          code: doc.branch.code,
          name_ar: doc.branch.name_ar,
          name_en: doc.branch.name_en,
        },
        active: true,
      },
      (err, doc1) => {}
    );
  });

  site.post("/api/product/add", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "Please Login First";
      res.json(response);
      return;
    }

    let product_doc = req.body;
    product_doc.$req = req;
    product_doc.$res = res;

    product_doc.add_user_info = site.security.getUserFinger({
      $req: req,
      $res: res,
    });

    if (typeof product_doc.active === "undefined") {
      product_doc.active = true;
    }

    product_doc.company = site.get_company(req);
    product_doc.branch = site.get_branch(req);

    $product.find(
      {
        where: {
          "company.id": site.get_company(req).id,
          "branch.code": site.get_branch(req).code,
          $or: [
            {
              name_ar: product_doc.name_ar,
            },
            {
              name_en: product_doc.name_en,
            },
          ],
        },
      },
      (err, doc) => {
        if (!err && doc) {
          response.error = "Name Exists";
          res.json(response);
        } else {
          // let d = new Date();
          // d.setFullYear(d.getFullYear() + 1);
          // d.setMonth(1);
          let num_obj = {
            company: site.get_company(req),
            screen: "products",
            date: new Date(),
          };

          let cb = site.getNumbering(num_obj);
          if (!product_doc.code && !cb.auto) {
            response.error = "Must Enter Code";
            res.json(response);
            return;
          } else if (cb.auto) {
            product_doc.code = cb.code;
          }

          $product.add(product_doc, (err, doc) => {
            if (!err) {
              response.done = true;
              response.doc = doc;
            } else {
              response.error = err.message;
            }
            res.json(response);
          });
        }
      }
    );
  });

  site.post("/api/product/update", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "Please Login First";
      res.json(response);
      return;
    }

    let product_doc = req.body;

    product_doc.edit_user_info = site.security.getUserFinger({
      $req: req,
      $res: res,
    });

    if (product_doc.id) {
      $product.edit(
        {
          where: {
            id: product_doc.id,
          },
          set: product_doc,
          $req: req,
          $res: res,
        },
        (err) => {
          if (!err) {
            response.done = true;
          } else {
            response.error = "Code Already Exist";
          }
          res.json(response);
        }
      );
    } else {
      response.error = "no id";
      res.json(response);
    }
  });

  site.post("/api/product/view", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "Please Login First";
      res.json(response);
      return;
    }

    $product.findOne(
      {
        where: {
          id: req.body.id,
        },
      },
      (err, doc) => {
        if (!err) {
          response.done = true;
          response.doc = doc;
        } else {
          response.error = err.message;
        }
        res.json(response);
      }
    );
  });

  site.post("/api/product/delete", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "Please Login First";
      res.json(response);
      return;
    }

    let id = req.body.id;

    if (id) {
      $product.delete(
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
      response.error = "no id";
      res.json(response);
    }
  });

  site.post("/api/product/all", (req, res) => {
    let response = {
      done: false,
    };

    let where = req.body.where || {};

    where["company.id"] = site.get_company(req).id;
    where["branch.code"] = site.get_branch(req).code;

    if (where["name"]) {
      where["$or"] = [
        { name_ar: site.get_RegExp(where["name"], "i") },
        { name_en: site.get_RegExp(where["name"], "i") },
      ];
      delete where["name"];
    }

    if (where["products_group"]) {
      where["products_group.id"] = where["products_group"].id;
      delete where["products_group"];
      delete where.active;
    }

    $product.findMany(
      {
        select: req.body.select || {},
        where: where,
        sort: req.body.sort || {
          id: -1,
        },
        limit: req.body.limit,
      },
      (err, docs, count) => {
        if (!err) {
          response.done = true;
          response.list = docs;
          response.count = count;
        } else {
          response.error = err.message;
        }
        res.json(response);
      }
    );
  });

  site.post("/api/product_group/add", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "Please Login First";
      res.json(response);
      return;
    }

    let product_group_doc = req.body;
    product_group_doc.$req = req;
    product_group_doc.$res = res;

    product_group_doc.add_user_info = site.security.getUserFinger({
      $req: req,
      $res: res,
    });

    if (typeof product_group_doc.active === "undefined") {
      product_group_doc.active = true;
    }

    product_group_doc.company = site.get_company(req);
    product_group_doc.branch = site.get_branch(req);

    $product_group.find(
      {
        where: {
          "company.id": site.get_company(req).id,
          "branch.code": site.get_branch(req).code,
          $or: [
            {
              name_ar: product_group_doc.name_ar,
            },
            {
              name_en: product_group_doc.name_en,
            },
          ],
        },
      },
      (err, doc) => {
        if (!err && doc) {
          response.error = "Name Exists";
          res.json(response);
        } else {
          // let d = new Date();
          // d.setFullYear(d.getFullYear() + 1);
          // d.setMonth(1);
          let num_obj = {
            company: site.get_company(req),
            screen: "products_groups",
            date: new Date(),
          };

          let cb = site.getNumbering(num_obj);
          if (!product_group_doc.code && !cb.auto) {
            response.error = "Must Enter Code";
            res.json(response);
            return;
          } else if (cb.auto) {
            product_group_doc.code = cb.code;
          }

          $product_group.add(product_group_doc, (err, doc) => {
            if (!err) {
              response.done = true;
              response.doc = doc;
              if (product_group_doc.link_item_groups) {
                site.linkItemsGroups({ ...product_group_doc }, (cbId) => {
                  product_group_doc.group_id = cbId;
                  $product_group.update(product_group_doc, () => {});
                });
              }
            } else {
              response.error = err.message;
            }
            res.json(response);
          });
        }
      }
    );
  });

  site.post("/api/product_group/update", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "Please Login First";
      res.json(response);
      return;
    }

    let product_group_doc = req.body;

    product_group_doc.edit_user_info = site.security.getUserFinger({
      $req: req,
      $res: res,
    });

    if (product_group_doc.id) {
      $product_group.edit(
        {
          where: {
            id: product_group_doc.id,
          },
          set: product_group_doc,
          $req: req,
          $res: res,
        },
        (err) => {
          if (!err) {
            response.done = true;
          } else {
            response.error = "Code Already Exist";
          }
          res.json(response);
        }
      );
    } else {
      response.error = "no id";
      res.json(response);
    }
  });

  site.post("/api/product_group/view", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "Please Login First";
      res.json(response);
      return;
    }

    $product_group.findOne(
      {
        where: {
          id: req.body.id,
        },
      },
      (err, doc) => {
        if (!err) {
          response.done = true;
          response.doc = doc;
        } else {
          response.error = err.message;
        }
        res.json(response);
      }
    );
  });

  site.post("/api/product_group/delete", (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = "Please Login First";
      res.json(response);
      return;
    }

    let id = req.body.id;

    if (id) {
      $product_group.delete(
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
      response.error = "no id";
      res.json(response);
    }
  });

  site.post("/api/product_group/all", (req, res) => {
    let response = {
      done: false,
    };

    let where = req.body.where || {};

    where["company.id"] = site.get_company(req).id;
    where["branch.code"] = site.get_branch(req).code;

    if (where["name"]) {
      where["$or"] = [
        { name_ar: site.get_RegExp(where["name"], "i") },
        { name_en: site.get_RegExp(where["name"], "i") },
      ];
      delete where["name"];
    }

    $product_group.findMany(
      {
        select: req.body.select || {},
        where: where,
        sort: req.body.sort || {
          id: -1,
        },
        limit: req.body.limit,
      },
      (err, docs, count) => {
        if (!err) {
          response.done = true;
          response.list = docs;
          response.count = count;
        } else {
          response.error = err.message;
        }
        res.json(response);
      }
    );
  });
};
