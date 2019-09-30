module.exports = function init(site) {



  const $employee_discount = site.connectCollection("employee_discount")
  
  site.get({
    name: "employee_discount",
    path: __dirname + "/site_files/html/index.html",
    parser: "html",
    compress: false
  })


  site.post("/api/employee_discount/add", (req, res) => {
    let response = {}
    response.done = false
    if (req.session.user === undefined) {
      res.json(response)
    }
    let employee_discount_doc = req.body
    employee_discount_doc.$req = req
    employee_discount_doc.$res = res
    employee_discount_doc.add_user_info = site.security.getUserFinger({$req : req , $res : res})

    employee_discount_doc.date = new Date(employee_discount_doc.date)

    employee_discount_doc.company = site.get_company(req)
    employee_discount_doc.branch = site.get_branch(req)

    $employee_discount.add(employee_discount_doc, (err, doc) => {
      
        if (!err) {
       
        response.done = true
      } else {
        response.error = err.message
      }
      res.json(response)
    })
  })

  site.post("/api/employee_discount/update", (req, res) => {
    let response = {}
    response.done = false
    if (req.session.user === undefined) {
      res.json(response)
    }
    let employee_discount_doc = req.body
    employee_discount_doc.date = new Date(employee_discount_doc.date)
    if (employee_discount_doc._id) {
      $employee_discount.edit({
        where: {
          _id: employee_discount_doc._id
        },
        set: employee_discount_doc,
        $req: req,
        $res: res
      }, err => {
        if (!err) {
          response.done = true
        } else {
          response.error = err.message
        }
        res.json(response)
      })
    } else {
      res.json(response)
    }
  })

  site.post("/api/employee_discount/delete", (req, res) => {
    let response = {}
    response.done = false
    if (req.session.user === undefined) {
      res.json(response)
    }
    let _id = req.body._id
    if (_id) {
      $employee_discount.delete({
        _id: $employee_discount.ObjectID(_id),
        $req: req,
        $res: res
      }, (err, result) => {
        if (!err && result.ok) {

          let Obj = {
            value: result.doc.value,
            safe :result.doc.safe,
            company : result.doc.company,
            branch : result.doc.branch,
            date:result.doc.date,
            sourceName:result.doc.employee.name
          }
          if( Obj.value && Obj.safe && Obj.date && Obj.sourceName ){
            site.call('[employee_discount][safes][-]' , Obj)
          }

          response.done = true
        }
        res.json(response)
      })
    } else {
      res.json(response)
    }
  })

  site.post("/api/employee_discount/view", (req, res) => {
    let response = {}
    response.done = false
    $employee_discount.findOne({
      where: {
        _id: site.mongodb.ObjectID(req.body._id)
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

  site.post("/api/employee_discount/all", (req, res) => {
    let response = {}
    response.done = false

    let where = req.body.where || {}
    

    
    if (where.date) {
      let d1 = site.toDate(where.date)
      let d2 = site.toDate(where.date)
      d2.setDate(d2.getDate() + 1)
      where.date = {
        '$gte': d1,
        '$lt': d2
      }
    }
    if (where  && where.from_date) {
      let d1 = site.toDate(where.from_date)
      let d2 = site.toDate(where.to_date)
      d2.setDate(d2.getDate() + 1);
      where.date = {
        '$gte': d1,
        '$lt': d2
      }
      delete where.from_date
      delete where.to_date
    }



    
    if (where.search && where.search.date) {
      let d1 = site.toDate(where.search.date)
      let d2 = site.toDate(where.search.date)
      d2.setDate(d2.getDate() + 1)
      where.date = {
        '$gte': d1,
        '$lt': d2
      }
    }

    if (where && where.search && where.search.from_date) {
      let d1 = site.toDate(where.search.from_date)
      let d2 = site.toDate(where.search.to_date)
      d2.setDate(d2.getDate() + 1);
      where.date = {
        '$gte': d1,
        '$lt': d2
      }
    }


    if (where.search && where.search.employee) {
      where['employee.id'] = where.search.employee.id
    }
    
    if(where['description']) {
      where['description'] = new RegExp(where['description'] , 'i')
    }


    if (where.search && where.search.value) {
    
      where['value'] = where.search.value
    }
    
    delete where.search


    where['company.id'] = site.get_company(req).id
    where['branch.code'] = site.get_branch(req).code

    $employee_discount.findMany({
      select: req.body.select || {},
      where: where,
      sort : {id : -1},
      limit: req.body.limit,
      limit: 0
    }, (err, docs) => {
      if (!err) {
        response.done = true
        response.list = docs
      } else {
        response.error = err.message
      }
      res.json(response)
    })
  })

  
}