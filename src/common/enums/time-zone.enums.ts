// time-zone.enums.ts
// 경로: src/common/enums/time-zone.enums.ts

export enum TimeZone {
    UTC = 'UTC',
    SEOUL = 'Asia/Seoul',        // 'KST'가 아닌 'Asia/Seoul'
    TOKYO = 'Asia/Tokyo',        // 'JST'가 아닌 'Asia/Tokyo'
    NEWYORK = 'America/New_York' // 'EST'가 아닌 'America/New_York'
}