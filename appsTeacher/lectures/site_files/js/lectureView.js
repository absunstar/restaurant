app.controller("lectureView", function ($scope, $http, $timeout) {
  $scope.item = {};
  $scope.baseURL = "";
  $scope.view = function () {
    $scope.busy = true;
    $scope.error = "";
    $http({
      method: "POST",
      url: `${$scope.baseURL}/api/lectures/view`,
      data: {
        id: site.toNumber("##query.id##"),
      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          $scope.item = response.data.doc;
          document.getElementById("description").innerHTML =
            $scope.item.description;
        } else {
          $scope.error = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };
  $scope.showEnterCode = function () {
    $scope.code = ''
    site.showModal('#codeModal');

  };

  $scope.buyLecture = function () {
    $scope.errorCode = "";
    const v = site.validated('#codeModal');
    if (!v.ok) {
      $scope.errorCode = v.messages[0].ar;
      return;
    }

    $scope.busy = true;
    $http({
      method: "POST",
      url: `${$scope.baseURL}/api/lectures/buyCode`,
      data: {
        code :$scope.code,
        lectureId : $scope.item.id,
        lecturePrice : $scope.item.price,

      },
    }).then(
      function (response) {
        $scope.busy = false;
        if (response.data.done) {
          site.hideModal('#codeModal');
          site.resetValidated('#codeModal');
          $scope.code = '';
        } else {
          $scope.errorCode = response.data.error;
        }
      },
      function (err) {
        console.log(err);
      }
    );
  };


  $scope.view();
});
