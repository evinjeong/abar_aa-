import fs from 'fs';

const vendors = JSON.parse(fs.readFileSync('./src/data/vendors.json', 'utf8'));
const missingNames = [
    "거래처",
    "런드리라운지24 기장교리점",
    "주식회사 금오석재",
    "언니재가노인복지센터",
    "주식회사 미디어닥터",
    "(주)한쇼핑",
    "주식회사 더원쇼핑",
    "주식회사 제이커머스",
    "주식회사 홀리치",
    "tamall",
    "주식회사 인포벨",
    "주식회사 애드크로스",
    "차밍댄스 스튜디오",
    "철마한우",
    "주식회사 에쎄르",
    "주식회사 다파농",
    "(주)골든콘",
    "지유홈쇼핑",
    "(주)엔에스쇼핑",
    "새미집",
    "주식회사 스틸세븐(Still7 Co., Ltd.)",
    "(주)두루원",
    "주식회사 그루앤컴퍼니",
    "(주)히말라야코리아",
    "(주)효성물산",
    "지니스타",
    "(주)미르씨푸드",
    "코웨이(주)",
    "주식회사 케이티",
    "펜타플렉스부동산공인중개사사무소",
    "SK브로드밴드(주)",
    "LG유플러스",
    "유디텔레콤(UD TELECOM)",
    "(주)아비스인터내셔날",
    "(주)피스테이션",
    "미래컴퓨터",
    "소망기업박스바다",
    "쿠팡 주식회사",
    "세무회계창진",
    "(주)페이퍼애드",
    "주식회사 서문",
    "덕흥수출포장",
    "주식회사 에스엔씨메이드",
    "(주）가온아이",
    "ToGood",
    "스타물류",
    "십일번가 주식회사",
    "네이버 주식회사",
    "네이버파이낸셜 주식회사",
    "주식회사 카카오",
    "쿠팡풀필먼트서비스(유)",
    "주식회사 지마켓",
    "(주)지에스리테일홈쇼핑",
    "(du)유디아이디",
    "(주)케이지이니시스",
    "씨제이대한통운㈜",
    "(주)홈앤쇼핑",
    "(주)다우기술",
    "구글코리아 유한회사",
    "(주)케이티알파",
    "(주)한려엔쵸비",
    "주식회사 제이엠상사",
    "비앤포텍",
    "더블제이",
    "와우프레스（주）",
    "(주)청아무역",
    "（주）동방다보아",
    "나이스정보통신(주)",
    "알리익스프레스코리아 유한회사"
];

let nextNo = Math.max(...vendors.map(v => v.no)) + 1;
const existingSet = new Set(vendors.map(v => v.name));

missingNames.forEach(name => {
    if (existingSet.has(name)) return;
    if (name.includes("매출") || name.includes("매입") || name.includes("합계") || name.includes("이월") || name.includes("누계") || name === "거래처") return;

    let category = "업체";
    if (name.includes("쇼핑") || name.includes("스토어") || name.includes("네이버") || name.includes("쿠팡") || name.includes("알리") || name.includes("지마켓") || name.includes("옥션") || name.includes("11번가") || name.includes("티몬") || name.includes("위메프")) category = "쇼핑몰";

    vendors.push({
        no: nextNo++,
        name: name,
        code: "AUTO",
        category: category
    });
});

fs.writeFileSync('./src/data/vendors.json', JSON.stringify(vendors, null, 2));
console.log(`Updated vendors to ${vendors.length} total.`);
