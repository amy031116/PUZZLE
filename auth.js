/**
 * auth.js — PUZZLE 웹사이트 닉네임 로그인 시스템
 * 모든 HTML 페이지에서 공유 사용 (localStorage 기반)
 */
(function () {
  "use strict";

  const STORAGE_KEY = "puzzle_nickname";

  /* ──────────────────────────────────────────
     CSS 삽입
  ────────────────────────────────────────── */
  const style = document.createElement("style");
  style.textContent = `
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
      font-family: "Paperlogy", Pretendard, "Noto Sans KR", sans-serif;
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

    .auth-card-emoji { font-size: 44px; margin-bottom: 10px; }

    .auth-card-title {
      font-size: 22px;
      font-weight: 800;
      color: #111;
      margin: 0 0 6px;
      letter-spacing: -0.3px;
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
      font-family: "Paperlogy", Pretendard, "Noto Sans KR", sans-serif;
      outline: none;
      transition: border-color 0.2s;
      background: #fafafa;
      color: #111;
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
      font-family: "Paperlogy", Pretendard, "Noto Sans KR", sans-serif;
    }
    .auth-overlay.visible .logout-card {
      transform: translateY(0) scale(1);
    }

    .logout-card-emoji { font-size: 38px; margin-bottom: 10px; }
    .logout-card-title {
      font-size: 18px;
      font-weight: 800;
      color: #111;
      margin: 0 0 6px;
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
      background: linear-gradient(135deg, #ff2482, #ff6aab) !important;
      color: #fff !important;
      border-radius: 20px !important;
      padding: 6px 16px !important;
      font-weight: 700 !important;
      transition: opacity 0.2s !important;
      text-decoration: none !important;
    }
    .auth.logged-in:hover { opacity: 0.85 !important; }
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
      <div class="auth-card-emoji">🧩</div>
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
      <div class="logout-card-emoji">👋</div>
      <h2 class="logout-card-title" id="logoutTitle">로그아웃 할까요?</h2>
      <p class="logout-card-sub" id="logoutSub"></p>
      <div class="logout-btn-row">
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

  function updateAuthButton() {
    const nickname = getNickname();
    const authBtn = document.querySelector("a.auth");
    if (!authBtn) return;

    if (nickname) {
      authBtn.textContent = "👤 " + nickname;
      authBtn.classList.add("logged-in");
    } else {
      authBtn.textContent = "로그인 / 회원가입";
      authBtn.classList.remove("logged-in");
    }
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

  function openLogout() {
    const nickname = getNickname();
    const sub = document.getElementById("logoutSub");
    sub.textContent = nickname ? nickname + " 님, 조금 더 머물다 가세요!" : "";
    logoutOverlay.classList.add("visible");
  }

  function closeLogout() {
    logoutOverlay.classList.remove("visible");
  }

  function validateNickname(val) {
    if (!val || val.trim().length < 2) return "닉네임은 2자 이상이어야 해요.";
    if (val.trim().length > 10) return "닉네임은 10자 이하여야 해요.";
    if (!/^[가-힣a-zA-Z0-9_\-.]+$/.test(val.trim()))
      return "특수문자는 _ - . 만 사용 가능해요.";
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
      closeLogout();
      window.dispatchEvent(new CustomEvent("authChanged"));
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
    const authBtn = document.querySelector("a.auth");
    if (!authBtn) return;
    authBtn.addEventListener("click", function (e) {
      e.preventDefault();
      if (getNickname()) {
        openLogout();
      } else {
        openLogin();
      }
    });
  }

  /* ──────────────────────────────────────────
     초기화
  ────────────────────────────────────────── */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      updateAuthButton();
      bindAuthButton();
    });
  } else {
    updateAuthButton();
    bindAuthButton();
  }
})();
