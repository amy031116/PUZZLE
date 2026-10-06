import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  query,
  orderByChild,
  limitToLast,
  onChildAdded,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";

(function () {
  "use strict";

  const MAX_REVIEWS = 100; // 화면에 유지/구독할 최대 개수
  const SEND_COOLDOWN_MS = 2000; // 도배 방지
  let lastSentAt = 0;

  // Firebase 초기화
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const reviewsRef = ref(db, "reviews");

  // CSS injection
  const style = document.createElement("style");
  style.textContent = `
    .reviews-container {
      position: fixed;
      bottom: 30px;
      left: 40px;
      width: 25vw;
      min-width: 280px;
      max-width: 400px;
      height: 45vh;
      max-height: 400px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      pointer-events: none; /* Allows clicking behind it for the container itself */
    }
    
    @media (max-width: 768px) {
      .reviews-container {
        left: 20px;
        bottom: 20px;
        width: calc(100vw - 40px);
        height: 35vh;
      }
    }

    .reviews-list-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      overflow: hidden;
      margin-bottom: 12px;
      /* Mask to fade out the top part */
      -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 25%, black 100%);
      mask-image: linear-gradient(to bottom, transparent 0%, black 25%, black 100%);
    }

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 50px; /* Space for items to fade out into */
      overflow-y: auto;
      pointer-events: auto;
      scrollbar-width: none; /* Firefox */
    }
    .reviews-list::-webkit-scrollbar {
      display: none; /* Chrome/Safari */
    }

    .review-item {
      background: #ffffff; /* 불투명하게 처리하여 뒤쪽 배경색이 비치지 않게 함 */
      padding: 12px 16px;
      border-radius: 16px;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25); /* 그림자값을 더 강하게 */
      animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      font-family: "Paperlogy", Pretendard, "Noto Sans KR", sans-serif;
      word-break: break-word;
      pointer-events: auto;
    }

    @keyframes slideUpFade {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }

    .review-author {
      font-weight: 700;
      font-size: 13.5px;
      margin-bottom: 4px;
    }

    .review-content {
      font-size: 14.5px;
      color: #333;
      line-height: 1.4;
    }

    .review-form-wrapper {
      pointer-events: auto;
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      padding: 6px;
      display: none; /* hidden by default, shown if logged in */
      opacity: 0;
      transform: translateY(10px) scale(0.98);
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .review-form-wrapper.visible {
      display: block;
      opacity: 1;
      transform: translateY(0) scale(1);
    }

    .review-form {
      display: flex;
      gap: 6px;
    }

    .review-input {
      flex: 1;
      min-width: 0; /* 좁아질 때 버튼을 밀어내지 않고 입력창이 먼저 줄어들게 */
      border: none;
      background: transparent;
      padding: 10px 14px;
      font-family: "Paperlogy", Pretendard, "Noto Sans KR", sans-serif;
      font-size: 14.5px;
      outline: none;
      color: #333;
    }

    .review-input::placeholder {
      color: #aaa;
    }

    .review-submit-btn {
      background: linear-gradient(135deg, var(--blue, #407dff), #6b9cff);
      color: #fff;
      border: none;
      border-radius: 14px;
      padding: 0 18px;
      flex-shrink: 0; /* 버튼 크기 고정 */
      white-space: nowrap; /* 글자 세로 줄바꿈 방지 */
      word-break: keep-all;
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
    }

    .review-submit-btn:hover {
      opacity: 0.9;
    }
    
    .review-submit-btn:active {
      transform: scale(0.96);
    }

    .review-login-prompt {
      pointer-events: auto;
      display: none;
      align-items: center;
      justify-content: center;
      gap: 8px;
      white-space: nowrap; /* 문구 줄바꿈 방지 */
      width: 100%;
      box-sizing: border-box;
      background: #fff;
      border: none;
      border-radius: 20px;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      padding: 16px 18px;
      font-family: "Paperlogy", Pretendard, "Noto Sans KR", sans-serif;
      font-size: 14.5px;
      font-weight: 700;
      color: #555;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.2s;
    }

    .review-login-prompt.visible {
      display: flex;
    }

    .review-login-prompt:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 22px rgba(0, 0, 0, 0.16);
    }

    .review-login-prompt:active {
      transform: scale(0.98);
    }

    .review-login-prompt .prompt-accent {
      color: #ff2482;
    }
  `;
  document.head.appendChild(style);

  // DOM 구조 생성
  const container = document.createElement("div");
  container.className = "reviews-container";
  container.innerHTML = `
    <div class="reviews-list-wrapper">
      <div class="reviews-list" id="reviewsList"></div>
    </div>
    <div class="review-form-wrapper" id="reviewFormWrapper">
      <form class="review-form" id="reviewForm">
        <input type="text" class="review-input" id="reviewInput" placeholder="리뷰를 남겨주세요..." required autocomplete="off" maxlength="150" />
        <button type="submit" class="review-submit-btn">전송</button>
      </form>
    </div>
    <button type="button" class="review-login-prompt" id="reviewLoginPrompt">
      <span>🧩</span>
      <span><span class="prompt-accent">로그인</span>하고 리뷰를 남겨보세요</span>
    </button>
  `;
  document.body.appendChild(container);


  /* ──────────────────────────────────────────
     로직
  ────────────────────────────────────────── */
  const listEl = document.getElementById("reviewsList");
  const formWrapper = document.getElementById("reviewFormWrapper");
  const form = document.getElementById("reviewForm");
  const input = document.getElementById("reviewInput");
  const loginPrompt = document.getElementById("reviewLoginPrompt");

  // 로그인 유도 박스 클릭 → auth.js의 로그인 팝업 열기 (nav 로그인 버튼 클릭과 동일)
  loginPrompt.addEventListener("click", function () {
    const authBtn = document.querySelector("a.auth");
    if (authBtn) authBtn.click();
  });

  function renderReview(review) {
    const item = document.createElement("div");
    item.className = "review-item";

    const author = document.createElement("div");
    author.className = "review-author";
    author.textContent = review.author;

    // 닉네임 기반으로 핑크, 블루, 옐로우 중 하나를 고정 배정 (일관성 유지)
    const brandColors = ["#ff2482", "#407dff", "#f8c219"];
    let hash = 0;
    for (let i = 0; i < review.author.length; i++) {
      hash = review.author.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorIndex = Math.abs(hash) % brandColors.length;
    author.style.color = brandColors[colorIndex];

    const content = document.createElement("div");
    content.className = "review-content";
    content.textContent = review.content;

    item.appendChild(author);
    item.appendChild(content);

    listEl.appendChild(item);

    // DOM 비대화 방지: 오래된 항목 제거
    while (listEl.children.length > MAX_REVIEWS) {
      listEl.removeChild(listEl.firstChild);
    }

    // 자동 스크롤
    requestAnimationFrame(() => {
      // 애니메이션 중 자연스러운 안착을 위해 부드러운 스크롤 사용
      listEl.scrollTo({
        top: listEl.scrollHeight,
        behavior: "smooth",
      });
    });
  }

  // 실시간 구독: 기존 리뷰는 시간순으로 먼저 오고, 이후 새 리뷰가 올 때마다 호출됨
  function subscribeReviews() {
    const q = query(reviewsRef, orderByChild("createdAt"), limitToLast(MAX_REVIEWS));
    onChildAdded(
      q,
      (snap) => {
        const v = snap.val();
        if (!v || typeof v.author !== "string" || typeof v.content !== "string") return;
        renderReview({ author: v.author, content: v.content });
      },
      (err) => console.error("리뷰 구독 실패:", err)
    );
  }

  // 로그인 상태 확인 및 폼 제어
  function checkAuthStatus() {
    const nickname = localStorage.getItem("puzzle_nickname");
    if (nickname) {
      loginPrompt.classList.remove("visible");
      // 강제 리플로우를 통해 애니메이션 적용
      formWrapper.style.display = "block";
      requestAnimationFrame(() => {
        formWrapper.classList.add("visible");
      });
    } else {
      loginPrompt.classList.add("visible");
      formWrapper.classList.remove("visible");
      setTimeout(() => {
        if (!formWrapper.classList.contains("visible")) {
          formWrapper.style.display = "none";
        }
      }, 300); // 0.3s transition
    }
  }

  // 폼 제출 이벤트 → Firebase에 전송 (화면 반영은 onChildAdded가 담당)
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const nickname = localStorage.getItem("puzzle_nickname");
    if (!nickname) {
      alert("로그인이 필요합니다.");
      return;
    }

    const text = input.value.trim();
    if (!text) return;

    const now = Date.now();
    if (now - lastSentAt < SEND_COOLDOWN_MS) return;
    lastSentAt = now;

    input.value = "";
    push(reviewsRef, {
      author: nickname,
      content: text.slice(0, 150),
      createdAt: serverTimestamp(),
    }).catch((err) => {
      console.error("리뷰 전송 실패:", err);
      input.value = text;
      alert("전송에 실패했어요. 잠시 후 다시 시도해주세요.");
    });
  });

  // auth.js 에서 발생하는 로그인/로그아웃 이벤트 감지
  window.addEventListener("authChanged", checkAuthStatus);

  // 초기화 (DOM 완벽히 로딩된 후)
  function init() {
    subscribeReviews();
    checkAuthStatus();

    // 맨 오른쪽이나 너무 딱딱하게 붙는걸 방지
    // 살짝 딜레이 주고 스크롤 아래로 내리기
    setTimeout(() => {
      listEl.scrollTop = listEl.scrollHeight;
    }, 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
