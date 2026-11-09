import fs from 'node:fs';
import {summarizeDemoEvaluation} from '../x5-loyalty-system/webapp/demo-api/evaluation.ts';
const base='x5-loyalty-system/recsys/eval/results/';
const result=summarizeDemoEvaluation(JSON.parse(fs.readFileSync(base+'policy-comparison.json','utf8')),JSON.parse(fs.readFileSync(base+'learned-recsys.json','utf8')));
fs.writeFileSync('fika-android/evaluation.json',JSON.stringify(result));
