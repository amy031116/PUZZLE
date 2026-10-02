// gate-guard.js
// 관리자 접근 허용 시(sessionStorage에 기록됨) 리다이렉트를 건너뜀
(function () {
  if (sessionStorage.getItem("adminBypass") === "true") {
    return;
  }

  // D-Day(2026-11-05 18:00 KST) 전에는 grand opening 페이지로 리다이렉트
  var openTime = new Date("2026-11-05T18:00:00+09:00");
  if (new Date() < openTime) {
    location.replace("grand opening.html");
  }
})();
