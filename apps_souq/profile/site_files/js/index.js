let btn1 = document.querySelector(".tab-link");
if (btn1) {
  btn1.click();
}

app.controller('profile', function ($scope, $http, $timeout) {
  $scope.userId = site.toNumber('##user.id##');
  
  $scope.addRating = function (rating) {
    $scope.error = '';
    const v = site.validated('#ratingModal');
    if (!v.ok) {
      $scope.error = v.messages[0].ar;
      return;
    }
    rating.receiver = {
      id: $scope.user.id,
      email: $scope.user.email,
    };
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/ratings/add',
      data: rating,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.rating = {};
          site.hideModal('#ratingModal');
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };

  $scope.getAdsList = function (where) {
    $scope.busy = true;
    $scope.contentList = [];
    $http({
      method: 'POST',
      url: '/api/contents/all',
      data: {
        where: {
          $and: [
            {
              'store.user.id': site.toNumber('##params.id##'),
            },
            {
              'ad_status.id': 1,
            },
          ],
        },
        post: true,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.contentList = response.data.list;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getRatingList = function () {
    $scope.busy = true;
    $scope.ratingList = [];
    $http({
      method: 'POST',
      url: '/api/ratings/all',
      data: {
        where: {
          'receiver.id': site.toNumber('##params.id##'),
          approval: true,
        },
        display: true,
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done && response.data.list.length > 0) {
          $scope.ratingList = response.data.list;
          $scope.positive = response.data.positive;
          $scope.negative = response.data.negative;
          $scope.exist_user = response.data.exist_user;
          $scope.count = response.data.count;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.showCommunication = function (obj) {
    $scope.main_obj = obj;
    site.showModal('#communicationModal');
  };

  $scope.sendMessage = function () {
    $scope.busy = true;

    if (!$scope.send_message) {
      $scope.error = '##word.must_write_message##';
      return;
    }
    let message_obj = {
      date: new Date(),
      message: $scope.send_message,
      receiver: {
        id: $scope.user.id,
        name: $scope.user.profile.name,
        last_name: $scope.user.profile.last_name,
        email: $scope.user.email,
        image_url: $scope.user.profile.image_url,
      },
      show: false,
    };
    $http({
      method: 'POST',
      url: '/api/messages/update',
      data: message_obj,
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.send_message = undefined;
          site.hideModal('#messageModal');
          $scope.busy = false;
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.displayContent = function (id) {
    window.open(`/display_content?id=${id}`, '_blank');
  };

  $scope.displayManagePersonalAccount = function () {
    window.open(`/manage_user`, '_blank');
  };

  $scope.updateFollow = function (user, follow) {
    $scope.error = '';

    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/user/update_follow',
      data: { id: user.id, follow: follow },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.getUser();
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {}
    );
  };

  $scope.getUser = function () {
    $scope.busy = true;
    $http({
      method: 'POST',
      url: '/api/user/view',
      data: {
        id: site.toNumber('##params.id##'),
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.user = response.data.doc;
          if ($scope.user.email == '##user.email##') {
            $scope.user.$same_email = true;
          }
          $scope.user.followers_list.forEach((_f) => {
            if (_f == site.toNumber('##user.id##')) {
              $scope.user.$is_follow = true;
            }
          });
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        $scope.busy = false;
        $scope.error = err;
      }
    );
  };

  $scope.getRatingList();
  $scope.getAdsList();
  $scope.getUser();
});
