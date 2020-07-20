import { parsedRecord } from '../formatter';

export interface projectSummary {
  project: string;
  code: string;
  minutes: number;
}

export const summaryMinutesByProject = (records: parsedRecord[]): any => {
  const projects = Array.from(new Set(records.map((r) => r.project )));
  const summarys: projectSummary[] = projects.map((p) => {
    const sum: projectSummary = {
      project: p,
      code: '',
      minutes: 0
    };
    return sum;
  });

  summarys.forEach((sum) => {
    const min = records
      .filter((r) => r.project === sum.project )
      .map((r) => r.minutes)
      .reduce((acc, val) => acc + val);

    sum.minutes = min;
  });

  return summarys;
}
