//handles building of schedule and course information on schedule and signup pages
(async () => {
  "use strict";
  const contentJSON = await fetch("./content.json")
    .then((data) => data.json())
    .catch((err) => console.log("error loading content: ", err));
  const classes = contentJSON.classes;
  const courseInfo = contentJSON.courseInfo;
  const scheduleEl = document.querySelector("[data-component='schedule']");

  //build three sections/tables
  let scheduleHTML = `<h2 class="mt-n2 fls-n2 mb-10">Schedule and Books</h2>`;
  classes.forEach((_class) => {
    //if course name is empty, don't try to populate it's content
    if (!_class.name.trim().length) return;
    scheduleHTML += `
      <div>
        <h4>${_class.name} (${_class.startDate} - ${_class.endDate})</h4>
        <table class="schedule-table">
          <thead>
            <tr>
              <td>Course Name</td>
              <td>Start Date</td>
              <td>End Date</td>
              <td>Book(s)</td>
            </tr>
          </thead>
          <tbody>
            ${_class.courses
              .map((course) => {
                return `
                  <tr>
                    <td>${courseInfo[course.courseId].courseName}</td>
                    <td>${course.startDate}</td>
                    <td>${course.endDate}</td>
                    <td>
                      ${courseInfo[course.courseId].books
                        .map((book) => {
                          if (!book.name.trim().length) return;
                          return `<div><i>- </i><a href="${book.link}" target="_blank">${book.name}</a></div>`;
                        })
                        .join("")}
                    </td>
                  </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  });
  scheduleEl.insertAdjacentHTML("beforeend", scheduleHTML);
})();
