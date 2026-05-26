import { runDiagnostics } from '../server/keywordResearchService.ts';
runDiagnostics(true).then(r => console.log(JSON.stringify(r, null, 2))).catch(e => console.error(e));
