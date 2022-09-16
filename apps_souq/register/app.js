module.exports = function init(site) {
  const $register = site.connectCollection('register');

  site.get({
    name: 'images',
    path: __dirname + '/site_files/images/',
  });

  site.get({
    name: 'register',
    path: __dirname + '/site_files/html/index.html',
    parser: 'html',
    compress: true,
  });

  site.get({
    name: 'css',
    path: __dirname + '/site_files/css/',
  });

  site.post('/api/register', (req, res) => {
    let response = {};

    if (req.body.$encript) {
      if (req.body.$encript === '64') {
        req.body.email = site.fromBase64(req.body.email);
        req.body.password = site.fromBase64(req.body.password);
      } else if (req.body.$encript === '123') {
        req.body.email = site.from123(req.body.email);
        req.body.password = site.from123(req.body.password);
      }
    }

    let user = {
      email: req.body.email,
      password: req.body.password,
      feedback_list: [],
      follow_list : [],
      other_addresses_list: [],
      ip: req.ip,
      permissions: ['user'],
      active: true,
      profile: {
        files: [],
        name: req.body.first_name,
        last_name: req.body.last_name,
        image_url: req.body.image_url,
      },
      $req: req,
      $res: res,
    };
 
    if (site.defaultSettingDoc && site.defaultSettingDoc.stores_settings) {

      if (site.defaultSettingDoc.stores_settings.maximum_stores) {
        user.maximum_stores = site.defaultSettingDoc.stores_settings.maximum_stores;
      } else {
        user.maximum_stores = 2;
      }
    }

    site.security.register(user, function (err, doc) {
      if (!err) {
        let store_name = req.session.lang== 'ar'? 'متجر' : 'Store';
        response.user = doc;
        response.done = true;
        let store = {
          image_url: '/images/stores.png',
          feedback_list: [],
          store_rating: 0,
          number_views: 0,
          number_likes: 0,
          number_comments: 0,
          number_favorites: 0,
          number_reports: 0,
          priority_level: 0,
          active: true,
          user: {
            id: doc.id,
            profile: doc.profile,
            email: doc.email,
          },
          store_status: {
            id: 1,
            en: 'Active',
            ar: 'نشط',
          },
          name : store_name + doc.profile.name ,
        };
        
        store.$add = true;
        site.store_list.push(store);
      } else {
        response.error = err.message;
      }
      res.json(response);
    });
  });
};
