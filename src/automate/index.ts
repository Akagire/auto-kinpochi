// const fs = require('fs');
import puppeteer from 'puppeteer';
import moment from 'moment';

import { parsedRecord } from '../formatter';
import { projectSummary } from '../calc';

export async function miteras(records: parsedRecord[], summary: projectSummary[], date?: string) {
  const today = moment(date).format('MM/DD/YYYY');

  // puppeteer 初期化
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // スクリーンショット用のViewPort設定
  await page.setViewport({
    width: 1280,
    height: 1280,
    deviceScaleFactor: 1,
  });

  // miteras ログイン
  await page.goto('https://kintai.miteras.jp/PCA/login');
  await page.type('#username', process.env.EMAIL);
  await page.type('#password', process.env.PASSWORD);
  page.click('input.btnAction');
  await page.waitFor(5000);

  // 指定日付の勤怠入力画面を開く
  await page.click(`td.table01__cell--status button[data-date="${today}"]`);
  await page.waitFor(2000);

  await page.screenshot({ path: 'debug/after_modal_open.png' });

  // 勤務開始時刻・終了時刻・休憩時間を設定
  const start = records[0].start;
  const end = records[records.length - 1].end;
  const rests = records.filter((r) => r.project === '休');

  await page.type('input#work-time-in', start.format('HH:mm'));
  await page.type('input#work-time-out', end.format('HH:mm'));

  for (let i = 0; i < rests.length; i += 1) {
    const restStartElems = await page.$$('.formsTxtBox.formsTxtBox--time.break-time-input.time-input.work-time-in');
    const restEndElems = await page.$$('.formsTxtBox.formsTxtBox--time.break-time-input.time-input.work-time-out');

    await restStartElems[i].type(rests[i].start.format('HH:mm'));
    await restEndElems[i].type(rests[i].end.format('HH:mm'));
    await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      inputs.forEach((input) => input.blur());
    });
  }

  await page.screenshot({ path: 'debug/after_workinout_input.png' });

  // プロジェクト別時間入力
  const cleanSummary = summary.filter((sum) => sum.code !== '');
  for (let i = 0; i < cleanSummary.length; i += 1) {
    console.log(cleanSummary[i].project);
    await page.evaluate((position) => {
      // clickイベントが制御されてるので、このワークフローでクリックイベントをdispatch
      // https://stackoverflow.com/questions/47960903/htmlelement-click-would-not-fire-an-expected-event
      const $doClick = (e: Element) => {
        let event = document.createEvent('MouseEvents');
        event.initEvent('mousedown', true, false);
        e.dispatchEvent(event);
        event = document.createEvent('MouseEvents');
        event.initEvent('mouseup', true, false);
        e.dispatchEvent(event);
      };

      const e = document.getElementsByClassName('select2-selection__arrow')[position];
      if (e) $doClick(e);
    }, i);
    await page.click(`ul.select2-results__options li[id*="${cleanSummary[i].code}"]`);

    // 勤務時間を入力
    await page.evaluate((position, time) => {
      // @ts-ignore
      document.getElementsByClassName('task-project-worktime')[position].value = time;
    }, i, cleanSummary[i].minutes);

    await page.screenshot({ path: `debug/pulldown_${i}.png` });
  }

  // 承認ボタンクリック
  await page.click('#request-approval-all');

  await page.waitFor(4000);

  await page.screenshot({ path: 'debug/after_input_project_summary.png' });


  await browser.close();
}
