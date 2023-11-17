module.exports = function init(site) {
  let yts = site.connectApp({ name: 'generator_yts' });
  let app = site.connectApp({ name: 'articles-generator', title: 'Articles Generator', dir: __dirname, images: true });
  let sites = site.connectApp({ name: 'generator_sites', allowMemory: true });
};
