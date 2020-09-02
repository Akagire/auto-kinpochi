import dayjs from 'dayjs';
import { projectSummary } from '../calc';

export interface parsedRecord {
  project: string;
  start: dayjs.Dayjs | null;
  end: dayjs.Dayjs | null;
  minutes: number;
  misc: string;
}

export const parser = (line: string): parsedRecord => {
  const [ workStart, _, workEnd, category, misc ] = line.split(' ');

  if (!(workStart && _ === '-' && workEnd && category && misc)) {
    return {
      project: '休',
      start: null,
      end: null,
      minutes: 0,
      misc: ''
    };
  }

  try {
    const startObj = workStart.split(':');
    const endObj = workEnd.split(':');

    const today = dayjs()
        .hour(0)
        .minute(0)
        .second(0);

    const start = today.clone().add(Number(startObj[0]), 'hour').add(Number(startObj[1]), 'minute');
    const end = today.clone().add(Number(endObj[0]), 'hour').add(Number(endObj[1]), 'minute');

    const diffMilliSecs = end.diff(start);

    if (diffMilliSecs <= 0) throw new TypeError('作業開始時刻が作業終了時刻を上回っている分報があるようです！');

    const diffMinutes = diffMilliSecs / 1000 / 60;

    return {
      project: category,
      start,
      end,
      minutes: diffMinutes,
      misc
    };
  } catch (error) {
    console.error('パースでエラーが発生', error);
    throw error;
  }
};

export const completeRestStartEnd = (rawRecords: parsedRecord[]): parsedRecord[] => {
  for (let i = 0; i < rawRecords.length; i += 1) {
    if (!rawRecords[i].start && !rawRecords[i].end) {
      rawRecords[i].start = rawRecords[i - 1].end;
      rawRecords[i].end = rawRecords[i + 1].start;
      rawRecords[i].minutes = rawRecords[i].end.diff(rawRecords[i].start) / 1000 / 60;
    }
  }
  return rawRecords;
};

export const mappingProjectCode = (rawRecords: projectSummary[], maps: { project: string; code: string; }[]): projectSummary[] => {
  const result = rawRecords.map((rec) => {
    const code = maps.find((map) => map.project === rec.project);
    if (!code) return rec;
    rec.code = code.code;
    return rec;
  });
  return result;
}
