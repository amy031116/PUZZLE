// gate-guard.js
// 관리자 접근 허용 시(sessionStorage/localStorage에 기록됨) 리다이렉트를 건너뜀
(function () {
  // ★ [설정] 방화벽(오픈 전 리다이렉트) ON/OFF 스위치 (현재: ON)
  var ENABLE_GUARD = true; 

  // ?logout 또는 ?admin=false 접속 시 관리자 권한 해제 (다시 차단되는지 테스트할 때 사용)
  if (location.search.indexOf("logout") !== -1 || location.search.indexOf("admin=false") !== -1) {
    try {
      localStorage.removeItem("adminBypass");
      sessionStorage.removeItem("adminBypass");
    } catch (e) {}
  }

  // URL 주소창에 ?admin=true 또는 ?bypass 가 붙어 있으면 모바일에서도 자동으로 관리자 인증 저장 후 통과
  if ((location.search.indexOf("admin") !== -1 && location.search.indexOf("admin=false") === -1) || location.search.indexOf("bypass") !== -1) {
    try {
      localStorage.setItem("adminBypass", "true");
    } catch (e) {}
    return;
  }

  // 이미 관리자 인증이 저장되어 있으면 통과
  if (sessionStorage.getItem("adminBypass") === "true" || localStorage.getItem("adminBypass") === "true") {
    return;
  }

  if (!ENABLE_GUARD) {
    return;
  }

  // D-Day(2026-11-05 18:00 KST) 전에는 grand opening 페이지로 리다이렉트
  var openTime = new Date("2026-11-05T18:00:00+09:00");
  if (new Date() < openTime) {
    location.replace("grand opening.html");
  }
})();
