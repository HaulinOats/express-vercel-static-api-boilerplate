(async ($) => {
  "use strict";
  //load packages into select
  let form = ".ajax-payment";
  let invalidCls = "is-invalid";
  let $email = '[name="email"]';
  let $validation = '[name="name"],[name="email"],[name="message"]'; // Must be use (,) without any space
  let formMessages = $(".form-messages");
  let packageSelect = $("#packageSelect");
  let selectedPackage;

  //get package info from JSON file and populate dropdown for selecting packages on signup.html page
  let packages = await fetch("./package-options.json")
    .then((data) => data.json())
    .catch((err) => console.log(`error getting package data: ${err}`));

  let packageSelectHTML = "";
  packages.forEach((pkg, i) => {
    packageSelectHTML += `<option value="${i}">${pkg.name} - $${pkg.total.toFixed(2)}</option>`;
  });
  packageSelect.append(packageSelectHTML);

  //when selecting a package from dropdown, display table breakdown
  packageSelect.on("change", (e) => {
    let packageIndex = parseInt(e.currentTarget.value);
    selectedPackage = packages[packageIndex];
    let tableEl = document.createElement("table");
    tableEl.classList.add(["table", "table-responsive-lg"]);
    tableEl.append(`<tr>
      <th>Due Time</th>
      <th>Description</th>
      <th>Cost</th>
    </tr>`);
    let rowHTML = "";
    selectedPackage.rowItems.forEach((row) => {
      rowHTML += `<tr>
        <td>${row.due}</td>
        <td>${row.description}</td>
        <td>$${row.cost.toFixed(2)}</td>
      </tr>`;
    });
    rowHTML += `<tr>
      <td></td>
      <td class="fw-bold">Total</td>
      <td class="fw-bold">$${selectedPackage.total.toFixed(2)}</td>
    </tr>`;
    tableEl.innerHTML = rowHTML;
    $("#packageDetails").html("").append(tableEl).show();
    $("#payment-total").html(`Total: $${selectedPackage.total.toFixed(2)}`);
    $("#payment-form").show();
  });

  //validates form data
  function validateContact() {
    let valid = true;
    let formInput;

    function unvalid($validation) {
      $validation = $validation.split(",");
      for (let i = 0; i < $validation.length; i++) {
        formInput = form + " " + $validation[i];
        if (!$(formInput).val()) {
          $(formInput).addClass(invalidCls);
          valid = false;
        } else {
          $(formInput).removeClass(invalidCls);
          valid = true;
        }
      }
    }
    unvalid($validation);

    if (
      !$($email).val() ||
      !$($email)
        .val()
        .match(/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/)
    ) {
      $($email).addClass(invalidCls);
      valid = false;
    } else {
      $($email).removeClass(invalidCls);
      valid = true;
    }

    return valid;
  }
})(jQuery);
