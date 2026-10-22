import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  query,
  orderByChild,
  onValue,
  serverTimestamp,
  set
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseConfig } from "./firebase-config.js";
import { checkProfanity } from "./profanity-filter.js";
import { CREATOR_ACCOUNTS, GLOBAL_ADMINS } from "./creator-accounts.js";

// 해당 작품의 고유 ID 동적 설정
function getWorkId() {
  // 1. URL 쿼리 파라미터 (예: detail.html?id=14 또는 ?workId=14)
  try {
    const params = new URLSearchParams(window.location.search);
    const qId = params.get("id") || params.get("workId");
    if (qId) return `detail_${qId}`;
  } catch (e) {}

  // 2. data-work-id 속성 확인
  if (document.body && document.body.dataset && document.body.dataset.workId) {
    return `detail_${document.body.dataset.workId}`;
  }

  // 3. 파일 경로에서 추출 (예: detail_14.html -> detail_14, detail.html -> eundan)
  try {
    const pathname = decodeURIComponent((window.location.pathname || "").split("?")[0].split("#")[0]);
    const filename = pathname.split(/[/\\]/).pop() || "";

    const detailNumMatch = filename.match(/detail_(\d+)/i);
    if (detailNumMatch) {
      return `detail_${detailNumMatch[1]}`;
    }

    if (/^detail(\.html)?$/i.test(filename)) {
      return "eundan"; // 기존 detail.html(은단) 데이터 호환
    }

    const baseName = filename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_");
    if (baseName) return `detail_${baseName}`;
  } catch (e) {}

  return "detail_default";
}

const WORK_ID = getWorkId();

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const isEundan = WORK_ID === "eundan";
const reviewsRef = ref(db, isEundan ? "reviews_eundan" : `reviews_detail/${WORK_ID}`);
const RATINGS_ROOT = isEundan ? "ratings_eundan" : `ratings_detail/${WORK_ID}`;

