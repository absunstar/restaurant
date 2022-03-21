
const site = require('isite')({
    port: [80 , 40004],
    lang: 'ar',
    version : '2021.12.05',
    name: "restaurant",
    theme: 'theme_paper',
    require: {
        features: [],
        permissions: []
    },
    mongodb: {
        db: 'smart_code_restaurants',
        limit: 100000
    },
    security: {
        keys: ['e698f2679be5ba5c9c0b0031cb5b057c' , '9705a3a85c1b21118532fefcee840f99'],
      }
})

if(site.hasFeature('protouch')){
    site.words.addList(__dirname + '/site_files/json/words-sa.json');
}


site.get({
    name: '/',
    path: site.dir + '/'
})

site.get({
    name: '/',
    path: site.dir + '/html/index.html',
    parser: 'html css js'
})


site.words.add({
    "name": "le",
    "en": "Ryal",
    "ar": "ريال"
}, {
    "name": "pound",
    "en": "Ryal",
    "ar": "ريال"
})

site.ready = false
site.loadLocalApp('client-side')
site.loadLocalApp('ui-print')
site.importApp(__dirname + '/apps_private/cloud_security', 'security')
site.importApp(__dirname + '/apps_private/ui-help')
site.importApp(__dirname + '/apps_private/notifications')
site.importApps(__dirname + '/apps_core')
site.importApps(__dirname + '/apps_accounting')
site.importApps(__dirname + '/apps_inventories')
site.importApps(__dirname + '/apps_reports')
site.importApps(__dirname + '/apps_order')
site.importApps(__dirname + '/apps_hr')
site.importApps(__dirname + '/apps_restaurant')
site.addFeature('restaurant')

setTimeout(() => {
    site.importApp(__dirname + '/apps_private/companies')
    site.importApp(__dirname + '/apps_private/zk-reader')

  // site.zk.load_attendance( {
    //     ip: '192.168.100.201',
    //     port: 4370,
    //     inport: 5200,
    //     timeout: 5000,
    //     attendanceParser: 'v6.60',
    //     connectionType: 'udp',
    //     auto: true,
    //     auto_time: 1000 * 3
    // }, (err, attendance_array) => {
    //     console.log(attendance_array || err)
    // })

}, 1000)


setTimeout(() => {
    site.ready = true
}, 1000 * 2);

site.run()


// site.on('zk attend', attend=>{
//     console.log(attend)
// })

