module.exports = function init(site) {
  const $attend_subscribers = site.connectCollection("attend_subscribers")
  const $request_service = site.connectCollection("request_service")

  site.on('zk attend', attend => {
    user_id = attend.user_id

    site.getCustomerAttend(user_id.toString(), customerCb => {
      // get customer by user_id

      if (!customerCb) return;

      $attend_subscribers.findMany({
        where: {
          'customer.id': customerCb.id
        },
        limit : 1 ,
        sort: { id: -1 }
      }, (err, docs) => {

        let  customerDoc = null

        if(!err && docs.length == 1){
          customerDoc = docs[0]
        }
        
          let attend_time = {
            hour: new Date(attend.date).getHours(),
            minute: new Date(attend.date).getMinutes()
          }

          let can_check_in = false
          let can_check_out = false
          if(customerDoc == null){
            can_check_in = true
          }
          if(customerDoc && customerDoc.leave_date){
            can_check_in = true
          }

          if(customerDoc && customerDoc.attend_date){
            can_check_out = true
          }

          if (attend.check_status == "check_in" && can_check_in) {
            $request_service.findMany({where : {'customer.id' :customerCb.id }} , (err , docs)=>{
              $attend_subscribers.add({
                image_url: '/images/attend_subscribers.png',
                customer: customerCb,
                active: true,
                attend_date: new Date(attend.date),
                attend: attend_time,
                company: customerCb.company,
                branch: customerCb.branch,
                service_list : docs
              })
            })
           

          } else if (attend.check_status == "check_out" && can_check_out) {

            let leave_time = {
              hour: new Date(attend.date).getHours(),
              minute: new Date(attend.date).getMinutes()
            }
            customerDoc.leave_date = new Date(attend.date)
            customerDoc.leave = leave_time
            $attend_subscribers.update(customerDoc)

          }

        
      })
    })

  })

  site.get({
    name: 'images',
    path: __dirname + '/site_files/images/'
  })

  site.get({
    name: "attend_subscribers",
    path: __dirname + "/site_files/html/index.html",
    parser: "html",
    compress: true
  })

  site.post("/api/attend_subscribers/add", (req, res) => {
    let response = {
      done: false
    }
    if (!req.session.user) {
      response.error = 'Please Login First'
      res.json(response)
      return
    }

    let attend_subscribers_doc = req.body
    attend_subscribers_doc.$req = req
    attend_subscribers_doc.$res = res

    attend_subscribers_doc.add_user_info = site.security.getUserFinger({
      $req: req,
      $res: res
    })

    if (typeof attend_subscribers_doc.active === 'undefined') {
      attend_subscribers_doc.active = true
    }

    attend_subscribers_doc.company = site.get_company(req)
    attend_subscribers_doc.branch = site.get_branch(req)

    $attend_subscribers.add(attend_subscribers_doc, (err, doc) => {
      if (!err) {
        response.done = true
        response.doc = doc
      } else {
        response.error = err.message
      }
      res.json(response)
    })

  })

  site.post("/api/attend_subscribers/update", (req, res) => {
    let response = {
      done: false
    }

    if (!req.session.user) {
      response.error = 'Please Login First'
      res.json(response)
      return
    }

    let attend_subscribers_doc = req.body

    attend_subscribers_doc.edit_user_info = site.security.getUserFinger({
      $req: req,
      $res: res
    })

    if (attend_subscribers_doc.id) {
      $attend_subscribers.edit({
        where: {
          id: attend_subscribers_doc.id
        },
        set: attend_subscribers_doc,
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

  site.post("/api/attend_subscribers/view", (req, res) => {
    let response = {
      done: false
    }

    if (!req.session.user) {
      response.error = 'Please Login First'
      res.json(response)
      return
    }

    $attend_subscribers.findOne({
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

  site.post("/api/attend_subscribers/delete", (req, res) => {
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
      $attend_subscribers.delete({
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

  site.post("/api/attend_subscribers/all", (req, res) => {

    let response = {
      done: false
    }

    let where = req.body.where || {}

    if (where['name_ar']) {
      where['customer.name_ar'] = new RegExp(where['name_ar'], "i");
    }

    if (where.attend_date_to && where.attend_date_from) {
      let d1 = site.toDate(where.attend_date_from)
      let d2 = site.toDate(where.attend_date_to)
      d2.setDate(d2.getDate() + 1);
      where.attend_date = {
        '$gte': d1,
        '$lt': d2
      }
      delete where.attend_date_from
      delete where.attend_date_to
    }

    if (where.leave_date_to && where.leave_date_from) {
      let d1 = site.toDate(where.leave_date_from)
      let d2 = site.toDate(where.leave_date_to)
      d2.setDate(d2.getDate() + 1);
      where.leave_date = {
        '$gte': d1,
        '$lt': d2
      }
      delete where.leave_date_from
      delete where.leave_date_to
    }

    if (where.attend_date) {
      let d1 = site.toDate(where.attend_date)
      let d2 = site.toDate(where.attend_date)
      d2.setDate(d2.getDate() + 1)
      where.attend_date = {
        '$gte': d1,
        '$lt': d2
      }
    }

    if (where.leave_date) {
      let d1 = site.toDate(where.leave_date)
      let d2 = site.toDate(where.leave_date)
      d2.setDate(d2.getDate() + 1)
      where.leave_date = {
        '$gte': d1,
        '$lt': d2
      }
    }


    if (where.search && where.search.current) {

      where['current'] = where.search.current
    }
    delete where.search

    where['company.id'] = site.get_company(req).id
    where['branch.code'] = site.get_branch(req).code

    $attend_subscribers.findMany({
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