module.exports = function init(site) {
  const $stores_items = site.connectCollection("stores_items")

  balance_list = []
  site.on('[transfer_branch][stores_items][add_balance]', obj => {
    balance_list.push(Object.assign({}, obj))
  })

  function balance_handle(obj) {
    if (obj == null) {
      if (balance_list.length > 0) {
        obj = balance_list[0]
        balance_handle(obj)

        balance_list.splice(0, 1)
      } else {
        setTimeout(() => {
          balance_handle(null)
        }, 1000);
      }
      return
    }

    let total_unit = obj.count * obj.unit.convert;
    let totalCost = obj.cost * site.toNumber(obj.count);

    let obj_branch = {
      name_ar: obj.branch.name_ar,
      code: obj.branch.code,
      start_count: obj.source_type && obj.source_type.id == 3 ? site.toNumber(total_unit) : 0,
      current_count: site.toNumber(total_unit),
      total_buy_price: totalCost,
      total_buy_count: site.toNumber(total_unit),
      average_cost: site.toNumber(totalCost) / site.toNumber(total_unit),
      size_units_list: [{
        id: obj.unit.id,
        name: obj.unit.name,
        barcode: obj.unit.barcode,
        current_count: obj.count,
        start_count: obj.source_type && obj.source_type.id == 3 ? site.toNumber(obj.count) : 0,
        total_buy_price: totalCost,
        total_buy_count: site.toNumber(obj.count),
        average_cost: site.toNumber(totalCost) / site.toNumber(obj.count)
      }],
      stores_list: [{
        store: obj.store,
        start_count: obj.source_type && obj.source_type.id == 3 ? site.toNumber(total_unit) : 0,
        current_count: site.toNumber(total_unit),
        total_buy_price: totalCost,
        size_units_list: [{
          id: obj.unit.id,
          name: obj.unit.name,
          barcode: obj.unit.barcode,
          current_count: obj.count,
          start_count: obj.source_type && obj.source_type.id == 3 ? site.toNumber(obj.count) : 0,
          total_buy_price: totalCost,
          total_buy_count: site.toNumber(obj.count),
          average_cost: site.toNumber(totalCost) / site.toNumber(obj.count)
        }],
        total_buy_count: site.toNumber(total_unit),
        average_cost: site.toNumber(totalCost) / site.toNumber(total_unit)
      }]
    }

    let obj_store = {
      store: obj.store,
      start_count: obj.source_type && obj.source_type.id == 3 ? site.toNumber(total_unit) : 0,
      current_count: site.toNumber(total_unit),

      size_units_list: [{
        id: obj.unit.id,
        name: obj.unit.name,
        barcode: obj.unit.barcode,
        current_count: obj.count,
        start_count: obj.source_type && obj.source_type.id == 3 ? site.toNumber(obj.count) : 0,
        total_buy_price: totalCost,
        total_buy_count: site.toNumber(obj.count),
        average_cost: site.toNumber(totalCost) / site.toNumber(obj.count)
      }],
      total_buy_price: totalCost,
      total_buy_count: site.toNumber(total_unit),
      average_cost: site.toNumber(totalCost) / site.toNumber(total_unit)
    }

    $stores_items.findOne({
      name: obj.name,
      'sizes.barcode': obj.barcode,
      'company.id': obj.company.id
    }, (err, doc) => {

      if (!err && doc) {
        doc.sizes.forEach(_size => {
          if (_size.barcode == obj.barcode) {

            let totalPrice = obj.price * site.toNumber(obj.count);
            let total_complex_av = 0

            if (_size.item_complex) {
              _size.complex_items.map(_complex => total_complex_av += (_complex.unit.average_cost * _complex.count));

              if (_size.value_add) {
                if (_size.value_add.type == 'percent')
                  total_complex_av = total_complex_av + ((site.toNumber(_size.value_add.value) * total_complex_av) / 100)
                else total_complex_av = total_complex_av + site.toNumber(_size.value_add.value)
              }
            }
            total_complex_av = site.toNumber(total_complex_av)

            if (obj.source_type && obj.source_type.id == 3) {
              if (obj.type == 'sum')
                _size.start_count = site.toNumber(_size.start_count || 0) + site.toNumber(total_unit)
              else if (obj.type == 'minus')
                _size.start_count = site.toNumber(_size.start_count || 0) - site.toNumber(total_unit)
            }

            if (obj.type == 'sum') {
              _size.current_count = site.toNumber(_size.current_count || 0) + site.toNumber(total_unit)
              _size.total_buy_price = (_size.total_buy_price || 0) + totalCost
              _size.total_buy_count = (_size.total_buy_count || 0) + site.toNumber(total_unit)

            } else if (obj.type == 'minus') {
              _size.current_count = site.toNumber(_size.current_count) - site.toNumber(total_unit)
              _size.total_sell_price = (_size.total_sell_price || 0) + totalPrice
              _size.total_sell_count = (_size.total_sell_count || 0) + site.toNumber(total_unit)

              if (obj.source_type && (obj.source_type.id == 4 || obj.source_type.id == 1) && obj.store_in) {
                _size.total_buy_price = (_size.total_buy_price || 0) - totalCost
                _size.total_buy_count = (_size.total_buy_count || 0) - site.toNumber(total_unit)
              }
            }

            if (obj.source_type && (obj.source_type.id == 1 || obj.source_type.id == 4) && obj.store_in)
              _size.average_cost = site.toNumber(_size.total_buy_price) / site.toNumber(_size.total_buy_count)
            else if (obj.assemble) _size.average_cost = total_complex_av

            _size.average_cost = site.toNumber(_size.average_cost)

            _size.size_units_list.forEach(_units => {
              if (obj.unit && _units.id == obj.unit.id) {
                if (obj.type == 'sum') {
                  _units.current_count = (_units.current_count || 0) + obj.count
                  if (obj.source_type && obj.source_type.id == 3) _units.start_count = site.toNumber(_units.start_count || 0) + site.toNumber(obj.count)
                  _units.total_buy_price = (_units.total_buy_price || 0) + totalCost
                  _units.total_buy_count = (_units.total_buy_count || 0) + site.toNumber(obj.count)

                } else if (obj.type == 'minus') {
                  _units.current_count = (_units.current_count || 0) - obj.count
                  if (obj.source_type && obj.source_type.id == 3) _units.start_count = site.toNumber(_units.start_count || 0) - site.toNumber(obj.count)
                  _units.total_sell_price = (_units.total_sell_price || 0) + totalPrice
                  _units.total_sell_count = (_units.total_sell_count || 0) + site.toNumber(obj.count)

                  if (obj.source_type && (obj.source_type.id == 4 || obj.source_type.id == 1) && obj.store_in) {
                    _units.total_buy_price = (_units.total_buy_price || 0) - totalCost
                    _units.total_buy_count = (_units.total_buy_count || 0) - site.toNumber(obj.count)
                  }
                }

                if (obj.source_type && (obj.source_type.id == 1 || obj.source_type.id == 4) && obj.store_in)
                  _units.average_cost = site.toNumber(_units.total_buy_price) / site.toNumber(_units.total_buy_count)
                else if (obj.assemble) _units.average_cost = total_complex_av

                _units.average_cost = site.toNumber(_units.average_cost)

                _units.cost = site.toNumber(obj.cost)
                _units.price = site.toNumber(obj.price)

                if (obj.source_type && (obj.source_type.id == 1 || obj.source_type.id == 4) && obj.store_in)
                  $stores_items.findMany({
                    where: {
                      'sizes.complex_items.barcode': obj.barcode,
                      'sizes.complex_items.name': obj.name,
                      'company.id': obj.company.id
                    },
                  }, (err, comolex_docs) => {
                    if (comolex_docs && comolex_docs.length > 0)
                      comolex_docs.forEach(_complexDoc => {
                        if (_complexDoc.sizes && _complexDoc.sizes.length > 0)
                          _complexDoc.sizes.forEach(_complexSize => {
                            if (_complexSize.complex_items && _complexSize.complex_items.length > 0)
                              _complexSize.complex_items.forEach(_complexItem => {
                                if (_complexItem.barcode == obj.barcode && _complexItem.unit.id == obj.unit.id)
                                  _complexItem.unit.average_cost = _units.average_cost
                              });
                          });
                        $stores_items.update(_complexDoc, () => { });
                      });
                  })
              }
            });

            if (_size.branches_list && _size.branches_list.length > 0) {

              let foundBranch = false
              let indxBranch = 0
              _size.branches_list.map((b, i) => {
                if (b.code == obj.branch.code) {
                  foundBranch = true
                  indxBranch = i
                }
              });
              let _branch = _size.branches_list[indxBranch]

              let foundStore = false
              let indxStore = 0
              _branch.stores_list.map((s, i) => {
                if (s.store.id == obj.store.id) {
                  foundStore = true
                  indxStore = i
                }
              });
              _branch._store = _branch.stores_list[indxStore]

              if (foundBranch) {
                let unit_branch = false;

                _branch.size_units_list.forEach(_units => {
                  if (obj.unit && _units.id == obj.unit.id) {
                    if (obj.type == 'sum') {

                      if (obj.source_type && obj.source_type.id == 3) _units.start_count = site.toNumber(_units.start_count || 0) + site.toNumber(obj.count)

                      _units.current_count = (_units.current_count || 0) + obj.count
                      _units.total_buy_price = (_units.total_buy_price || 0) + totalCost
                      _units.total_buy_count = (_units.total_buy_count || 0) + site.toNumber(obj.count)

                    } else if (obj.type == 'minus') {
                      if (obj.source_type && obj.source_type.id == 3) _units.start_count = site.toNumber(_units.start_count || 0) - site.toNumber(obj.count)

                      _units.current_count = (_units.current_count || 0) - obj.count
                      _units.total_sell_price = (_units.total_sell_price || 0) + totalPrice
                      _units.total_sell_count = (_units.total_sell_count || 0) + site.toNumber(obj.count)

                      if (obj.source_type && (obj.source_type.id == 4 || obj.source_type.id == 1) && obj.store_in) {
                        _units.total_buy_price = (_units.total_buy_price || 0) - totalCost
                        _units.total_buy_count = (_units.total_buy_count || 0) - site.toNumber(obj.count)
                      }
                    }

                    if (obj.source_type && (obj.source_type.id == 1 || obj.source_type.id == 4) && obj.store_in)
                      _units.average_cost = site.toNumber(_units.total_buy_price) / site.toNumber(_units.total_buy_count)
                    else if (obj.assemble) _units.average_cost = total_complex_av

                    _units.average_cost = site.toNumber(_units.average_cost)

                    unit_branch = true
                  }
                });
                if (!unit_branch) {

                  _branch.size_units_list.push({
                    id: obj.unit.id,
                    name: obj.unit.name,
                    barcode: obj.unit.barcode,
                    current_count: obj.count,
                    start_count: obj.source_type && obj.source_type.id == 3 ? site.toNumber(obj.count) : 0,
                    total_buy_price: totalCost,
                    total_buy_count: site.toNumber(obj.count),
                    average_cost: site.toNumber(totalCost) / site.toNumber(obj.count)
                  })

                }

                if (obj.type == 'sum') {
                  if (obj.source_type && obj.source_type.id == 3) _branch.start_count = (_branch.start_count || 0) + site.toNumber(total_unit)
                  _branch.current_count = _branch.current_count + site.toNumber(total_unit)
                  _branch.total_buy_price = (_branch.total_buy_price || 0) + totalCost
                  _branch.total_buy_count = (_branch.total_buy_count || 0) + site.toNumber(total_unit)
                }

                if (obj.type == 'minus') {
                  if (obj.source_type && obj.source_type.id == 3) _branch.start_count = (_branch.start_count || 0) - site.toNumber(total_unit)

                  _branch.current_count = _branch.current_count - site.toNumber(total_unit)
                  _branch.total_sell_price = (_branch.total_sell_price || 0) + totalPrice
                  _branch.total_sell_count = (_branch.total_sell_count || 0) + site.toNumber(total_unit)

                  if (obj.source_type && (obj.source_type.id == 4 || obj.source_type.id == 1) && obj.store_in) {
                    _branch.total_buy_price = (_branch.total_buy_price || 0) - totalCost
                    _branch.total_buy_count = (_branch.total_buy_count || 0) - site.toNumber(total_unit)
                  }
                }

                if (obj.source_type && (obj.source_type.id == 1 || obj.source_type.id == 4) && obj.store_in) _branch.average_cost = site.toNumber(_branch.total_buy_price) / site.toNumber(_branch.total_buy_count)
                else if (obj.assemble) _branch.average_cost = total_complex_av

                _branch.average_cost = site.toNumber(_branch.average_cost)

                if (_branch.stores_list && _branch.stores_list.length > 0) {

                  if (foundStore) {
                    let unit_store = false
                    _branch._store.size_units_list.forEach(_units => {
                      if (obj.unit && _units.id == obj.unit.id) {
                        if (obj.type == 'sum') {
                          _units.current_count = (_units.current_count || 0) + obj.count
                          if (obj.source_type && obj.source_type.id == 3) _units.start_count = site.toNumber(_units.start_count || 0) + site.toNumber(obj.count)
                          _units.total_buy_price = (_units.total_buy_price || 0) + totalCost
                          _units.total_buy_count = (_units.total_buy_count || 0) + site.toNumber(obj.count)

                        } else if (obj.type == 'minus') {

                          _units.current_count = (_units.current_count || 0) - obj.count
                          if (obj.source_type && obj.source_type.id == 3) _units.start_count = site.toNumber(_units.start_count || 0) - site.toNumber(obj.count)
                          _units.total_sell_price = (_units.total_sell_price || 0) + totalPrice
                          _units.total_sell_count = (_units.total_sell_count || 0) + site.toNumber(obj.count)

                          if (obj.source_type && (obj.source_type.id == 4 || obj.source_type.id == 1) && obj.store_in) {
                            _units.total_buy_price = (_units.total_buy_price || 0) - totalCost
                            _units.total_buy_count = (_units.total_buy_count || 0) - site.toNumber(obj.count)
                          }
                        }

                        if (obj.source_type && (obj.source_type.id == 1 || obj.source_type.id == 4) && obj.store_in)
                          _units.average_cost = site.toNumber(_units.total_buy_price) / site.toNumber(_units.total_buy_count)
                        else if (obj.assemble) _units.average_cost = total_complex_av

                        _units.average_cost = site.toNumber(_units.average_cost)

                        unit_store = true
                      }
                    });

                    if (!unit_store) {

                      _branch._store.size_units_list.push({
                        id: obj.unit.id,
                        name: obj.unit.name,
                        barcode: obj.unit.barcode,
                        current_count: obj.count,
                        start_count: obj.source_type && obj.source_type.id == 3 ? site.toNumber(obj.count) : 0,
                        total_buy_price: totalCost,
                        total_buy_count: site.toNumber(obj.count),
                        average_cost: site.toNumber(totalCost) / site.toNumber(obj.count)
                      })

                    }


                    if (obj.type == 'sum') {
                      if (obj.source_type && obj.source_type.id == 3) _branch._store.start_count = site.toNumber(_branch._store.start_count || 0) + site.toNumber(total_unit)
                      _branch._store.current_count = site.toNumber(_branch._store.current_count || 0) + site.toNumber(total_unit)
                      _branch._store.total_buy_price = (_branch._store.total_buy_price || 0) + totalCost
                      _branch._store.total_buy_count = (_branch._store.total_buy_count || 0) + site.toNumber(total_unit)
                    }

                    if (obj.type == 'minus') {
                      if (obj.source_type && obj.source_type.id == 3) _branch._store.start_count = site.toNumber(_branch._store.start_count || 0) - site.toNumber(total_unit)
                      _branch._store.current_count = site.toNumber(_branch._store.current_count || 0) - site.toNumber(total_unit)
                      _branch._store.total_sell_price = (_branch._store.total_sell_price || 0) + totalCost
                      _branch._store.total_sell_count = (_branch._store.total_sell_count || 0) + site.toNumber(total_unit)

                      if (obj.source_type && (obj.source_type.id == 4 || obj.source_type.id == 1) && obj.store_in) {
                        _branch._store.total_buy_price = (_branch._store.total_buy_price || 0) - totalCost
                        _branch._store.total_buy_count = (_branch._store.total_buy_count || 0) - site.toNumber(total_unit)
                      }
                    }

                    if (obj.source_type && (obj.source_type.id == 1 || obj.source_type.id == 4) && obj.store_in) _branch._store.average_cost = site.toNumber(_branch._store.total_buy_price) / site.toNumber(_branch._store.total_buy_count)
                    else if (obj.assemble) _branch._store.average_cost = total_complex_av

                    _branch._store.average_cost = site.toNumber(_branch._store.average_cost)

                  } else _branch.stores_list.push(obj_store)


                } else _branch.stores_list = [obj_store]

                _size.branches_list[indxBranch] = _branch

              } else _size.branches_list.push(obj_branch)


            } else _size.branches_list = [obj_branch]
          }

          // if (_size.item_complex) {
          //   _size.complex_items.forEach(_complex_item => {
          //     _complex_item.count = _complex_item.count * obj.count
          //     site.call('[transfer_branch][stores_items][add_balance]', Object.assign({}, _complex_item))
          //   })
          // }
        });

        $stores_items.update(doc, () => {
          balance_handle(null)
        });

      } else {
        if (obj.source_type)
          delete obj.source_type.id
        let item = {
          name: obj.name,
          main_unit: obj.unit,
          units_list: [{
            id: obj.unit.id,
            name: obj.unit.name,
            convert: 1
          }],
          company: obj.company,
          branch: obj.branch,
          sizes: [obj_branch]
        };

        $stores_items.add(item, () => {
          balance_handle(null)
        });
      };
    })
  }

  balance_handle(null)






  site.get({
    name: "stores_items",
    path: __dirname + "/site_files/html/index.html",
    parser: "html",
    compress: true
  })

  site.post("/api/stores_items/add", (req, res) => {
    let response = {}
    response.done = false
    if (!req.session.user) {
      res.json(response)
      return
    }

    let stores_items_doc = req.body
    stores_items_doc.$req = req
    stores_items_doc.$res = res

    stores_items_doc.company = site.get_company(req)
    stores_items_doc.branch = site.get_branch(req)

    stores_items_doc.add_user_info = site.security.getUserFinger({
      $req: req,
      $res: res
    })

    stores_items_doc.sizes.forEach(_size => {
      _size.size_units_list.forEach(_size_unit => {
        let indx = stores_items_doc.units_list.findIndex(_unit1 => _unit1.id == _size_unit.id);
        _size_unit.convert = stores_items_doc.units_list[indx].convert

        if (!_size_unit.average_cost)
          _size_unit.average_cost = _size_unit.cost

        _size_unit.current_count = 0
        _size_unit.start_count = 0
      });
    });

    $stores_items.add(stores_items_doc, (err, doc) => {
      if (!err) {
        response.done = true

        let foundBarcode = doc.sizes.every(_size => !_size.barcode)
        if (foundBarcode) {
          let y = new Date().getFullYear().toString()
          stores_items_doc.sizes.forEach((_size, i) => {
            if (!_size.barcode || _size.barcode == '')
              _size.barcode = doc.id + doc.company.id + doc.branch.code + y + (Math.floor(Math.random() * 100) + i)

            _size.size_units_list.forEach(_unit => {
              if (!_unit.barcode || _unit.barcode == '') {

                _unit.barcode = doc.id + doc.company.id + doc.branch.code + _unit.id + i + (Math.floor(Math.random() * 100) + i)
              }
            });

          });

          $stores_items.update(doc)
        }
      } else response.error = err.message
      res.json(response)
    })
  })



  site.post("/api/stores_items/update", (req, res) => {
    let response = {};
    response.done = false

    if (req.session.user === undefined) res.json(response)

    let stores_items_doc = req.body;

    stores_items_doc.edit_user_info = site.security.getUserFinger({
      $req: req,
      $res: res
    });

    let y = new Date().getFullYear().toString()
    stores_items_doc.sizes.forEach((_size, i) => {
      if (!_size.barcode || _size.barcode == '')
        _size.barcode = stores_items_doc.id + stores_items_doc.company.id + stores_items_doc.branch.code + y + (Math.floor(Math.random() * 100) + i)

      _size.size_units_list.forEach((_size_unit, _i) => {
        let indx = stores_items_doc.units_list.findIndex(_unit1 => _unit1.id == _size_unit.id);
        _size_unit.convert = stores_items_doc.units_list[indx].convert

        if (!_size_unit.average_cost)
          _size_unit.average_cost = _size_unit.cost

        if (!_size_unit.barcode || _size_unit.barcode == '')
          _size_unit.barcode = stores_items_doc.id + stores_items_doc.company.id + stores_items_doc.branch.code + _size_unit.id + (Math.floor(Math.random() * 100) + _i)
      });

    });


    if (stores_items_doc._id) {
      $stores_items.edit({
        where: {
          _id: stores_items_doc._id
        },
        set: stores_items_doc,
        $req: req,
        $req: req,
        $res: res
      }, (err, item_doc) => {
        if (!err) {
          response.done = true
          let obj = { sizes_list: [] }
          let exist = false

          obj.company = item_doc.doc.company

          item_doc.doc.sizes.forEach(size => {

            let found = item_doc.old_doc.sizes.some(old_size => size.size == old_size.size)

            if (!found) {
              obj.sizes_list.push({ size: size.size, barcode: size.barcode })
              exist = true
            }
          });

          if (exist) site.call('[stores_items][item_name][change]', obj)
        }
        else response.error = err.message
        res.json(response)
      });
    } else res.json(response);
  });

  site.post("/api/stores_items/delete", (req, res) => {
    let response = {}
    response.done = false
    if (req.session.user === undefined) {
      res.json(response)
    }
    let id = req.body.id

    let barcodes = req.body.category_item.sizes.map(_size => _size.barcode)

    let data = { name: 'stores_item', barcodes, company_id: req.body.category_item.company.id }

    site.getItemToDelete(data, callback => {

      if (callback == true) {
        response.error = 'Cant Delete Its Exist In Other Transaction'
        res.json(response)

      } else {
        if (id) {
          $stores_items.delete({
            id: id,
            $req: req,
            $res: res
          }, (err, result) => {
            if (!err) {
              response.done = true
            }
            res.json(response)
          })
        } else {
          res.json(response)
        }
      }
    })
  })

  site.post("/api/stores_items/view", (req, res) => {
    let response = {}
    response.done = false
    $stores_items.findOne({
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

  site.post("/api/stores_items/all", (req, res) => {

    let response = {}
    let where = req.body.where || {}
    let data = {};

    where['company.id'] = site.get_company(req).id

    if (where && where['name']) {
      where['name'] = new RegExp(where['name'], 'i')
    }

    if (req.body.search) {
      where = {
        $or: [
          { 'sizes.size': req.body.search },
          { 'sizes.size_units_list.barcode': req.body.search },
          { 'sizes.barcode': req.body.search }
        ]
      }
    }

    if (where && where['size']) {
      where['sizes.size'] = new RegExp(where['size'], 'i')
      delete where['size']
    }

    if (where && where['barcode']) {
      where['sizes.barcode'] = new RegExp(where['barcode'], 'i')
      delete where['barcode']
    }

    if (where['item_group']) {
      where['item_group.id'] = where['item_group'].id;
      delete where['item_group']
    }

    if (where && where.price) {
      where['sizes.price'] = site.toNumber(where.price)
      delete where.price
    }

    if (where && where.cost) {
      where['sizes.cost'] = site.toNumber(where.cost)
      delete where.cost
    }

    if (where && where.current_countLt && where.current_countGt) {
      data.current_countLt = site.toNumber(where.current_countLt)
      data.current_countGt = site.toNumber(where.current_countGt)
      where['sizes.current_count'] = {
        $lte: where.current_countLt,
        $gte: where.current_countGt
      }
      delete where.current_countLt
      delete where.current_countGt
    }


    if (where && where.current_countGt && !where.current_countLt) {
      data.current_countGt = site.toNumber(where.current_countGt)
      where['sizes.current_count'] = {
        $gte: where.current_countGt
      }

      delete where.current_countGt
    }

    if (where && where.current_count) {
      data.current_count = site.toNumber(where.current_count)
      where['sizes.current_count'] = where.current_count
      delete where.current_count
    }

    if (where && where.current_countLt && !where.current_countGt) {
      data.current_countLt = site.toNumber(where.current_countLt)
      where['sizes.current_count'] = {
        $lte: where.current_countLt
      }
      delete where.current_countLt
    }

    response.done = false
    $stores_items.findMany({
      select: req.body.select,
      limit: req.body.limit,
      where: where,
      sort: {
        id: -1
      }

    }, (err, docs, count) => {
      if (!err) {
        response.done = true

        /*         if (data.size) {
                  docs.forEach(doc => {
                    doc.sizes.forEach((s, i) => {
                      if (s.size !== data.size) {
                        doc.sizes.splice(i, 1)
                      }
                    })
                    doc.sizes.forEach((s, i) => {
                      if (s.size !== data.size) {
                        doc.sizes.splice(i, 1)
                      }
                    })
                  })
                }
        
                if (data.price) {
                  docs.forEach(doc => {
                    doc.sizes.forEach((p, i) => {
                      if (p.price !== data.price) {
                        doc.sizes.splice(i, 1)
                      }
                    })
                    doc.sizes.forEach((p, i) => {
                      if (p.price !== data.price) {
                        doc.sizes.splice(i, 1)
                      }
                    })
                  })
                }
        
                if (data.cost) {
                  docs.forEach(doc => {
                    doc.sizes.forEach((c, i) => {
                      if (c.cost !== data.cost) {
                        doc.sizes.splice(i, 1)
                      }
                    })
                    doc.sizes.forEach((c, i) => {
                      if (c.cost !== data.cost) {
                        doc.sizes.splice(i, 1)
                      }
                    })
                  })
                }
        
                if (data.current_count) {
                  docs.forEach(doc => {
                    doc.sizes.forEach((c, i) => {
                      if (c.current_count < data.current_count) {
                        doc.sizes.splice(i, 1)
                      }
                    })
                    doc.sizes.forEach((c, i) => {
                      if (c.current_count !== data.current_count) {
                        doc.sizes.splice(i, 1)
                      }
                    })
                  })
                }
        
                if (data.current_countGt && !data.current_countLt) {
                  docs.forEach(doc => {
                    doc.sizes.forEach((c, i) => {
                      if (c.current_count < data.current_countGt) {
                        doc.sizes.splice(i, 1)
                      }
                    })
                    doc.sizes.forEach((c, i) => {
                      if (c.current_count < data.current_countGt) {
                        doc.sizes.splice(i, 1)
                      }
                    })
                  })
                }
        
                if (data.current_countLt && !data.current_countGt) {
                  docs.forEach(doc => {
                    doc.sizes.forEach((c, i) => {
                      if (c.current_count > data.current_countLt) {
                        doc.sizes.splice(i, 1)
                      }
                    })
                    doc.sizes.forEach((c, i) => {
                      if (c.current_count > data.current_countLt) {
                        doc.sizes.splice(i, 1)
                      }
                    })
                  })
                }
        
                if (data.current_countLt && data.current_countGt) {
                  docs.forEach((doc, index) => {
                    doc.sizes.forEach((c, i) => {
                      if (c.current_count > data.current_countLt || c.current_count < data.current_countGt) {
                        doc.sizes.splice(i, 1)
                      }
                    })
                    doc.sizes.forEach((c, i) => {
                      if (c.current_count > data.current_countLt || c.current_count < data.current_countGt) {
                        doc.sizes.splice(i, 1)
                      }
                    })
                    if (doc.sizes.length === 0) {
                      docs.splice(index, 1)
                    }
                  })
                } */





        response.list = docs
        response.count = count
      } else {
        response.error = err.message
      }
      res.json(response)
    })
  })



  site.post("/api/stores_items/handel_items2", (req, res) => {
    let response = {
      done: false
    }
    let where = req.body.where || {}

    where['company.id'] = site.get_company(req).id

    $stores_items.findMany({
      select: req.body.select || {},
      where: where,
      sort: req.body.sort || {
        id: -1
      },
    }, (err, docs) => {
      if (!err) {
        response.done = true


        docs.forEach(_docs => {
          _docs.sizes.forEach(_sizes => {
            _sizes.count = 0
            _sizes.start_count = 0
            _sizes.current_count = 0
            _sizes.total_buy_price = 0
            _sizes.total_buy_count = 0
            _sizes.total_sell_price = 0
            _sizes.total_sell_count = 0
            _sizes.branches_list = []

          });
          $stores_items.update(_docs)
        });

      } else {
        response.error = err.message
      }
      res.json(response)
    })
  })


  site.post("/api/stores_items/handel_items", (req, res) => {
    let response = {
      done: false
    }
    let where = req.body.where || {}

    where['company.id'] = site.get_company(req).id

    $stores_items.findMany({
      select: req.body.select || {},
      where: where,
      sort: req.body.sort || {
        id: -1
      },
    }, (err, docs) => {
      if (!err) {
        response.done = true

        site.getDefaultSetting(req, callback => {
          let store = {}
          let unit = {}

          if (callback.inventory) {
            if (callback.inventory.store)
              store = callback.inventory.store
            if (callback.inventory.unit)
              unit = callback.inventory.unit
          }

          docs.forEach(_doc => {

            _doc.main_unit = unit

            _doc.units_list = [{
              id: unit.id,
              name: unit.name,
              convert: 1
            }]

            let y = new Date().getFullYear().toString()

            if (_doc.sizes && _doc.sizes.length > 0)
              _doc.sizes.forEach(_sizes => {
                let _barcode = _doc.id + _doc.company.id + _doc.branch.code + y + (Math.floor(Math.random() * 100))
                if (unit.id)
                  if (true) {
                    _sizes.discount = {
                      max: 5, type: 'number', value: 2
                    }
                    _sizes.size_units_list = [{
                      id: unit.id,
                      name: unit.name,
                      barcode: _barcode,
                      current_count: _sizes.current_count,
                      start_count: _sizes.start_count,
                      price: _sizes.price,
                      cost: _sizes.cost,
                      discount: {
                        max: _sizes.discount.max,
                        value: _sizes.discount.value,
                        type: _sizes.discount.type
                      },
                      total_buy_price: _sizes.total_buy_price,
                      total_buy_count: _sizes.total_buy_count,
                      total_sell_price: _sizes.total_sell_price,
                      total_sell_count: _sizes.total_sell_count,
                      average_cost: _sizes.average_cost,
                      convert: 1
                    }]

                    if (_sizes.branches_list && _sizes.branches_list.length > 0)
                      _sizes.branches_list.forEach(_branch => {
                        _branch.size_units_list = [{
                          id: unit.id,
                          name: unit.name,
                          barcode: _barcode,
                          current_count: _branch.current_count,
                          start_count: _branch.start_count,
                          total_buy_price: _branch.total_buy_price,
                          total_buy_count: _branch.total_buy_count,
                          total_sell_price: _branch.total_sell_price,
                          total_sell_count: _branch.total_sell_count,
                          average_cost: _branch.average_cost
                        }]

                        if (_branch.stores_list && _branch.stores_list.length > 0)
                          _branch.stores_list.forEach(_store => {
                            _store.size_units_list = [{
                              id: unit.id,
                              name: unit.name,
                              barcode: _barcode,
                              current_count: _store.current_count,
                              start_count: _store.start_count,
                              total_buy_price: _store.total_buy_price,
                              total_buy_count: _store.total_buy_count,
                              total_sell_price: _store.total_sell_price,
                              total_sell_count: _store.total_sell_count,
                              average_cost: _store.average_cost
                            }]

                          });
                      });

                    delete _sizes.total_purchase_price
                    delete _sizes.total_purchase_count
                    delete _sizes.discount

                  }



                // if (_sizes.discount == (null || undefined))
                //   _sizes.discount = { max: 0, value: 0, type: 'number' }

                // if (_sizes.branches_list == (null || undefined) && _sizes.current_count != 0) {

                //   let totalCost = site.toNumber(_sizes.cost) * site.toNumber(_sizes.current_count);

                //   let obj_branch = {
                //     name_ar: _docs.branch.name_ar,
                //     code: _docs.branch.code,
                //     start_count: 0,
                //     current_count: site.toNumber(_sizes.current_count),
                //     total_buy_price: totalCost,
                //     total_buy_count: site.toNumber(_sizes.current_count),
                //     average_cost: site.toNumber(totalCost) / site.toNumber(_sizes.current_count),
                //     stores_list: [{
                //       store: store,
                //       start_count: 0,
                //       current_count: site.toNumber(_sizes.current_count),
                //       cost: site.toNumber(_sizes.cost),
                //       price: site.toNumber(_sizes.price),
                //       total_buy_price: totalCost,
                //       total_buy_count: site.toNumber(_sizes.current_count),
                //       average_cost: site.toNumber(totalCost) / site.toNumber(_sizes.current_count)
                //     }]
                //   }
                //   _sizes.branches_list = [obj_branch]
                // }


              });
            $stores_items.update(_doc)
          });
        })

      } else {
        response.error = err.message
      }
      res.json(response)
    })
  })

  site.getKitchenToDelete = function (data, callback) {

    let where = {};

    if (data.name == 'kitchen') where['sizes.kitchen.id'] = data.id

    $stores_items.findOne({
      where: where,
    }, (err, docs, count) => {

      if (!err) {
        if (docs) callback(true)
        else callback(false)
      }
    })
  }

  site.getUnitToDelete = function (id, callback) {

    let where = {};

    where['units_list.id'] = id

    $stores_items.findOne({
      where: where,
    }, (err, docs, count) => {

      if (!err) {
        if (docs) callback(true)
        else callback(false)
      }
    })
  }


  site.post("/api/stores_items/sizes_all", (req, res) => {
    let response = {
      done: false
    }
    let where = req.body.where || {}

    where['company.id'] = site.get_company(req).id

    $stores_items.findMany({
      select: req.body.select || {},
      where: where,
      sort: req.body.sort || {
        id: -1
      },
      limit: req.body.limit
    }, (err, docs, count) => {
      if (!err) {
        response.done = true
        let arr_sizes = [];
        if (docs && docs.length > 0) {
          docs.forEach(item => {
            if (item.sizes && item.sizes.length > 0)
              item.sizes.forEach(size => {
                size.itm_id = item.id
                size.stores_item_name = item.name
                arr_sizes.unshift(size)
              })
          })
        }
        response.count = count
        response.list = arr_sizes
      } else {
        response.error = err.message
      }
      res.json(response)
    })
  })


  site.post("/api/stores_items/barcode_unit", (req, res) => {
    let response = {
      done: false
    }
    let where = req.body.where || {}

    where['company.id'] = site.get_company(req).id

    $stores_items.findMany({
      select: req.body.select || {},
      where: where,
      sort: req.body.sort || {
        id: -1
      },
      limit: req.body.limit
    }, (err, docs, count) => {
      if (!err) {
        response.done = true
        let arr = [];
        if (docs && docs.length > 0) {
          docs.forEach(item => {
            if (item.sizes && item.sizes.length > 0)
              item.sizes.forEach(size => {

                if (size.size_units_list && size.size_units_list.length > 0)
                  size.size_units_list.forEach(_unit => {

                    arr.push(_unit.barcode)
                  });
              })
          })
        }
        response.count = count
        response.list = arr
      } else {
        response.error = err.message
      }
      res.json(response)
    })
  })

  site.getItemsSizes = function (req, callback) {

    let where = req.body.where || {}

    where['company.id'] = site.get_company(req).id

    $stores_items.findMany({
      select: req.body.select || {},
      where: where,
      sort: req.body.sort || {
        id: -1
      },
      limit: req.body.limit
    }, (err, docs) => {
      if (!err) {
        let arr_sizes = [];
        if (docs && docs.length > 0) {
          docs.forEach(item => {
            if (item.sizes && item.sizes.length > 0)
              item.sizes.forEach(size => {
                size.itm_id = item.id
                size.stores_item_name = item.name
                arr_sizes.unshift(size)
              })
          })
          callback(arr_sizes)
        }
      } else {

      }
    })
  }

  site.getItemsAverageCost = function (companyId, complexItems, callback) {
    let barcodes = complexItems.map(_complex => _complex.barcode)

    $stores_items.findMany({
      select: req.body.select || {},
      where: {
        'company.id': companyId,
        'sizes.barcode': barcodes
      },
      sort: req.body.sort || {
        id: -1
      },
      limit: req.body.limit
    }, (err, docs) => {
      if (!err) {
        if (docs && docs.length > 0) {
          let total_average = 0
          docs.forEach(_item => {
            if (complexItems && complexItems.length > 0)
              complexItems.forEach(_complex => {
                if (_item.sizes && _item.sizes.length > 0)
                  _item.sizes.forEach(_size => {
                    if (_size.barcode == _complex.barcode) {
                      _size.size_units_list.forEach(_unit => {
                        if (_unit.id == _complex.unit.id)
                          total_average += _unit.average_cost
                      });
                    }
                  });
              })
          })

          callback(total_average)
        }
      }
    })
  }

}