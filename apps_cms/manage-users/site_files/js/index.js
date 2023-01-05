let btn1 = document.querySelector("#manage_users .tab-link");
if (btn1) {
  btn1.click();
}

app.controller("manage_users", function ($scope, $http) {
  $scope._search = {};

  $scope.mode = 'add';
  $scope.manage_users = {};
  $scope.viewText = "";

  $scope.loadManageUsers = function (where) {
    $scope.manage_users_list = [];
    $scope.busy = true;
    where = where || {};
    if('##query.type##' != 'undefined') {
      where['type.id'] = site.toNumber('##query.type##');
    }
    $http({
      method: "POST",
      url: "/api/users/all",
      data : {

        where: where,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.manage_users_list = response.data.users;
          $scope.count = response.data.users.length;
          $scope.manage_users.$permissions_info;
          $scope.permissions_list = [];

        } else {
          $scope.manage_users = {};
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.editManageUser = function (type) {
    $scope.busy = true;

    const v = site.validated("#manageUsersManageModal");
    if (!v.ok && type == "password") {
      $scope.error = v.messages[0].ar;
      return;
    }

    $http({
      method: "POST",
      url: "/api/manage_users/update",
      data: {
        user: $scope.manage_users,
        type: type,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.busy = false;
          site.hideModal("#manageUsersManageModal");

        } else {
          $scope.error = response.data.error;
          if (response.data.error.like("*Must Enter Code*")) {
            $scope.error = "##word.must_enter_code##";
          } else if (
            response.data.error.like("*maximum number of adds exceeded*")
          ) {
            $scope.error = "##word.err_maximum_adds##";
          } else if (
            response.data.error.like("*mail must be typed correctly*")
          ) {
            $scope.error = "##word.err_username_contain##";
          } else if (response.data.error.like("*User Is Exist*")) {
            $scope.error = "##word.user_exists##";
          } else if (response.data.error.like("*Password does not match*")) {
            $scope.error = "##word.password_err_match##";
          } else if (response.data.error.like("*Current Password Error*")) {
            $scope.error = "##word.current_password_incorrect##";
          }
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };


  $scope.displayAddManageUsers = function () {
    $scope.error = '';
    $scope.mode = 'add';
    $scope.manage_users = {
      active: true,
      ability_login: true,
      image_url: '/images/manage_users.png',
    };
    $scope.manage_users.type = $scope.usersTypesList.find(_t => { return _t.id === site.toNumber('##query.type##') });
    site.showModal('#manageUsersManageModal');
    document.querySelector("#manageUsersManageModal .tab-link").click();
  };

  $scope.addManageUsers = function () {
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/manage_users/add",
      data: $scope.manage_users
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#manageUsersManageModal');
          $scope.loadManageUsers();
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {

      }
    )
  };
  $scope.displayUpdateManageUsers = function (manage_users) {
    $scope.error = '';
    $scope.mode = 'edit';
    $scope.viewManageUsers(manage_users);
    $scope.manage_users = {};
    site.showModal('#manageUsersManageModal');
    document.querySelector("#manageUsersManageModal .tab-link").click();
  };

  $scope.updateManageUsers = function () {
    $scope.error = '';
    const v = site.validated('#manageUsersManageModal');
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/user/update",
      data: $scope.manage_users
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#manageUsersManageModal');
          $scope.loadManageUsers();
        } else {
          $scope.error = 'Please Login First';
        }
      },
      function (err) {
        console.log(err);
      }
    )
  };

  $scope.displayDetailsManageUsers = function (manage_users) {
    $scope.error = '';
    $scope.mode = 'view';
    $scope.viewManageUsers(manage_users);
    $scope.manage_users = {};
    site.showModal('#manageUsersManageModal');
  };


  $scope.viewManageUsers = function (manage_users) {
    $scope.manage_users = {};
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/manage_user/view",
      data: { id: manage_users.id, all: true },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.manage_users = response.data.doc;

          $scope.manage_users.$permissions_info;
          $scope.permissions_list = [];
          $scope.manage_users.$permissions_info.forEach((_p) => {
            $scope.permissions_list.push({
              name: _p.screen_name,
              module_name: _p.module_name,
            });
          });
          /*  if (site.feature("ecommerce")) {
             $scope.getOrderEcoList();
           } */
          $http({
            method: "POST",
            url: "/api/get_dir_names",
            data: $scope.permissions_list,
          }).then(
            function (response) {
              let data = response.data.doc;
              if (data) {
                $scope.permissions_list.forEach((_s) => {
                  if (_s.name) {
                    let newname = data.find(
                      (el) => el.name == _s.name.replace(/-/g, "_")
                    );
                    if (newname) {
                      _s.name_ar = newname.ar;
                      _s.name_en = newname.en;
                    }
                  }
                });
              }
            },
            function (err) { }
          );
        } else {
          $scope.manage_users = {};
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.loadPermissions = function () {
    $http({
      method: "POST",
      url: "/api/security/permissions",
      data: {}
    }).then(
      function (response) {
        $scope.screens = [];
        if (response.data.done) {
          response.data.permissions.forEach(p => {

            let exist = false;

            $scope.screens.forEach(s => {
              if (s.name == p.screen_name) {
                exist = true
                s.permissions.push(p)
              }
            });

            if (!exist && p.screen_name) {
              $scope.screens.push({
                name: p.screen_name,
                module_name: p.module_name,
                permissions: [p]
              })
            }
          });



          $http({
            method: 'POST',
            url: '/api/get_dir_names',
            data: $scope.screens
          }).then(
            function (response) {
              let data = response.data.doc
              if (data) {
                $scope.trans = data;
                $scope.screens.forEach(s => {
                  let newname = data.find(el => el.name == s.name.replace(/-/g, '_'));
                  if (newname) {
                    s.name_ar = newname.ar;
                    s.name_en = newname.en;
                  }

                })
              }

            }, function (err) {


            });


          $scope.public_screens = $scope.screens.filter(s => s.module_name == 'public');
          $scope.public_screens.pop();
          $scope.permissions = response.data.permissions;

        }
      },
      function (err) {
        $scope.error = err;
      })
  };



  $scope.displayDeleteManageUsers = function (manage_users) {
    $scope.error = '';
    $scope.mode = 'delete';
    $scope.viewManageUsers(manage_users);
    $scope.manage_users = {};
    site.showModal('#manageUsersManageModal');
    document.querySelector("#manageUsersManageModal .tab-link").click();
  };

  $scope.deleteManageUsers = function () {
    $scope.busy = true;
    $scope.error = '';

    $http({
      method: "POST",
      url: "/api/user/delete",
      data: {
        id: $scope.manage_users.id
      }
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#manageUsersManageModal');
          $scope.loadManageUsers();
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    )
  };


  $scope.searchAll = function () {

    $scope.loadManageUsers($scope.search);
    site.hideModal('#manageUsersSearchModal');
    $scope.search = {};
  };

  $scope.getUsersTypesList = function () {
    $scope.error = "";
    $scope.busy = true;
    $scope.usersTypesList = [];
    $http({
      method: "POST",
      url: "/api/users_types/all",
    }).then(
      function (response) {
        $scope.busy = false;
        $scope.usersTypesList = response.data;
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getGender = function () {
    $scope.error = "";
    $scope.busy = true;
    $scope.genderList = [];
    $http({
      method: "POST",
      url: "/api/gender/all",
    }).then(
      function (response) {
        $scope.busy = false;
        $scope.genderList = response.data;
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.loadRoles = function () {
    $http({
      method: "POST",
      url: "/api/security/roles",
      data: {}
    }).then(
      function (response) {
        if (response.data.done) {
          $scope.roles = response.data.roles;
          $scope.public_roles = $scope.roles.filter(s => s.module_name == 'public');
        }
      },
      function (err) {
        $scope.error = err;
      })
  };

  $scope.checkAll = function (name) {
    $scope[name].forEach(r => {
      r.$selected = $scope['$' + name];
      if (r.$selected) {
        let exists = false;
        $scope.user.roles.forEach(r2 => {
          if (r.name == r2.name) {
            exists = true
            r2.$selected = true;
          }
        });
        if (!exists) {
          $scope.user.roles.push(r);
        }
      } else if (!r.$selected) {
        let exists = false;
        $scope.user.roles.forEach((r2, i) => {
          if (r.name == r2.name) {
            r2.$selected = false;
            $scope.user.roles.splice(i, 1);
          }
        });

      }
    });
  };

  $scope.getCountriesList = function (where) {
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/countries/all',
      data: {
        where: {
          active: true,
        },
        select: {
          id: 1,
          name: 1,
          code: 1,
          country_code: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.countriesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getGovesList = function (country) {
    $scope.busy = true;
    $scope.govesList = [];
    $scope.cityList = [];
    $scope.areaList = [];
    $http({
      method: 'POST',
      url: '/api/goves/all',
      data: {
        where: {
          'country.id': country.id,
          active: true,
        },
        select: {
          id: 1,
          name: 1,
          code: 1,
        },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.govesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getCityList = function (gov) {
    $scope.busy = true;
    $scope.cityList = [];
    $scope.areaList = [];
    $http({
      method: 'POST',
      url: '/api/city/all',
      data: {
        where: {
          'gov.id': gov.id,
          active: true,
        },
        select: { id: 1, name: 1 },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.cityList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getAreaList = function (city) {
    $scope.busy = true;
    $scope.areaList = [];
    $http({
      method: 'POST',
      url: '/api/area/all',
      data: {
        where: {
          'city.id': city.id,
          active: true,
        },
        select: { id: 1, name: 1 },
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.areaList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };


  $scope.getFilesTypesList = function (where) {
    $scope.busy = true;
    $scope.filesTypesList = [];
    $http({
      method: "POST",
      url: "/api/file_type/all",
      data: {
        where: {
          active: true,
        },
        select: { name: 1, id: 1 }
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.filesTypesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.addFiles = function () {
    $scope.error = "";
    $scope.manage_users.files_list = $scope.manage_users.files_list || [];
    $scope.manage_users.files_list.push({
      file_date: new Date(),
      file_upload_date: new Date(),
      upload_by: "##user.profile.name##",
      id_by: site.toNumber("##user.id##"),
    });
  };

  $scope.loadManageUsers();
  $scope.loadPermissions();
  $scope.loadRoles();
  $scope.getUsersTypesList();
  $scope.getCountriesList();
  $scope.getGender();
  $scope.getFilesTypesList();
});
