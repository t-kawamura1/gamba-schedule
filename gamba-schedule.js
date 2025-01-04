const pptr = require('puppeteer');
const fs = require('fs');
const stringifySync = require("csv-stringify/sync");

(async () => {
  const browser = await pptr.launch({
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();

  const currentYear = new Date().getFullYear();
  await page.goto(`https://www.gamba-osaka.net/game/index/season/${currentYear}`);

  /** 試合ごとのトップ要素 */
  const gameSelector = '.game_schedule_list > li';

  /** 取得する全試合日程 */
  const gameSchedule = await page.$$eval(gameSelector, g => g.map((li, _) => {
    /** 対戦相手 */
    const vsTeam = li.querySelector('.game_schedule_list_detail_team div').textContent;

    /** ゲームカテゴリと試合のナンバリング */
    const section = li.querySelector('.game_schedule_list_sub p').textContent
      .split(' ').reverse().join(' ');
    const monthDayArr = li.querySelector('.game_schedule_list_detail_sche_date span').textContent.split('.');

    /** 開催日 */
    const startDate = `${new Date().getFullYear()}/${monthDayArr[0]}/${monthDayArr[1]}`;

    /** 開始時間 */
    const startTime = li.querySelector('.game_schedule_list_detail_sche_time').textContent;

    const startTimeArr = startTime.split(':');
    /** 終了時間(開始時間の2時間後) */
    const endTime = startTime.length === 0
      ? ''
      : `${Number(startTimeArr[0]) + 2}:${startTimeArr[1]}`;

    /** 日程の補足 */
    const description = li.querySelector('.game_schedule_list_detail_sche_or') == null
      ? ''
      : '日程未確定';

    /** 開催場所 */
    const location = li.querySelector('.game_schedule_list_detail_sche_sta').textContent;

    return {
      subject: `${vsTeam} ${section}`,
      startDate,
      startTime,
      endDate: '',
      endTime,
      allDayEvent: startTime.length === 0 ? true : false,
      description,
      location,
      private: false
    };
  }));

  const csvString = stringifySync.stringify(gameSchedule, {
    header: true
  });

  fs.writeFileSync(`gamba_schedule_${currentYear}.csv`, csvString);

  await browser.close();
  console.log('Schedule creation successful!');
})();