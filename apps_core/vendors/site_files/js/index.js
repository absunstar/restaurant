app.controller("vendors", function ($scope, $http, $timeout) {
  $scope._search = {};

  $scope.vendor = {};

  $scope.displayAddVendor = function () {
    $scope.error = '';
    $scope.vendor = {
      image_url: '/images/vendor.png',
      active: true,
      balance_creditor: 0,
      balance_debtor: 0,
      credit_limit: 0,
      branch_list: [{
        charge: [{}]
      }],
      currency_list: [],
      opening_balance: [{ initial_balance: 0 }],
      bank_list: [{}],
      dealing_company: [{}]
    };
    site.showModal('#vendorAddModal');
    document.querySelector('#vendorAddModal .tab-link').click();
  };

  $scope.addVendor = function () {
    $scope.error = '';
    if ($scope.busy) {
      return;
    }

    const v = site.validated('#vendorAddModal');
    if (!v.ok) {
      $scope.error = v.messages[0].Ar;
      return;
    }

    $scope.busy = true;

    $http({
      method: "POST",
      url: "/api/vendors/add",
      data: $scope.vendor
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#vendorAddModal');
          $scope.list.push(response.data.doc);
          $scope.count = $scope.list.length;
        } else {
          $scope.error = 'Please Login First';
          if (response.data.error.like('*Must Enter Code*')) {
            $scope.error = "##word.must_enter_code##"
          }
        }
      },
      function (err) {
        console.log(err);
      }
    )
  };

  $scope.displayUpdateVendor = function (vendor) {
    $scope.error = '';
    $scope.detailsVendor(vendor);
    $scope.vendor = {};
    site.showModal('#vendorUpdateModal');
    document.querySelector('#vendorUpdateModal .tab-link').click();
  };

  $scope.displaybankingAndAccounting = function (event) {

    site.showTabContent(event, '#bankingAndAccounting');

    let num = 0;
    let ln = $scope.vendor.opening_balance;

    for (let i = 0; i < ln.length; i++) {
      if (ln[i].initial_balance > 0) {

        if (ln[i].balance_type == "credit") {
          num = num - parseInt(ln[i].initial_balance);

        } else {
          num = num + parseInt(ln[i].initial_balance);
        }

      }

    }

  };



  $scope.updateVendor = function () {
    $scope.error = '';
    if ($scope.busy) {
      return;
    }

    const v = site.validated('#vendorUpdateModal');
    if (!v.ok) {
      $scope.error = v.messages[0].Ar;
      return;
    }
    $scope.busy = true;

    $http({
      method: "POST",
      url: "/api/vendors/update",
      data: $scope.vendor
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#vendorUpdateModal');
          $scope.list.forEach((b, i) => {
            if (b.id == response.data.doc.id) {
              $scope.list[i] = response.data.doc;
            }
          });
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    )
  };

  $scope.displayDeleteVendor = function (vendor) {
    $scope.error = '';
    $scope.detailsVendor(vendor);
    $scope.vendor = {};
    site.showModal('#vendorDeleteModal');
    document.querySelector('#vendorDeleteModal .tab-link').click();
  };

  $scope.deleteVendor = function () {
    $scope.error = '';
    if ($scope.busy) {
      return
    }

    $scope.busy = true;

    $http({
      method: "POST",
      url: "/api/vendors/delete",
      data: {
        id: $scope.vendor.id
      }
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#vendorDeleteModal');
          $scope.list.forEach((b, i) => {
            if (b.id == response.data.doc.id) {
              $scope.list.splice(i, 1);
              $scope.count = $scope.list.length;
            }
          });
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    )
  };

  $scope.displayDetailsVendor = function (vendor) {
    $scope.error = '';
    $scope.detailsVendor(vendor);
    $scope.vendor = {};
    site.showModal('#vendorDetailsModal');
    document.querySelector('#vendorDetailsModal .tab-link').click();
  };

  $scope.detailsVendor = function (vendor) {
    $scope.error = '';
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/vendors/view",
      data: {
        id: vendor.id
      }
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.vendor = response.data.doc;
          if ($scope.vendor.opening_balance && $scope.vendor.opening_balance.length > 0)
            $scope.vendor.opening_balance.forEach(o_b => {
              o_b.$view = true
            });
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    )
  };

  $scope.displaySendEmail = function () {
    $scope.error = '';
    site.showModal('#vendorSendEmailModal');
  };

  $scope.getVendorList = function (where) {
    $scope.error = '';

    $scope.busy = true;
    $scope.list = [];
    $http({
      method: "POST",
      url: "/api/vendors/all",
      data: {
        where: where
      }
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.list = response.data.list;
          $scope.count = response.data.count;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    )
  };

  $scope.getVendorGroupList = function () {
    $http({
      method: "POST",
      url: "/api/vendors_group/all",
      data: {
        select: {
          id: 1,
          name_Ar: 1, name_En: 1,
          code: 1
        }
      }
    }).then(
      function (response) {
        $scope.busy = false;
        $scope.vendorGroupList = response.data.list;
      },
      function (err) {
        $scope.error = err;
      }
    )
  };


  $scope.getGovList = function (where) {
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/goves/all",
      data: {
        where: {
          active: true
        },
        select: { id: 1, name_Ar: 1, name_En: 1 }
      }
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.govList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }

    )

  };

  $scope.getCityList = function (gov) {
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/city/all",
      data: {
        where: {
          'gov.id': gov.id,
          active: true
        },
        select: { id: 1, name_Ar: 1, name_En: 1 }
      }
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
    )
  };

  $scope.getAreaList = function (city) {
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/area/all",
      data: {
        where: {
          'city.id': city.id,
          active: true
        },
      }
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
    )
  };


  $scope.searchAll = function () {
    $scope.error = '';
    $scope.getVendorList($scope.search);
    $scope.search = {};
    site.hideModal('#vendorSearchModal');
  };


  $scope.getGuideAccountList = function () {
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/accounting_guide_accounts/all",
      data: {
        where: {
          status: 'active',
          type: 'detailed'
        }
      }
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.guideAccountList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    )
  };


  $scope.loadCurrencies = function () {
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/currency/all",
      data: {
        select: {
          id: 1,
          name_Ar: 1, name_En: 1,
          minor_currency_Ar: 1, minor_currency_en: 1,
          ex_rate: 1,
          code: 1
        },
        where: {
          active: true
        }
      }
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.currenciesList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    )
  };

  $scope.getNationalitiesList = function () {
    $http({
      method: "POST",
      url: "/api/nationalities/all",
      data: {
        select: {
          id: 1,
          name_Ar: 1,
          name_En: 1,
          code: 1
        }
      }
    }).then(
      function (response) {
        $scope.busy = false;
        $scope.nationalitiesList = response.data.list;
      },
      function (err) {
        $scope.error = err;
      }
    )
  };

  $scope.getFilesTypesList = function (where) {
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/file_type/all",
      data: {
        where: {
          active: true
        },
      }
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.files_types_List = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    )
  };

  $scope.addFiles = function () {
    $scope.error = '';
    $scope.vendor.files_list = $scope.vendor.files_list || [];
    $scope.vendor.files_list.push({
      file_date: new Date(),
      file_upload_date: new Date(),
      upload_by: '##user.name##',
    })
  };

  $scope.getNumberingAuto = function () {
    $scope.error = '';
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/numbering/get_automatic",
      data: {
        screen: "vendors"
      }
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.disabledCode = response.data.isAuto;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    )
  };


  $scope.loadCurrencies();
  $scope.getVendorList();
  $scope.getFilesTypesList();
  $scope.getVendorGroupList();
  $scope.getNationalitiesList();
  $scope.getGovList();
  $scope.getNumberingAuto();
  if (site.feature('erp')) {
    $scope.getGuideAccountList();
  }
});