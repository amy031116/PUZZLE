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

// 해당 작품의 고유 ID와 창작자 닉네임 설정
const WORK_ID = "eundan";
const CREATOR_NICKNAME = "이희서"; // 이 닉네임으로 로그인시 모든 방명록 내용이 보입니다.

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const reviewsRef = ref(db, `reviews_${WORK_ID}`);
const RATINGS_PATH = `ratings_${WORK_ID}`;

// 파이어베이스 경로에 사용할 수 없는 특수문자 제거
function getSafeUserKey() {
  const user = getCurrentUser();
  if (!user) return null;
  return user.replace(/[\.\#\$\[\]]/g, '_');
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

function isCreator() {
  return getCurrentUser() === CREATOR_NICKNAME;
}

// ── 별점 기능 (팝업) ──
function openRatingPopup() {
  const user = getCurrentUser();
  if (!user) {
    document.querySelector("a.auth").click(); // 로그인 창 띄우기
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
  set(ref(db, `${RATINGS_PATH}/${safeUser}`), {
    score: score,
    timestamp: serverTimestamp()
  }).catch(err => {
    console.error("별점 저장 실패:", err);
    showCustomAlert("별점 저장에 실패했어요. (" + err.message + ")", "😢");
  });
}

function loadMyRating() {
  const safeUser = getSafeUserKey();
  if (!safeUser) {
    currentRating = 0;
    hasRated = false;
    highlightStars(0);
    return;
  }
  onValue(ref(db, `${RATINGS_PATH}/${safeUser}`), (snap) => {
    if (snap.exists()) {
      currentRating = snap.val().score;
      hasRated = true;
      highlightStars(currentRating);
    } else {
      currentRating = 0;
      hasRated = false;
      highlightStars(0);
    }
  });
}

// 총 리뷰수 가져오기
function loadReviewCount() {
  onValue(reviewsRef, (snap) => {
    const count = snap.exists() ? Object.keys(snap.val()).length : 0;
    reviewCountBtn.textContent = `(${count})`;
  });
}

// ── 사이드바 ──
function openSidebar() {
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
    snap.forEach((childSnap) => {
      renderReview(childSnap.val());
    });
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

  const item = document.createElement("div");
  item.className = "detail-review-item";
  if (isMine) item.classList.add("mine");
  if (review.author === CREATOR_NICKNAME) item.classList.add("creator-review");

  const authorDiv = document.createElement("div");
  authorDiv.className = "detail-review-author";
  authorDiv.textContent = review.author === CREATOR_NICKNAME ? "👑 " + review.author : review.author;

  // 색상 배정
  const brandColors = ["#ff2482", "#407dff", "#f8c219"];
  let hash = 0;
  for (let i = 0; i < review.author.length; i++) {
    hash = review.author.charCodeAt(i) + ((hash << 5) - hash);
  }
  authorDiv.style.color = review.author === CREATOR_NICKNAME ? "#ff2482" : brandColors[Math.abs(hash) % brandColors.length];

  const contentDiv = document.createElement("div");
  contentDiv.className = "detail-review-content";

  // 내용 노출 로직: 내 글이거나 제작자면 다 보임. 남의 글이면 블라인드 처리. (제작자가 쓴 공지성 글은 모두에게 보이게 처리 가능)
  if (isMine || creatorMode || review.author === CREATOR_NICKNAME) {
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

  const now = Date.now();
  if (now - lastSentAt < 2000) return;
  lastSentAt = now;

  input.value = "";
  push(reviewsRef, {
    author: user,
    content: text.slice(0, 150),
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
  // 유저가 바뀌면(예: 창작자로 로그인) 목록 다시 불러오기
  subscribeReviews();
  loadMyRating();
}

window.addEventListener("authChanged", updateAuthUI);

// 초기화
loadReviewCount();
updateAuthUI();
