module.exports = function init(site) {

 
  const $discount_types = site.connectCollection("discount_types")
  site.words.addList(__dirname + '/site_files/json/words.json')

  $discount_types.deleteDuplicate({
    name: 1,
    value: 1,
    type: 1
  }, (err, result) => {
    $discount_types.createUnique({
      name: 1,
      value: 1,
      type: 1
    }, (err, result) => {

    })
  })

  site.on('[company][created]', doc => {

    $goves.add({
      name: "خصم إفتراضي",
      image_url: '/images/gov.png',
      value : 1,
      type : 'number',
      company: {
        id: doc.id,
        name_ar: doc.name_ar
      },
      branch: {
        code: doc.branch_list[0].code,
        name_ar: doc.branch_list[0].name_ar
      },
      active: true
    }, (err, doc) => {
      site.call('[register][city][add]', doc)

    })
  })


  site.get({
    name: "discount_types",
    path: __dirname + "/site_files/html/index.html",
    parser: "html",
    compress: false
  })


  site.on('[company][created]', doc => {

    $discount_types.add({
      name: "خصم إفتراضي",
      value : 0,
      image_url: '/images/discount_type.png',
      company: {
        id: doc.id,
        name_ar: doc.name_ar
      },
      branch: {
        code: doc.branch_list[0].code,
        name_ar: doc.branch_list[0].name_ar
      },
      active: true
    }, (err, doc) => {})
  })


  site.post("/api/discount_types/add", (req, res) => {
    let response = {}
    response.done = false
    if (req.session.user === undefined) {
      res.json(response)
    }
    let discount_types_doc = req.body
    discount_types_doc.$req = req
    discount_types_doc.$res = res

    discount_types_doc.company = site.get_company(req)
    discount_types_doc.branch = site.get_branch(req)

    discount_types_doc.add_user_info = site.security.getUserFinger({$req : req , $res : res})


    $discount_types.add(discount_types_doc, (err, _id) => {
      if (!err) {
        response.done = true
      }
      res.json(response)
    })
  })

  site.post("/api/discount_types/update", (req, res) => {
    let response = {}
    response.done = false
    if (req.session.user === undefined) {
      res.json(response)
    }
    let discount_types_doc = req.body

    discount_types_doc.edit_user_info = site.security.getUserFinger({$req : req , $res : res})


    if (discount_types_doc._id) {
      $discount_types.edit({
        where: {
          _id: discount_types_doc._id
        },
        set: discount_types_doc,
        $req: req,
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

  site.post("/api/discount_types/delete", (req, res) => {
    let response = {}
    response.done = false
    if (req.session.user === undefined) {
      res.json(response)
    }
    let _id = req.body._id


    if (_id) {
      $discount_types.delete({ _id: $discount_types.ObjectID(_id), $req: req, $res: res }, (err, result) => {
        if (!err) {
          response.done = true
        }
        res.json(response)
      })
    } else {
      res.json(response)
    }
  })

  site.post("/api/discount_types/view", (req, res) => {
    let response = {}
    response.done = false
    $discount_types.findOne({
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

  site.post("/api/discount_types/all", (req, res) => {

    let response = {}
    response.done = false
    let where = req.data.where || {}

    where['company.id'] = site.get_company(req).id
    where['branch.code'] = site.get_branch(req).code

    $discount_types.findMany({
      select: req.body.select || {},
      where: where
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