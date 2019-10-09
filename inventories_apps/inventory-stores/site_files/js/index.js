app.controller("stores", function ($scope, $http) {

  $scope._search = {};
  
  $scope.id = 1;

  $scope.searchAll = function () {
    $scope.error = '';
    let where = {};

    if ($scope.search.name) {
      where['name'] = $scope.search.name;
    }

    if ($scope.search.type) {
     
      where['type.id'] = $scope.search.type.id;
    }
    if ($scope.search.note) {
      where['note'] = $scope.search.note;
    }

    $scope.loadAll(where , $scope.search.limit);
  };

  $scope.loadStores = function () {
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/stores/all",
      data: {where : {}}
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.stores = response.data.list
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    )
  };
  $scope.loadAll = function (where , limit) {
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/stores/all",
      data: { where: where, limit : limit || 100000 }
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.list = response.data.list;
          site.hideModal('#StoreSearchModal');
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    )
  };

  $scope.loadStoreTypes = function () {
    $scope.busy = true;
    $http({
      method: "POST",
      url: '/api/stores/types/all',
      data: {}
    }).then(
      function (response) {
        $scope.busy = false;
          $scope.store_types = response.data;        
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    )
  };

  $scope.newStore = function () {
    $scope.error = '';
    
    $scope.store = {
      image_url: '/images/store.png'
    };
    site.showModal('#addStoreModal');
    $('#store_name').focus();
  };
  $scope.add = function () {
    $scope.error = '';
    const v = site.validated();
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/stores/add",
      data: $scope.store
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#addStoreModal');
          $scope.loadAll();
        } else {
          $scope.error = '##word.error11##';
        }
       
      },
      function (err) {
        console.log(err);
      }
    )
  };

  $scope.edit = function (store) {
    $scope.error = '';
    $scope.view(store);
    $scope.store = {};
    site.showModal('#updateStoreModal');
    $('#store_name').focus();
  };
  $scope.update = function () {
    $scope.error = '';
    const v = site.validated();
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/stores/update",
      data: $scope.store
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#updateStoreModal');
          $scope.loadAll();
        } else {
          $scope.error = '##word.error##';
        }
      },
      function (err) {
        console.log(err);
      }
    )
  };

  $scope.remove = function (store) {
    $scope.error = '';
    $scope.view(store);
    $scope.store = {};
    site.showModal('#deleteStoreModal');
  };

  $scope.view = function (store) {
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/stores/view",
      data: {
        _id: store._id
      }
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.store = response.data.doc;
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    )
  };
  $scope.details = function (store) {
    $scope.error = '';
    $scope.view(store);
    $scope.store = {};
    site.showModal('#viewStoreModal');
  };
  $scope.delete = function () {
    $scope.busy = true;
    $http({
      method: "POST",
      url: "/api/stores/delete",
      data: {
        _id: $scope.store._id,
        name: $scope.store.name
      }
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#deleteStoreModal');
          $scope.loadAll();
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    )
  };
  $scope.loadStoreTypes();
  $scope.loadStores ();
  $scope.loadAll();


});