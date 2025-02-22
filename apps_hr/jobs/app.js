module.exports = function init(site) {
  const $jobs = site.connectCollection("jobs")

  site.on('[company][created]', doc => {
    $jobs.add({
      code: "1-Test",
      name_Ar: "وظيفة إفتراضي",
      name_En : "Default job",
      image_url: '/images/jobs.png',
      company: {
        id: doc.id,
        name_Ar: doc.name_Ar,
        name_En: doc.name_En
      },
      branch: {
        code: doc.branch_list[0].code,
        name_Ar: doc.branch_list[0].name_Ar,
        name_En: doc.branch_list[0].name_En
      },
      active: true
    }, (err, doc) => { })
  })


  site.get({
    name: 'images',
    path: __dirname + '/site_files/images/'
  })

  site.get({
    name: "jobs",
    path: __dirname + "/site_files/html/index.html",
    parser: "html",
    compress: true
  })

  site.post("/api/jobs/add", (req, res) => {
    let response = {
      done: false
    }
    if (!req.session.user) {
      response.error = 'Please Login First'
      res.json(response)
      return
    }

    let jobs_doc = req.body
    jobs_doc.$req = req
    jobs_doc.$res = res

    jobs_doc.add_user_info = site.security.getUserFinger({
      $req: req,
      $res: res
    })

    if (typeof jobs_doc.active === 'undefined') {
      jobs_doc.active = true
    }

    jobs_doc.company = site.get_company(req)
    jobs_doc.branch = site.get_branch(req)

    $jobs.find({
      where: {
        'company.id': site.get_company(req).id,
        'branch.code': site.get_branch(req).code,
        $or: [{
          'name_Ar': jobs_doc.name_Ar
        },{
          'name_En': jobs_doc.name_En
        }]
      
      }
    }, (err, doc) => {
      if (!err && doc) {
        response.error = 'Name Exists'
        res.json(response)
      } else {

        let num_obj = {
          company: site.get_company(req),
          screen: 'jops',
          date: new Date()
        };

        let cb = site.getNumbering(num_obj);
        if (!jobs_doc.code && !cb.auto) {
          response.error = 'Must Enter Code';
          res.json(response);
          return;

        } else if (cb.auto) {
          jobs_doc.code = cb.code;
        }

        $jobs.add(jobs_doc, (err, doc) => {
          if (!err) {
            response.done = true
            response.doc = doc
          } else {
            response.error = err.message
          }
          res.json(response)
        })
      }
    })
  })

  site.post("/api/jobs/update", (req, res) => {
    let response = {
      done: false
    }

    if (!req.session.user) {
      response.error = 'Please Login First'
      res.json(response)
      return
    }

    let jobs_doc = req.body

    jobs_doc.edit_user_info = site.security.getUserFinger({
      $req: req,
      $res: res
    })

    if (jobs_doc.id) {
      $jobs.edit({
        where: {
          id: jobs_doc.id
        },
        set: jobs_doc,
        $req: req,
        $res: res
      }, err => {
        if (!err) {
          response.done = true
        } else {
          response.error = 'Code Already Exist'
        }
        res.json(response)
      })
    } else {
      response.error = 'no id'
      res.json(response)
    }
  })

  site.post("/api/jobs/view", (req, res) => {
    let response = {
      done: false
    }

    if (!req.session.user) {
      response.error = 'Please Login First'
      res.json(response)
      return
    }

    $jobs.findOne({
      where: {
        id: req.body.id
      }
    }, (err, doc) => {
      if (!err) {
        response.done = true
        response.doc = doc
      } else {
        response.error = err.message
      }
      res.json(response)
    })
  })

  site.post("/api/jobs/delete", (req, res) => {
    let response = {
      done: false
    }

    if (!req.session.user) {
      response.error = 'Please Login First'
      res.json(response)
      return
    }

    let id = req.body.id

    if (id) {
      $jobs.delete({
        id: id,
        $req: req,
        $res: res
      }, (err, result) => {
        if (!err) {
          response.done = true
        } else {
          response.error = err.message
        }
        res.json(response)
      })
    } else {
      response.error = 'no id'
      res.json(response)
    }
  })

  site.post("/api/jobs/all", (req, res) => {
    let response = {
      done: false
    }
          
    if (!req.session.user) {
      response.error = 'Please Login First'
      res.json(response)
      return
    }


    let where = req.body.where || {}

    if (where['name']) {
      where['name'] = site.get_RegExp(where['name'], "i");
    }
 

    delete where.search

    where['company.id'] = site.get_company(req).id

    $jobs.findMany({
      select: req.body.select || {},
      where: where,
      sort: req.body.sort || {
        id: -1
      },
      limit: req.body.limit
    }, (err, docs, count) => {
      if (!err) {
        response.done = true
        response.list = docs
        response.count = count
      } else {
        response.error = err.message
      }
      res.json(response)
    })
  })

}