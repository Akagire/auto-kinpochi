import { fromFile } from './reader';
import { parser, completeRestStartEnd, mappingProjectCode } from './formatter';
import { summaryMinutesByProject } from './calc';
import { miteras } from './automate';

require('dotenv').config();

(async () => {
  const argDate = process.argv[2];
  const files = await fromFile('todaysjob.txt');
  const mapping = JSON.parse(await fromFile('mapping.json'));
  const workStyles = JSON.parse(await fromFile('work_style.json'));

  const lines = files.split('\n');

  // @ts-ignore
  const [date, workStyleName, ...withoutHeaderLine] = lines;

  const converted = withoutHeaderLine
    .filter((line) => {
      return !!line;
    })
    .map((line) => parser(line));

  const restCompleted = completeRestStartEnd(converted);

  // console.log(restCompleted);

  const selectedWorkStyle = workStyles.find(workStyle => workStyle.name === workStyleName);

  const summary = summaryMinutesByProject(restCompleted);
  const mappedSummary = mappingProjectCode(summary, mapping);

  miteras(restCompleted, selectedWorkStyle, mappedSummary, argDate);
})();