// 파이어베이스 경로에 사용할 수 없는 특수문자 제거
function getSafeUserKey() {
  const user = getCurrentUser();
  if (!user) return null;
  return user.replace(/[\.\#\$\[\]\/]/g, '_');
}

// 커스텀 알림 팝업 DOM
const customAlertOverlay = document.getElementById("customAlertOverlay");
const customAlertMessage = document.getElementById("customAlertMessage");
const customAlertEmoji = document.getElementById("customAlertEmoji");
const customAlertClose = document.getElementById("customAlertClose");

function showCustomAlert(msg, emoji = "💬") {
  customAlertMessage.textContent = msg;
  customAlertEmoji.textContent = emoji;
  customAlertOverlay.classList.add("visible");
}
function hideCustomAlert() {
  customAlertOverlay.classList.remove("visible");
}
customAlertClose.addEventListener("click", hideCustomAlert);
customAlertOverlay.addEventListener("click", (e) => {
  if (e.target === customAlertOverlay) hideCustomAlert();
});

// DOM 요소를 가져옵니다
const starRatingUI = document.getElementById("starRatingUI");
const stars = starRatingUI.querySelectorAll(".star");
const userScoreDisplay = document.getElementById("userScoreDisplay");
const reviewCountBtn = document.getElementById("reviewCountBtn");

const sidebarOverlay = document.getElementById("reviewSidebarOverlay");
const sidebar = document.getElementById("reviewSidebar");
const sidebarClose = document.getElementById("reviewSidebarClose");
const reviewsList = document.getElementById("detailReviewsList");

const form = document.getElementById("detailReviewForm");
const input = document.getElementById("detailReviewInput");
const submitBtn = document.getElementById("detailReviewSubmit");
const loginPrompt = document.getElementById("detailReviewLoginPrompt");

let currentRating = 0;
let hasRated = false;

const ratingPopupOverlay = document.getElementById("ratingPopupOverlay");
const popupStarUI = document.getElementById("popupStarUI");
const popupStars = popupStarUI.querySelectorAll(".popup-star");
const ratingPopupClose = document.getElementById("ratingPopupClose");

// 로그인 상태 체크
function getCurrentUser() {
  return localStorage.getItem("puzzle_nickname");
}

// 현재 작품의 창작자(제작자) 권한 체크
function isCreator() {
  const user = getCurrentUser();
  if (!user) return false;

  // 1. 글로벌 총괄 관리자 체크
  if (Array.isArray(GLOBAL_ADMINS) && GLOBAL_ADMINS.includes(user)) {
    return true;
  }

  // 2. 작품별 비밀 닉네임 설정 체크
  const account = CREATOR_ACCOUNTS[WORK_ID];
  if (account && Array.isArray(account.secretNicknames)) {
    return account.secretNicknames.includes(user);
  }

  return false;
}

// 리뷰 작성자 정보 (화면 표시용 이름 및 제작자 여부 판별)
function getDisplayAuthor(reviewAuthor) {
  if (!reviewAuthor) return { name: "익명", isCreator: false };

  // 1. 글로벌 총괄 관리자
  if (Array.isArray(GLOBAL_ADMINS) && GLOBAL_ADMINS.includes(reviewAuthor)) {
    return { name: reviewAuthor, isCreator: true };
  }

  // 2. 현재 작품의 제작자 비밀 닉네임 -> 학생 실명(creatorName)으로 안전하게 변환
  const account = CREATOR_ACCOUNTS[WORK_ID];
  if (account && Array.isArray(account.secretNicknames) && account.secretNicknames.includes(reviewAuthor)) {
    return { name: account.creatorName || reviewAuthor, isCreator: true };
  }

  // 3. 다른 작품의 제작자가 비밀 닉네임으로 작성했을 때의 변환 (비밀 닉네임 노출 방지)
  for (const key in CREATOR_ACCOUNTS) {
    const acc = CREATOR_ACCOUNTS[key];
    if (acc && Array.isArray(acc.secretNicknames) && acc.secretNicknames.includes(reviewAuthor)) {
      return { name: acc.creatorName || reviewAuthor, isCreator: false };
    }
  }

  return { name: reviewAuthor, isCreator: false };
}

// ── 별점 기능 (팝업) ──
function openRatingPopup() {
  const user = getCurrentUser();
  if (!user) {
    document.querySelector("a.auth").click(); // 로그인 창 띄우기
    return;
  }
  if (isCreator()) {
    const tip = userScoreDisplay && userScoreDisplay.title ? userScoreDisplay.title : "전체 평균 별점 모드입니다.";
    showCustomAlert(`[관리자 모드]\n현재 표시된 별점은 ${tip}`, "👑");
    return;
  }
  if (hasRated) {
    showCustomAlert("이미 별점을 남겨주셨습니다!", "😅");
    return;
  }
  highlightPopupStars(currentRating);
  ratingPopupOverlay.classList.add("visible");
}

function closeRatingPopup() {
  ratingPopupOverlay.classList.remove("visible");
}

starRatingUI.addEventListener("click", openRatingPopup);
ratingPopupClose.addEventListener("click", closeRatingPopup);
ratingPopupOverlay.addEventListener("click", (e) => {
  if (e.target === ratingPopupOverlay) closeRatingPopup();
});

// 팝업 별점 호버/클릭 이벤트
popupStars.forEach((star, index) => {
  star.addEventListener("mouseover", () => {
    highlightPopupStars(index + 1);
  });
  star.addEventListener("mouseleave", () => {
    highlightPopupStars(currentRating);
  });
  star.addEventListener("click", () => {
    if (hasRated) return;
    currentRating = index + 1;
    hasRated = true;
    saveRating(currentRating);
    highlightStars(currentRating); // 화면 즉시 업데이트 반영
    closeRatingPopup();
  });
});

function highlightPopupStars(count) {
  popupStars.forEach((star, index) => {
    if (index < count) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
}

function highlightStars(count) {
  stars.forEach((star, index) => {
    if (index < count) {
      star.classList.add("active");
    } else {
      star.classList.remove("active");
    }
  });
  userScoreDisplay.textContent = count > 0 ? count.toFixed(1) : "0.0";
}

function saveRating(score) {
  const safeUser = getSafeUserKey();
  if (!safeUser) return;
  set(ref(db, `${RATINGS_ROOT}/${safeUser}`), {
    score: score,
    workId: WORK_ID,
    timestamp: serverTimestamp()
  }).catch(err => {
    console.error("별점 저장 실패:", err);
    showCustomAlert("별점 저장에 실패했어요. (" + err.message + ")", "😢");
  });
}

let currentRatingUnsubscribe = null;

function loadRatingDisplay() {
  if (typeof currentRatingUnsubscribe === "function") {
    currentRatingUnsubscribe();
    currentRatingUnsubscribe = null;
  }

  const creatorMode = isCreator();
  let adminBadge = document.getElementById("adminRatingBadge");

  if (creatorMode) {
    // ── 관리자/제작자 모드: 전체 평균 별점 표시 ──
    if (!adminBadge && userScoreDisplay) {
      adminBadge = document.createElement("span");
      adminBadge.id = "adminRatingBadge";
      adminBadge.className = "admin-rating-badge";
      adminBadge.textContent = "평균";
      adminBadge.style.cssText =
        "font-size: 11px; background: #fff0f5; color: #ff2482; border: 1px solid #ffb3d1; border-radius: 6px; padding: 1px 5px; font-weight: 700; vertical-align: middle; margin-left: 4px;";
      userScoreDisplay.insertAdjacentElement("afterend", adminBadge);
    } else if (adminBadge) {
      adminBadge.style.display = "inline-block";
    }

    currentRatingUnsubscribe = onValue(ref(db, RATINGS_ROOT), (snap) => {
      if (!isCreator()) return;
      if (snap.exists()) {
        const data = snap.val();
        const scores = Object.values(data)
          .map((item) => (item && typeof item.score === "number" ? item.score : 0))
          .filter((s) => s > 0);

        if (scores.length > 0) {
          const sum = scores.reduce((acc, cur) => acc + cur, 0);
          const avg = sum / scores.length;
          currentRating = avg;
          highlightStars(Math.round(avg));
          userScoreDisplay.textContent = avg.toFixed(1);
          const tipText = `전체 평균 별점 (${avg.toFixed(1)}점 / ${scores.length}명 참여)`;
          userScoreDisplay.title = tipText;
          starRatingUI.title = tipText;
        } else {
          currentRating = 0;
          highlightStars(0);
          userScoreDisplay.textContent = "0.0";
          userScoreDisplay.title = "별점 참여자 없음";
          starRatingUI.title = "별점 참여자 없음";
        }
      } else {
        currentRating = 0;
        highlightStars(0);
        userScoreDisplay.textContent = "0.0";
        userScoreDisplay.title = "별점 참여자 없음";
        starRatingUI.title = "별점 참여자 없음";
      }
    });
  } else {
    // ── 일반 관람객 모드: 본인이 준 별점만 표시 ──
    if (adminBadge) {
      adminBadge.remove();
    }
    if (userScoreDisplay) userScoreDisplay.removeAttribute("title");
    if (starRatingUI) starRatingUI.removeAttribute("title");

    const safeUser = getSafeUserKey();
    if (!safeUser) {
      currentRating = 0;
      hasRated = false;
      highlightStars(0);
      if (userScoreDisplay) userScoreDisplay.textContent = "0.0";
      return;
    }

    currentRatingUnsubscribe = onValue(ref(db, `${RATINGS_ROOT}/${safeUser}`), (snap) => {
      if (isCreator()) return;
      if (snap.exists()) {
        currentRating = snap.val().score;
        hasRated = true;
        highlightStars(currentRating);
        userScoreDisplay.textContent = currentRating.toFixed(1);
      } else {
        currentRating = 0;
        hasRated = false;
        highlightStars(0);
        userScoreDisplay.textContent = "0.0";
      }
    });
  }
}

// 총 리뷰수 가져오기 (현재 작품만 카운트)
function loadReviewCount() {
  onValue(reviewsRef, (snap) => {
    let count = 0;
    if (snap.exists()) {
      if (WORK_ID === "eundan") {
        snap.forEach((childSnap) => {
          const val = childSnap.val();
          if (!val.workId || val.workId === "eundan") count++;
        });
      } else {
        count = Object.keys(snap.val()).length;
      }
    }
    reviewCountBtn.textContent = `(${count})`;
  });
}

// ── 사이드바 ──
function openSidebar() {
  const headerH2 = sidebar ? sidebar.querySelector(".review-sidebar-header h2") : null;
  if (headerH2) {
    if (isCreator()) {
      const isGlobal = Array.isArray(GLOBAL_ADMINS) && GLOBAL_ADMINS.includes(getCurrentUser());
      headerH2.innerHTML = isGlobal
        ? '리뷰 남기기 <span style="font-size: 12px; color: #ff2482; font-weight: 700; background: #fff0f5; padding: 2px 6px; border-radius: 6px; border: 1px solid #ffb3d1; vertical-align: middle; margin-left: 4px;">👑 총괄 관리자</span>'
        : '리뷰 남기기 <span style="font-size: 12px; color: #ff2482; font-weight: 700; background: #fff0f5; padding: 2px 6px; border-radius: 6px; border: 1px solid #ffb3d1; vertical-align: middle; margin-left: 4px;">👑 제작자 모드</span>';
    } else {
      headerH2.textContent = "리뷰 남기기";
    }
  }
  sidebarOverlay.classList.add("visible");
  sidebar.classList.add("visible");
  document.body.style.overflow = "hidden"; // 스크롤 방지
}

function closeSidebar() {
  sidebarOverlay.classList.remove("visible");
  sidebar.classList.remove("visible");
  document.body.style.overflow = "";
}

reviewCountBtn.addEventListener("click", openSidebar);
sidebarClose.addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);
loginPrompt.addEventListener("click", () => document.querySelector("a.auth").click());

// ── 리뷰(방명록) 불러오기 ──
function subscribeReviews() {
  const q = query(reviewsRef, orderByChild("createdAt"));
  onValue(q, (snap) => {
    reviewsList.innerHTML = "";
    if (snap.exists()) {
      snap.forEach((childSnap) => {
        const val = childSnap.val();
        if (WORK_ID === "eundan") {
          const belongs = !val.workId || val.workId === "eundan";
          if (belongs) renderReview(val);
        } else {
          renderReview(val);
        }
      });
    }
    // 스크롤 맨 아래로
    setTimeout(() => {
      reviewsList.scrollTop = reviewsList.scrollHeight;
    }, 50);
  });
}

function renderReview(review) {
  const user = getCurrentUser();
  const creatorMode = isCreator();
  const isMine = user === review.author;
  const authorInfo = getDisplayAuthor(review.author);

  const item = document.createElement("div");
  item.className = "detail-review-item";
  if (isMine) item.classList.add("mine");
  if (authorInfo.isCreator) item.classList.add("creator-review");

  const authorDiv = document.createElement("div");
  authorDiv.className = "detail-review-author";
  authorDiv.textContent = authorInfo.isCreator ? "👑 " + authorInfo.name : authorInfo.name;

  // 색상 배정
  const brandColors = ["#ff2482", "#407dff", "#f8c219"];
  let hash = 0;
  for (let i = 0; i < authorInfo.name.length; i++) {
    hash = authorInfo.name.charCodeAt(i) + ((hash << 5) - hash);
  }
  authorDiv.style.color = authorInfo.isCreator ? "#ff2482" : brandColors[Math.abs(hash) % brandColors.length];

  const contentDiv = document.createElement("div");
  contentDiv.className = "detail-review-content";

  // 내용 노출 로직: 내 글이거나 제작자면 다 보임. 남의 글이면 블라인드 처리. (제작자가 쓴 글은 모두에게 보이게 처리)
  if (isMine || creatorMode || authorInfo.isCreator) {
    contentDiv.textContent = review.content;
  } else {
    contentDiv.innerHTML = `<span class="blind-text">🔒 비밀 리뷰입니다.</span>`;
  }

  item.appendChild(authorDiv);
  item.appendChild(contentDiv);
  reviewsList.appendChild(item);
}

// ── 리뷰 작성 ──
let lastSentAt = 0;
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const user = getCurrentUser();
  if (!user) return;

  const text = input.value.trim();
  if (!text) return;

  // 비속어 및 금칙어 검사
  const profanity = checkProfanity(text);
  if (profanity.isBad) {
    showCustomAlert("사용 불가능한 단어가 포함되어 있습니다.", "⚠️");
    input.focus();
    return;
  }

  const now = Date.now();
  if (now - lastSentAt < 2000) return;
  lastSentAt = now;

  input.value = "";
  push(reviewsRef, {
    author: user,
    content: text.slice(0, 150),
    workId: WORK_ID,
    createdAt: serverTimestamp(),
  }).catch((err) => {
    console.error("리뷰 전송 실패:", err);
    input.value = text;
    showCustomAlert("전송에 실패했어요. 다시 시도해주세요.\n(" + err.message + ")", "😢");
  });
});

// 권한 갱신
function updateAuthUI() {
  const user = getCurrentUser();
  if (user) {
    loginPrompt.style.display = "none";
    form.style.display = "flex";
    input.disabled = false;
    submitBtn.disabled = false;
  } else {
    loginPrompt.style.display = "flex";
    form.style.display = "none";
    input.disabled = true;
    submitBtn.disabled = true;
  }
  console.log(`[PUZZLE] 로그인: "${user || "미로그인"}", 총괄 관리자: ${Array.isArray(GLOBAL_ADMINS) && GLOBAL_ADMINS.includes(user)}, 현재 작품 권한: ${isCreator()}`);
  // 유저가 바뀌면(예: 창작자로 로그인) 목록 다시 불러오기
  subscribeReviews();
  loadRatingDisplay();
}

window.addEventListener("authChanged", updateAuthUI);

// 초기화
loadReviewCount();
updateAuthUI();
