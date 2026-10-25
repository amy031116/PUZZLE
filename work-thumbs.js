/**
 * work-thumbs.js
 * PUZZLE 작품 썸네일 통합 연동 시스템
 *
 * 1. work.html 과 main.html 양쪽에서 공통으로 작품 카드 썸네일을 자동 연동합니다.
 * 2. work.html 에서 카드를 수정(<img src="...">)하면 이를 자동 감지하여 메인 페이지 퍼즐 카드에도 즉시 반영합니다.
 * 3. 아래 DEFAULT_THUMBS 에 직접 이미지 경로를 입력해도 양쪽 페이지에 모두 자동 반영됩니다.
 */
(function () {
  "use strict";

  // 기본 등록된 작품별 썸네일 이미지 경로 (작품 ID: 이미지 경로)
  const DEFAULT_THUMBS = {
    1: "ㅎ_강재준/강재준_작품1번.webp",
    2: "ㅎ_강재준/강재준_작품2번.webp",
    3: "ㅎ_고예원/고예원_썸네일.webp",
    4: "ㅎ_곽지윤/main, work 작품 1.webp",
    5: "ㅎ_곽지윤/main, work 작품 2.webp",
    6: "ㅎ_권다혜/작품1.webp",
    7: "ㅎ_권다혜/작품2.webp",
    8: "ㅎ_김연진/작품1.webp",
    9: "ㅎ_김연진/작품2.webp",
    10: "ㅎ_김지은/작품1.webp",
    11: "ㅎ_김지은/작품2.webp",
    12: "ㅎ_노유민/노유민_작품1_썸네일.webp",
    13: "ㅎ_노유민/노유민_작품2_썸네일.webp",
    14: "ㅎ_박서현/Page_Thumbnail.webp",
    15: "ㅎ_심가애/심가애_작품1.webp",
    16: "ㅎ_심가애/심가애_작품2.webp",
    17: "ㅎ_안지윤/작품1.webp",
    18: "ㅎ_안지윤/작품2.webp",
    19: "ㅎ_양미진/작품1.webp",
    20: "ㅎ_양미진/작품2.webp",
    21: "ㅎ_양소정/1.webp",
    22: "ㅎ_양소정/2.webp",
    23: "ㅎ_염화영/작품1.webp",
    24: "ㅎ_염화영/작품2.webp",
    25: "ㅎ_이경민/작품1.webp",
    26: "ㅎ_이경민/작품2.webp",
    27: "ㅎ_이영윤/이영윤_작품1_Main,Work.webp",
    28: "ㅎ_이영윤/이영윤_작품2_Main,Work.webp",
    29: "ㅎ_이준규/1.webp",
    30: "ㅎ_이준규/2.webp",
    31: "ㅎ_이희서/작품1.webp",
    32: "ㅎ_임재윤/작품1.webp",
    33: "ㅎ_임재윤/작품2.webp",
    34: "ㅎ_임호진/임호진_썸네일_작품1.webp",
    35: "ㅎ_임호진/임호진_썸네일_작품2.webp",
    36: "ㅎ_장명경/작품 1.webp",
    37: "ㅎ_장명경/작품 2.webp",
    38: "ㅎ_장영찬/작품 1.webp",
    39: "ㅎ_장영찬/작품 2.webp",
    40: "ㅎ_정인서/작품1.webp",
    41: "ㅎ_정인서/작품2.webp",
    42: "ㅎ_정지우/작품 1.webp",
    43: "ㅎ_정지우/작품 2.webp",
    44: "ㅎ_진서연/진서연_작품1.webp",
    45: "ㅎ_진서연/진서연_작품2.webp",
    46: "ㅎ_채민서/작품1.webp",
    47: "ㅎ_홍민영/작품1.webp",
    48: "ㅎ_홍민영/작품2.webp",
  };

  const STORAGE_KEY = "puzzle_work_thumbs";

  function getStoredThumbs() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (e) {
      return {};
    }
  }

  function saveStoredThumbs(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  // 전역 객체 등록
  window.WORK_THUMBS = Object.assign({}, DEFAULT_THUMBS, getStoredThumbs());

  // 썸네일 조회 함수 (localStorage 캐시 + DEFAULT_THUMBS 우선순위)
  window.getWorkThumb = function (id) {
    if (!id) return "";
    const numId = Number(id);
    const stored = getStoredThumbs();
    if (stored[numId]) return stored[numId];
    if (window.WORK_THUMBS && window.WORK_THUMBS[numId])
      return window.WORK_THUMBS[numId];
    if (DEFAULT_THUMBS[numId]) return DEFAULT_THUMBS[numId];
    return "";
  };

  // 썸네일 등록 함수
  window.setWorkThumb = function (id, src) {
    if (!id) return;
    const numId = Number(id);
    const stored = getStoredThumbs();
    if (src) {
      window.WORK_THUMBS[numId] = src;
      stored[numId] = src;
    } else {
      delete window.WORK_THUMBS[numId];
      delete stored[numId];
    }
    saveStoredThumbs(stored);
  };

  // work.html 페이지 전용: DOM에서 <img src="...">를 자동 스캔하여 동기화
  function syncWorkPage() {
    const isWorkPage =
      window.location.pathname.includes("work.html") ||
      document.querySelector(".blue-works");
    if (!isWorkPage) return;

    let hasChange = false;
    const stored = getStoredThumbs();

    // 1. 하단 파란 영역 (.blue-works) 카드 스캔
    document
      .querySelectorAll(".blue-works .work-item a.card")
      .forEach((link) => {
        const href = link.getAttribute("href") || "";
        const match = href.match(/detail_(\d+)\.html/);
        if (!match) return;

        const id = Number(match[1]);
        const img = link.querySelector("img");

        if (img) {
          const src = (img.getAttribute("src") || "").trim();
          if (src) {
            if (stored[id] !== src) {
              stored[id] = src;
              window.WORK_THUMBS[id] = src;
              hasChange = true;
            }
          } else if (DEFAULT_THUMBS[id]) {
            img.setAttribute("src", DEFAULT_THUMBS[id]);
            if (stored[id] !== DEFAULT_THUMBS[id]) {
              stored[id] = DEFAULT_THUMBS[id];
              window.WORK_THUMBS[id] = DEFAULT_THUMBS[id];
              hasChange = true;
            }
          } else if (stored[id] && !DEFAULT_THUMBS[id]) {
            delete stored[id];
            if (window.WORK_THUMBS) delete window.WORK_THUMBS[id];
            hasChange = true;
          }
        }
      });

    // 2. 상단/트렌드 영역 (.trend) 카드에도 썸네일 자동 동기화
    document
      .querySelectorAll(".section.trend a.card, .trend a.card")
      .forEach((link) => {
        const href = link.getAttribute("href") || "";
        const match = href.match(/detail_(\d+)\.html/);
        if (!match) return;

        const id = Number(match[1]);
        const thumb = window.getWorkThumb(id);
        if (thumb) {
          let img = link.querySelector("img");
          if (!img) {
            img = document.createElement("img");
            link.appendChild(img);
          }
          if (img.getAttribute("src") !== thumb) {
            img.src = thumb;
            img.alt = `작품 ${id}`;
          }
        }
      });

    if (hasChange) {
      saveStoredThumbs(stored);
    }

    // 이미지 로드 실패 시 깨진 아이콘 방지
    document.querySelectorAll(".card img").forEach((img) => {
      img.addEventListener("error", function () {
        this.style.display = "none";
      });
    });
  }

  // main.html 등 다른 페이지에서 work.html 의 최신 img src 스캔 시도 (비동기)
  function syncFromOtherPages() {
    const isOtherPage =
      !document.querySelector(".blue-works") &&
      !window.location.pathname.includes("work.html");
    if (!isOtherPage || typeof fetch !== "function") return;

    fetch("work.html")
      .then((res) => (res.ok ? res.text() : ""))
      .then((html) => {
        if (!html) return;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        let changed = false;
        const currentStored = getStoredThumbs();

        doc
          .querySelectorAll(".blue-works .work-item a.card")
          .forEach((link) => {
            const href = link.getAttribute("href") || "";
            const m = href.match(/detail_(\d+)\.html/);
            if (!m) return;

            const id = Number(m[1]);
            const img = link.querySelector("img");
            if (img) {
              const src = (img.getAttribute("src") || "").trim();
              if (src && currentStored[id] !== src) {
                currentStored[id] = src;
                window.WORK_THUMBS[id] = src;
                changed = true;
              } else if (!src && !DEFAULT_THUMBS[id] && currentStored[id]) {
                delete currentStored[id];
                if (window.WORK_THUMBS) delete window.WORK_THUMBS[id];
                changed = true;
              }
            }
          });

        if (changed) {
          saveStoredThumbs(currentStored);
          if (typeof window.refreshPuzzleThumbs === "function") {
            window.refreshPuzzleThumbs();
          }
        }
      })
      .catch(() => {});
  }

  function init() {
    syncWorkPage();
    syncFromOtherPages();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
