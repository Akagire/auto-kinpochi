import moment from 'moment';
import { projectSummary } from '../calc';

export interface parsedRecord {
  project: string;
  start: moment.Moment | null;
  end: moment.Moment | null;
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

    const now = moment();
    const today = moment({
      year: now.year(),
      month: now.month(),
      date: now.date()
    });

    const start = today.clone().add(Number(startObj[0]), 'hours').add(Number(startObj[1]), 'minutes');
    const end = today.clone().add(Number(endObj[0]), 'hours').add(Number(endObj[1]), 'minutes');

    const diffMilisecs = end.diff(start);

    if (diffMilisecs <= 0) throw new TypeError;

    const diffMinutes = diffMilisecs / 1000 / 60;

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
