module.exports = function init(site) {
  const $default_setting = site.connectCollection('default_setting');
  site.defaultSettingDoc = {
    length_order: 0,
    user_design: { id: 5 },
    content: {
      status: {
        id: 1,
        en: 'Active',
        ar: 'نشط',
      },
    },
    stores_settings : {},
  };
  site.setting = { ...site.setting, ...site.defaultSettingDoc };

  $default_setting.findOne({}, (err, doc) => {
    if (!err && doc) {
      site.defaultSettingDoc = doc;
      site.setting = { ...site.setting, ...site.defaultSettingDoc };
    } else {
      $default_setting.add(site.defaultSettingDoc, (err, doc) => {
        if (!err && doc) {
          site.call('[country][add]', {});
          site.defaultSettingDoc = doc;
          site.setting = { ...site.setting, ...site.defaultSettingDoc };
        }
      });
    }
  });

  site.get({
    name: 'default_setting',
    path: __dirname + '/site_files/html/index.html',
    parser: 'html',
    compress: false,
  });

  site.get({
    name: '/images',
    path: __dirname + '/site_files/images',
  });

  site.post({
    name: '/api/publishing_system/all',
    path: __dirname + '/site_files/json/publishing_system.json',
  });

  site.post({
    name: '/api/user_design/all',
    path: __dirname + '/site_files/json/user_design.json',
  });

  site.post({
    name: '/api/duration_expiry/all',
    path: __dirname + '/site_files/json/duration_expiry.json',
  });

  site.post({
    name: '/api/closing_system/all',
    path: __dirname + '/site_files/json/closing_system.json',
  });

  site.post({
    name: '/api/content_status/all',
    path: __dirname + '/site_files/json/content_status.json',
  });

  site.post('/api/default_setting/get', (req, res) => {
    let response = {
      doc: site.defaultSettingDoc,
      done: true,
    };
    res.json(response);
  });

  site.getDefaultSetting = function (callback) {
    callback = callback || function () {};
    callback(site.defaultSettingDoc);
    return site.defaultSettingDoc;
  };

  site.post('/api/default_setting/save', (req, res) => {
    let response = {
      done: false,
    };

    if (!req.session.user) {
      response.error = 'Please Login First';
      res.json(response);
      return;
    }

    let data = req.data;
    $default_setting.update(data, (err, result) => {
      if (!err) {
        response.done = true;
        site.defaultSettingDoc = data;
        site.setting = { ...site.setting, ...site.defaultSettingDoc };
      } else {
        response.error = err.message;
      }
      res.json(response);
    });
  });
};
