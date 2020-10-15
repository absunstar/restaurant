module.exports = function init(site) {

  const $stores_offer = site.connectCollection("stores_offer")

  site.on('[stores_items][item_name][change]', objectStock => {

    let barcode = objectStock.sizes_list.map(_obj => _obj.barcode)

    $stores_offer.findMany({ 'company.id': objectStock.company.id, 'items.barcode': barcode }, (err, doc) => {
      doc.forEach(_doc => {
        if (_doc.items) _doc.items.forEach(_items => {
          if (objectStock.sizes_list) objectStock.sizes_list.forEach(_size => {
            if (_items.barcode == _size.barcode) {
              _items.size = _size.size
              _items.size_en = _size.size_en
              _items.name = _size.name
            }
          })
        });
        $stores_offer.update(_doc);
      });
    });
  });


  site.get({
    name: "stores_offer",
    path: __dirname + "/site_files/html/index.html",
    parser: "html",
    compress: false
  })

  site.get({
    name: 'images',
    path: __dirname + '/site_files/images/'
  })


  function addZero(code, number) {
    let c = number - code.toString().length
    for (let i = 0; i < c; i++) {
      code = '0' + code.toString()
    }
    return code
  }

  $stores_offer.newCode = function () {

    let y = new Date().getFullYear().toString().substr(2, 2)
    let m = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'][new Date().getMonth()].toString()
    let d = new Date().getDate()
    let lastCode = site.storage('ticket_last_code') || 0
    let lastMonth = site.storage('ticket_last_month') || m
    if (lastMonth != m) {
      lastMonth = m
      lastCode = 0
    }
    lastCode++
    site.storage('ticket_last_code', lastCode)
    site.storage('ticket_last_month', lastMonth)
    return y + lastMonth + addZero(d, 2) + addZero(lastCode, 4)
  }

  site.post("/api/stores_offer/add", (req, res) => {
    let response = {}
    response.done = false
    if (!req.session.user) {
      response.error = 'Please Login First'
      res.json(response)
      return
    }

    let stores_offer_doc = req.body

    stores_offer_doc.company = site.get_company(req)
    stores_offer_doc.branch = site.get_branch(req)
    stores_offer_doc.code = $stores_offer.newCode();
    stores_offer_doc.add_user_info = site.security.getUserFinger({ $req: req, $res: res })

    stores_offer_doc.$req = req
    stores_offer_doc.$res = res


    if (stores_offer_doc.items && stores_offer_doc.items.length > 0)
      stores_offer_doc.items.forEach(_item => {
        if (_item.size_units_list && _item.size_units_list.length > 0)
          _item.size_units_list.forEach(_itmUnit => {
            _itmUnit.discount.max = _itmUnit.discount.value
          });
      });


    // stores_offer_doc.items.forEach(itm => {
    //   itm.current_count = site.toNumber(itm.current_count)
    //   itm.count = site.toNumber(itm.count)
    //   itm.cost = site.toNumber(itm.cost)
    //   itm.price = site.toNumber(itm.price)
    //   itm.total = site.toNumber(itm.total)
    // })

    // stores_offer_doc.total_value = site.toNumber(stores_offer_doc.total_value)
    // stores_offer_doc.net_value = site.toNumber(stores_offer_doc.net_value)

    $stores_offer.add(stores_offer_doc, (err, doc) => {

      if (!err) {

        response.done = true
        response.doc = doc

      } else {
        response.error = err.message
      }
      res.json(response)
    })
  })

  site.post("/api/stores_offer/update", (req, res) => {
    let response = {}
    response.done = false
    if (!req.session.user) {
      response.error = 'Please Login First'
      res.json(response)
      return
    }
    let stores_offer_doc = req.body
    stores_offer_doc.edit_user_info = site.security.getUserFinger({ $req: req, $res: res })

    if (stores_offer_doc.items && stores_offer_doc.items.length > 0)
      stores_offer_doc.items.forEach(_item => {
        if (_item.size_units_list && _item.size_units_list.length > 0)
          _item.size_units_list.forEach(_itmUnit => {
            _itmUnit.discount.max = _itmUnit.discount.value
          });
      });

    if (stores_offer_doc._id) {
      $stores_offer.edit({
        where: {
          _id: stores_offer_doc._id
        },
        set: stores_offer_doc,
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
      res.json(response)
    }
  })

  site.post("/api/stores_offer/delete", (req, res) => {
    let response = {}
    response.done = false
    if (!req.session.user) {
      response.error = 'Please Login First'
      res.json(response)
      return
    }
    let stores_offer_doc = req.body
    if (stores_offer_doc._id) {
      $stores_offer.delete({
        where: {
          _id: stores_offer_doc._id
        },
        $req: req,
        $res: res
      }, (err, result) => {
        if (!err) {
          response.done = true
          res.json(response)
        }
      })
    } else res.json(response)
  })

  site.post("/api/stores_offer/view", (req, res) => {
    let response = {}
    response.done = false
    $stores_offer.findOne({
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


  site.post("/api/stores_offer/all", (req, res) => {
    let response = {}
    response.done = false

    if (!req.session.user) {
      response.error = 'Please Login First'
      res.json(response)
      return
    }

    let where = req.body.where || {}

    let search = req.body.search

    if (search) {
      where.$or = []

      where.$or.push({
        'vendor.name': site.get_RegExp(search, "i")
      })

      where.$or.push({
        'vendor.mobile': site.get_RegExp(search, "i")
      })

      where.$or.push({
        'vendor.phone': site.get_RegExp(search, "i")
      })

      where.$or.push({
        'vendor.national_id': site.get_RegExp(search, "i")
      })

      where.$or.push({
        'vendor.email': site.get_RegExp(search, "i")
      })

      where.$or.push({
        'store.name': site.get_RegExp(search, "i")
      })

      where.$or.push({
        'store.number': site.get_RegExp(search, "i")
      })

      where.$or.push({
        'store.payment_method.ar': site.get_RegExp(search, "i")
      })

      where.$or.push({
        'store.payment_method.en': site.get_RegExp(search, "i")
      })

    }

    where['company.id'] = site.get_company(req).id
    where['branch.code'] = site.get_branch(req).code


    if (where && where['notes']) {
      where['notes'] = site.get_RegExp(where['notes'], 'i')
    }

    if (where && where['number']) {
      where['number'] = site.get_RegExp(where['number'], 'i')
    }

    if (where && where['supply_number']) {
      where['supply_number'] = site.get_RegExp(where['supply_number'], 'i')
    }


    if (where.startup_date) {
      let d1 = site.toDate(where.startup_date)
      let d2 = site.toDate(where.startup_date)
      d2.setDate(d2.getDate() + 1)
      where.startup_date = {
        '$gte': d1,
        '$lte': d2
      }
    } else if (where && where.startup_date) {
      let d1 = site.toDate(where.startup_date)
      let d2 = site.toDate(where.deadline_date)
      d2.setDate(d2.getDate() + 1);
      where.startup_date = {
        '$gte': d1,
        '$lte': d2
      }
      delete where.date_from
      delete where.deadline_date
    }


    if (where['shift_code']) {
      where['shift.code'] = where['shift_code']
      delete where['shift_code']
    }

    if (where['employee']) {
      where['employee.id'] = where['employee'].id;
      delete where['employee']
    }

    if (where['type']) {
      where['type.id'] = where['type'].id;
      delete where['type']
    }

    if (where['source']) {
      where['source.id'] = where['source'].id;
      delete where['source']
    }

    if (where['description']) {
      where['description'] = site.get_RegExp(where['description'], 'i')
    }

    delete where.search
    $stores_offer.findMany({
      select: req.body.select || {},
      limit: req.body.limit,
      where: where,
      sort: { id: -1 }
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

  site.post("/api/stores_offer/offer_active", (req, res) => {
    let response = {}
    response.done = false

    if (!req.session.user) {
      response.error = 'Please Login First'
      res.json(response)
      return
    }

    let where = req.body.where || {}

    let barcode = where['barcode']

    if (where.date) {
      let d1 = site.toDate(where.date)
      let d2 = site.toDate(where.date)
      d2.setDate(d2.getDate() + 1)
      where.startup_date = {
        '$lte': d2
      }

      where.deadline_date = {
        '$gte': d1,
      }
      delete where['date']

    }

    if (where['barcode']) {
      where['items.barcode'] = where['barcode']
      delete where['barcode']
    }

    where['active'] = true


    $stores_offer.findOne({
      where: where,
      sort: { id: -1 }
    }, (err, doc) => {
      if (!err && doc) {

        response.done = true
        let item = {}
        doc.items.forEach(_itm => {

          if (_itm.barcode == barcode)item = _itm 
        });

        response.doc = item
      } else {
        response.error = err
      }
      res.json(response)
    })
  })

}