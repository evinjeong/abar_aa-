import fs from 'fs';

const vendors = JSON.parse(fs.readFileSync('./src/data/vendors.json', 'utf8'));
const missingNames = [
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
    "주식회사 비즈제이"
];

let nextNo = Math.max(...vendors.map(v => v.no)) + 1;

missingNames.forEach(name => {
    // Check if name contains "쇼핑" to guess category as "홈쇼핑" or "쇼핑몰"
    let category = "업체";
    if (name.includes("쇼핑")) category = "홈쇼핑";

    vendors.push({
        no: nextNo++,
        name: name,
        code: "AUTO",
        category: category
    });
});

fs.writeFileSync('./src/data/vendors.json', JSON.stringify(vendors, null, 2));
console.log(`Added ${missingNames.length} missing vendors to vendors.json`);
