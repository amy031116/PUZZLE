/**
 * creator-accounts.js
 *
 * 각 상세 페이지별 제작자 전용 비밀 닉네임 설정 파일
 *
 * [원리 및 사용법]
 * 1. 상세 페이지 화면에는 항상 학생의 실명(예: '박서현')이 정상 표시됩니다.
 * 2. 누군가 로그인 창에 실명('박서현')을 입력하더라도 일반 관람객으로 취급되어 비밀 리뷰를 볼 수 없습니다.
 * 3. 아래 각 작품의 'secretNicknames'에 등록된 [비밀 닉네임]으로 로그인해야만 해당 작품의 관리자 권한(비밀 리뷰 열람 및 작성)이 활성화됩니다.
 * 4. 비밀 닉네임으로 리뷰를 작성하더라도, 다른 관람객 화면에는 비밀 닉네임이 노출되지 않고 학생 실명(예: 👑 박서현)으로 안전하게 변환되어 표시됩니다.
 * 5. 비밀 닉네임은 여러 개(학번, 본인만의 암호 닉네임 등)를 배열로 자유롭게 추가/수정하실 수 있습니다.
 */

// 전체 총괄 관리자 (모든 상세 페이지의 비밀 리뷰 열람 가능)
export const GLOBAL_ADMINS = ["야무지니"];

// 각 작품 상세 페이지별 계정 및 비밀 닉네임 매핑
export const CREATOR_ACCOUNTS = {
  detail_1: {
    creatorName: "강재준",
    secretNicknames: ["강재준_admin"],
  },
  detail_2: {
    creatorName: "강재준",
    secretNicknames: ["강재준_admin"],
  },
  detail_3: {
    creatorName: "고예원",
    secretNicknames: ["고예원_admin"],
  },
  detail_4: {
    creatorName: "곽지윤",
    secretNicknames: ["곽지윤_admin"],
  },
  detail_5: {
    creatorName: "곽지윤",
    secretNicknames: ["곽지윤_admin"],
  },
  detail_6: {
    creatorName: "권다혜",
    secretNicknames: ["권다혜_admin"],
  },
  detail_7: {
    creatorName: "권다혜",
    secretNicknames: ["권다혜_admin"],
  },
  detail_8: {
    creatorName: "김연진",
    secretNicknames: ["김연진_admin"],
  },
  detail_9: {
    creatorName: "김연진",
    secretNicknames: ["김연진_admin"],
  },
  detail_10: {
    creatorName: "김지은",
    secretNicknames: ["김지은_admin"],
  },
  detail_11: {
    creatorName: "김지은",
    secretNicknames: ["김지은_admin"],
  },
  detail_12: {
    creatorName: "노유민",
    secretNicknames: ["노유민_admin"],
  },
  detail_13: {
    creatorName: "노유민",
    secretNicknames: ["노유민_admin"],
  },
  detail_14: {
    creatorName: "박서현",
    secretNicknames: ["박서현_admin"],
  },
  detail_15: {
    creatorName: "심가애",
    secretNicknames: ["가애"],
  },
  detail_16: {
    creatorName: "심가애",
    secretNicknames: ["가애"],
  },
  detail_17: {
    creatorName: "안지윤",
    secretNicknames: ["안지윤_admin"],
  },
  detail_18: {
    creatorName: "안지윤",
    secretNicknames: ["안지윤_admin"],
  },
  detail_19: {
    creatorName: "양미진",
    secretNicknames: ["양미진_admin"],
  },
  detail_20: {
    creatorName: "양미진",
    secretNicknames: ["양미진_admin"],
  },
  detail_21: {
    creatorName: "양소정",
    secretNicknames: ["양소정_admin"],
  },
  detail_22: {
    creatorName: "양소정",
    secretNicknames: ["양소정_admin"],
  },
  detail_23: {
    creatorName: "염화영",
    secretNicknames: ["염화영_admin"],
  },
  detail_24: {
    creatorName: "염화영",
    secretNicknames: ["염화영_admin"],
  },
  detail_25: {
    creatorName: "이경민",
    secretNicknames: ["이경민_admin"],
  },
  detail_26: {
    creatorName: "이경민",
    secretNicknames: ["이경민_admin"],
  },
  detail_27: {
    creatorName: "이영윤",
    secretNicknames: ["이영윤_admin"],
  },
  detail_28: {
    creatorName: "이영윤",
    secretNicknames: ["이영윤_admin"],
  },
  detail_29: {
    creatorName: "이준규",
    secretNicknames: ["이준규_admin"],
  },
  detail_30: {
    creatorName: "이준규",
    secretNicknames: ["이준규_admin"],
  },
  detail_31: {
    creatorName: "이희서",
    secretNicknames: ["야무지니"],
  },
  detail_32: {
    creatorName: "임재윤",
    secretNicknames: ["임재윤_admin"],
  },
  detail_33: {
    creatorName: "임재윤",
    secretNicknames: ["임재윤_admin"],
  },
  detail_34: {
    creatorName: "임호진",
    secretNicknames: ["임호진_admin"],
  },
  detail_35: {
    creatorName: "임호진",
    secretNicknames: ["임호진_admin"],
  },
  detail_36: {
    creatorName: "장명경",
    secretNicknames: ["장명경_admin"],
  },
  detail_37: {
    creatorName: "장명경",
    secretNicknames: ["장명경_admin"],
  },
  detail_38: {
    creatorName: "장영찬",
    secretNicknames: ["장영찬_admin"],
  },
  detail_39: {
    creatorName: "장영찬",
    secretNicknames: ["장영찬_admin"],
  },
  detail_40: {
    creatorName: "정인서",
    secretNicknames: ["inseo314"],
  },
  detail_41: {
    creatorName: "정인서",
    secretNicknames: ["inseo314"],
  },
  detail_42: {
    creatorName: "정지우",
    secretNicknames: ["정지우_admin"],
  },
  detail_43: {
    creatorName: "정지우",
    secretNicknames: ["정지우_admin"],
  },
  detail_44: {
    creatorName: "진서연",
    secretNicknames: ["진서연"],
  },
  detail_45: {
    creatorName: "진서연",
    secretNicknames: ["진서연"],
  },
  detail_46: {
    creatorName: "채민서",
    secretNicknames: ["채민서_admin"],
  },
  detail_47: {
    creatorName: "홍민영",
    secretNicknames: ["HongMinYoung"],
  },
  detail_48: {
    creatorName: "홍민영",
    secretNicknames: ["HongMinYoung"],
  },
  eundan: {
    creatorName: "이희서",
    secretNicknames: ["이희서_admin", "이희서"],
  },
};
