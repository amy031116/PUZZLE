/**
 * auth.js — PUZZLE 웹사이트 닉네임 로그인 시스템
 * 모든 HTML 페이지에서 공유 사용 (localStorage 기반)
 */
(function () {
  "use strict";

  const STORAGE_KEY = "puzzle_nickname";

  // 비속어 및 금칙어 필터 모듈 동적 로드
  import("./profanity-filter.js").catch(function (e) {
    console.warn("profanity-filter 로드 실패:", e);
  });

  // 총괄 관리자 계정 목록 동적 로드
  let globalAdminsList = ["야무지니", "관리자"];
  import("./creator-accounts.js?t=" + Date.now())
    .then(function (mod) {
      if (mod && Array.isArray(mod.GLOBAL_ADMINS)) {
        globalAdminsList = mod.GLOBAL_ADMINS;
      }
      updateAuthButton();
    })
    .catch(function (e) {
      console.warn("creator-accounts 로드 실패:", e);
    });

  /* ──────────────────────────────────────────
     CSS 삽입
  ────────────────────────────────────────── */
  const style = document.createElement("style");
  style.textContent = `
    /* ── 페이퍼로지 웹폰트 보장 ── */
    @font-face {
      font-family: "Paperlogy";
      src: url("https://fastly.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-4Regular.woff2") format("woff2");
      font-weight: 400;
      font-style: normal;
    }
    @font-face {
      font-family: "Paperlogy";
      src: url("https://fastly.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-6SemiBold.woff2") format("woff2");
      font-weight: 600;
      font-style: normal;
    }
    @font-face {
      font-family: "Paperlogy";
      src: url("https://fastly.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-7Bold.woff2") format("woff2");
      font-weight: 700;
      font-style: normal;
    }
    @font-face {
      font-family: "Paperlogy";
      src: url("https://fastly.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-8ExtraBold.woff2") format("woff2");
      font-weight: 800;
      font-style: normal;
    }

    /* ── 로그인/로그아웃 팝업 내 모든 폰트 페이퍼로지 통일 ── */
    .auth-overlay,
    .auth-card,
    .auth-card *,
    .logout-card,
    .logout-card *,
    .auth-input,
    .auth-btn-primary,
    .logout-btn-cancel,
    .logout-btn-confirm {
      font-family: "Paperlogy", sans-serif !important;
    }

    /* ── 공통 오버레이 ── */
    .auth-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.25s ease;
      pointer-events: none;
    }
    .auth-overlay.visible {
      opacity: 1;
      pointer-events: auto;
    }

    /* ── 로그인 카드 ── */
    .auth-card {
      background: #fff;
      border-radius: 24px;
      padding: 40px 44px 36px;
      width: 380px;
      max-width: calc(100vw - 48px);
      box-shadow: 0 24px 60px rgba(0,0,0,0.22);
      transform: translateY(28px) scale(0.97);
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
      position: relative;
      text-align: center;
      font-family: "Paperlogy", sans-serif !important;
    }
    .auth-overlay.visible .auth-card {
      transform: translateY(0) scale(1);
    }

    .auth-card-close {
      position: absolute;
      top: 16px;
      right: 18px;
      background: none;
      border: none;
      cursor: pointer;
      color: #aaa;
      font-size: 22px;
      line-height: 1;
      padding: 4px 8px;
      border-radius: 8px;
      transition: color 0.15s, background 0.15s;
    }
    .auth-card-close:hover { color: #333; background: #f0f0f0; }

    .auth-card-emoji {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 10px;
      margin-bottom: 14px;
    }
    .auth-card-emoji img {
      width: 57.2px;
      height: 57.2px;
      display: block;
      object-fit: contain;
    }

    .auth-card-title {
      font-size: 22px;
      font-weight: 800;
      color: #111;
      margin: 0 0 6px;
      letter-spacing: -0.3px;
      transform: translateY(-3px);
    }
    .auth-card-sub {
      font-size: 13.5px;
      color: #888;
      margin: 0 0 26px;
      line-height: 1.5;
    }

    .auth-input-wrap { position: relative; margin-bottom: 8px; }
    .auth-input {
      width: 100%;
      box-sizing: border-box;
      border: 2px solid #e8e8e8;
      border-radius: 12px;
      padding: 13px 16px;
      font-size: 15px;
      font-family: "Paperlogy", sans-serif !important;
      outline: none;
      transition: border-color 0.2s;
      background: #fafafa;
      color: #111;
    }
    .auth-input::placeholder {
      font-family: "Paperlogy", sans-serif !important;
      color: #aaa;
    }
    .auth-input:focus { border-color: #ff2482; background: #fff; }
    .auth-input.error { border-color: #e74c3c; }

    .auth-error-msg {
      font-size: 12px;
      color: #e74c3c;
      text-align: left;
      margin: 0 0 16px;
      min-height: 16px;
      padding-left: 4px;
    }

    .auth-btn-primary {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #ff2482, #ff6aab);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      letter-spacing: 0.3px;
      transition: opacity 0.2s, transform 0.15s;
      box-shadow: 0 6px 20px rgba(255, 36, 130, 0.35);
      font-family: "Paperlogy", sans-serif !important;
    }
    .auth-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .auth-btn-primary:active { opacity: 1; transform: translateY(0); }

    /* ── 로그아웃 확인 카드 ── */
    .logout-card {
      background: #fff;
      border-radius: 20px;
      padding: 30px 34px 28px;
      width: 320px;
      max-width: calc(100vw - 48px);
      box-shadow: 0 20px 50px rgba(0,0,0,0.2);
      transform: translateY(20px) scale(0.97);
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1);
      text-align: center;
      position: relative;
      font-family: "Paperlogy", sans-serif !important;
    }
    .auth-overlay.visible .logout-card {
      transform: translateY(0) scale(1);
    }

    .logout-card-emoji {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 10px;
      margin-bottom: 14px;
    }
    .logout-card-emoji img {
      width: 57.2px;
      height: 57.2px;
      display: block;
      object-fit: contain;
    }
    @keyframes authPopIn {
      0% { transform: scale(0.8); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
    .auth-complete-pop {
      animation: authPopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .logout-card-title {
      font-size: 18px;
      font-weight: 800;
      color: #111;
      margin: 0 0 6px;
      transform: translateY(-3px);
    }
    .logout-card-sub {
      font-size: 13px;
      color: #999;
      margin: 0 0 24px;
    }
    .logout-btn-row {
      display: flex;
      gap: 10px;
    }
    .logout-btn-cancel {
      flex: 1;
      padding: 12px;
      background: #f0f0f0;
      color: #555;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s;
    }
    .logout-btn-cancel:hover { background: #e4e4e4; }
    .logout-btn-confirm {
      flex: 1;
      padding: 12px;
      background: linear-gradient(135deg, #ff2482, #ff6aab);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.15s;
      box-shadow: 0 4px 14px rgba(255, 36, 130, 0.3);
    }
    .logout-btn-confirm:hover { opacity: 0.88; }

    /* ── nav .auth 버튼 로그인 후 스타일 ── */
    .auth.logged-in {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 6px !important;
      background: linear-gradient(135deg, #ff2482, #ff6aab) !important;
      color: #fff !important;
      border-radius: 20px !important;
      padding: 6px 16px !important;
      font-weight: 700 !important;
      transition: opacity 0.2s !important;
      text-decoration: none !important;
      line-height: 1.2 !important;
      vertical-align: middle !important;
    }
    .auth.logged-in:hover { opacity: 0.85 !important; }
    .auth-person-icon {
      width: 26.52px;
      height: 26.52px;
      display: inline-block;
      vertical-align: middle;
      flex-shrink: 0;
    }
    .review-login-prompt .review-prompt-icon {
      width: 20px;
      height: 20px;
      display: inline-block;
      vertical-align: middle;
      object-fit: contain;
      flex-shrink: 0;
      transform: translateX(5px);
    }
    .auth-nickname-text {
      display: inline-block;
      vertical-align: middle;
    }
  `;
  document.head.appendChild(style);

  /* ──────────────────────────────────────────
     팝업 DOM 생성
  ────────────────────────────────────────── */
  // 로그인 팝업
  const loginOverlay = document.createElement("div");
  loginOverlay.className = "auth-overlay";
  loginOverlay.id = "authLoginOverlay";
  loginOverlay.setAttribute("role", "dialog");
  loginOverlay.setAttribute("aria-modal", "true");
  loginOverlay.setAttribute("aria-label", "닉네임 로그인");
  loginOverlay.innerHTML = `
    <div class="auth-card" id="authLoginCard">
      <button class="auth-card-close" id="authLoginClose" aria-label="닫기">✕</button>
      <div class="auth-card-emoji">
        <img src="웹 에셋/로그인 아이콘.svg" alt="로그인" />
      </div>
      <h2 class="auth-card-title">닉네임으로 시작하기</h2>
      <p class="auth-card-sub">2~10자의 닉네임을 입력하면<br>리뷰를 작성할 수 있어요!</p>
      <div class="auth-input-wrap">
        <input
          class="auth-input"
          id="authNicknameInput"
          type="text"
          placeholder="닉네임을 입력하세요"
          maxlength="10"
          autocomplete="off"
        />
      </div>
      <p class="auth-error-msg" id="authErrorMsg"></p>
      <button class="auth-btn-primary" id="authConfirmBtn">확인</button>
    </div>
  `;
  document.body.appendChild(loginOverlay);

  // 로그아웃 팝업
  const logoutOverlay = document.createElement("div");
  logoutOverlay.className = "auth-overlay";
  logoutOverlay.id = "authLogoutOverlay";
  logoutOverlay.setAttribute("role", "dialog");
  logoutOverlay.setAttribute("aria-modal", "true");
  logoutOverlay.setAttribute("aria-label", "로그아웃 확인");
  logoutOverlay.innerHTML = `
    <div class="logout-card" id="authLogoutCard">
      <div class="logout-card-emoji" id="logoutCardEmoji">
        <img src="웹 에셋/로그아웃 질문 아이콘.svg" alt="로그아웃 확인" />
      </div>
      <h2 class="logout-card-title" id="logoutTitle">로그아웃 할까요?</h2>
      <p class="logout-card-sub" id="logoutSub"></p>
      <div class="logout-btn-row" id="logoutBtnRow">
        <button class="logout-btn-cancel" id="logoutCancelBtn">취소</button>
        <button class="logout-btn-confirm" id="logoutConfirmBtn">로그아웃</button>
      </div>
    </div>
  `;
  document.body.appendChild(logoutOverlay);

  /* ──────────────────────────────────────────
     헬퍼 함수
  ────────────────────────────────────────── */
  function getNickname() {
    return localStorage.getItem(STORAGE_KEY) || "";
  }

  function setNickname(name) {
    localStorage.setItem(STORAGE_KEY, name);
  }

  function clearNickname() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function updateAuthButton() {
    const nickname = getNickname();
    const authBtns = document.querySelectorAll("a.auth");
    const isGlobalAdmin = nickname && Array.isArray(globalAdminsList) && globalAdminsList.includes(nickname);

    authBtns.forEach(function (authBtn) {
      if (nickname) {
        const adminBadgeHtml = isGlobalAdmin
          ? '<span class="auth-admin-badge" style="background: rgba(255,255,255,0.3); border-radius: 12px; padding: 2px 7px; font-size: 11px; margin-left: 5px; font-weight: 800; vertical-align: middle; letter-spacing: -0.2px;">👑 관리자</span>'
          : "";
        authBtn.innerHTML =
          '<img src="웹 에셋/사람 아이콘.svg" alt="" class="auth-person-icon" aria-hidden="true" /><span class="auth-nickname-text">' +
          escapeHtml(nickname) +
          "</span>" +
          adminBadgeHtml;
        authBtn.classList.add("logged-in");
      } else {
        authBtn.textContent = "로그인 / 회원가입";
        authBtn.classList.remove("logged-in");
      }
    });
  }

  function openLogin() {
    const input = document.getElementById("authNicknameInput");
    const errMsg = document.getElementById("authErrorMsg");
    input.value = "";
    input.classList.remove("error");
    errMsg.textContent = "";
    loginOverlay.classList.add("visible");
    setTimeout(() => input.focus(), 150);
  }

  function closeLogin() {
    loginOverlay.classList.remove("visible");
  }

  let logoutTimer = null;

  function renderLogoutQuestion() {
    if (logoutTimer) {
      clearTimeout(logoutTimer);
      logoutTimer = null;
    }
    const emojiWrap = document.getElementById("logoutCardEmoji");
    const title = document.getElementById("logoutTitle");
    const sub = document.getElementById("logoutSub");
    const btnRow = document.getElementById("logoutBtnRow");
    const nickname = getNickname();

    if (emojiWrap) {
      emojiWrap.innerHTML =
        '<img src="웹 에셋/로그아웃 질문 아이콘.svg" alt="로그아웃 확인" />';
    }
    if (title) title.textContent = "로그아웃 할까요?";
    if (sub) {
      sub.textContent = nickname
        ? nickname + " 님, 조금 더 머물다 가세요!"
        : "";
    }
    if (btnRow) {
      btnRow.style.display = "flex";
    }
  }

  function renderLogoutComplete() {
    const emojiWrap = document.getElementById("logoutCardEmoji");
    const title = document.getElementById("logoutTitle");
    const sub = document.getElementById("logoutSub");
    const btnRow = document.getElementById("logoutBtnRow");

    if (emojiWrap) {
      emojiWrap.innerHTML =
        '<img src="웹 에셋/로그아웃 완료 아이콘.svg" alt="로그아웃 완료" class="auth-complete-pop" />';
    }
    if (title) title.textContent = "로그아웃 되었습니다";
    if (sub) sub.textContent = "다음에 또 만나요!";
    if (btnRow) btnRow.style.display = "none";

    logoutTimer = setTimeout(function () {
      closeLogout();
      setTimeout(renderLogoutQuestion, 300);
    }, 1200);
  }

  function openLogout() {
    renderLogoutQuestion();
    logoutOverlay.classList.add("visible");
  }

  function closeLogout() {
    if (logoutTimer) {
      clearTimeout(logoutTimer);
      logoutTimer = null;
    }
    logoutOverlay.classList.remove("visible");
  }

  function validateNickname(val) {
    if (!val || val.trim().length < 2) return "닉네임은 2자 이상이어야 해요.";
    if (val.trim().length > 10) return "닉네임은 10자 이하여야 해요.";
    if (!/^[가-힣a-zA-Z0-9_\-.]+$/.test(val.trim()))
      return "특수문자는 _ - . 만 사용 가능해요.";

    // 비속어 및 금칙어 검사
    if (window.checkProfanity) {
      const profanity = window.checkProfanity(val.trim());
      if (profanity.isBad) {
        return "사용 불가능한 단어가 포함되어 있습니다.";
      }
    }
    return "";
  }

  function handleLogin() {
    const input = document.getElementById("authNicknameInput");
    const errMsg = document.getElementById("authErrorMsg");
    const val = input.value;
    const err = validateNickname(val);

    if (err) {
      input.classList.add("error");
      errMsg.textContent = err;
      if (err === "사용 불가능한 단어가 포함되어 있습니다." && window.showProfanityAlert) {
        window.showProfanityAlert("사용 불가능한 단어가 포함되어 있습니다.");
      }
      input.focus();
      return;
    }

    setNickname(val.trim());
    updateAuthButton();
    closeLogin();
    window.dispatchEvent(new CustomEvent("authChanged"));
  }

  /* ──────────────────────────────────────────
     이벤트 바인딩
  ────────────────────────────────────────── */
  // 로그인 팝업
  document
    .getElementById("authLoginClose")
    .addEventListener("click", closeLogin);
  document
    .getElementById("authConfirmBtn")
    .addEventListener("click", handleLogin);
  document
    .getElementById("authNicknameInput")
    .addEventListener("keydown", function (e) {
      if (e.key === "Enter") handleLogin();
      if (e.key === "Escape") closeLogin();
      // 에러 상태 초기화
      this.classList.remove("error");
      document.getElementById("authErrorMsg").textContent = "";
    });

  // 오버레이 배경 클릭 시 닫기
  loginOverlay.addEventListener("click", function (e) {
    if (e.target === loginOverlay) closeLogin();
  });

  // 로그아웃 팝업
  document
    .getElementById("logoutCancelBtn")
    .addEventListener("click", closeLogout);
  document
    .getElementById("logoutConfirmBtn")
    .addEventListener("click", function () {
      clearNickname();
      updateAuthButton();
      window.dispatchEvent(new CustomEvent("authChanged"));
      renderLogoutComplete();
    });
  logoutOverlay.addEventListener("click", function (e) {
    if (e.target === logoutOverlay) closeLogout();
  });

  // ESC 키
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeLogin();
      closeLogout();
    }
  });

  // nav .auth 버튼 클릭 이벤트
  function bindAuthButton() {
    const authBtns = document.querySelectorAll("a.auth");
    authBtns.forEach(function (authBtn) {
      authBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if (getNickname()) {
          openLogout();
        } else {
          openLogin();
        }
      });
    });
  }

  // 채팅바/리뷰 로그인 유도 버튼의 퍼즐 아이콘을 커스텀 로그인 아이콘으로 자동 변환 (호환성 보장)
  function upgradeReviewLoginPrompts() {
    document.querySelectorAll(".review-login-prompt").forEach(function (promptBtn) {
      const spans = promptBtn.querySelectorAll("span");
      spans.forEach(function (s) {
        if (s.textContent.trim() === "🧩") {
          const img = document.createElement("img");
          img.src = "웹 에셋/로그인 아이콘.svg";
          img.alt = "";
          img.className = "review-prompt-icon";
          img.setAttribute("aria-hidden", "true");
          s.replaceWith(img);
        }
      });
    });
  }

  /* ──────────────────────────────────────────
     초기화
  ────────────────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      updateAuthButton();
      bindAuthButton();
      upgradeReviewLoginPrompts();
    });
  } else {
    updateAuthButton();
    bindAuthButton();
    upgradeReviewLoginPrompts();
  }
})();
