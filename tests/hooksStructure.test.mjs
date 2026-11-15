import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('component hooks are not declared after a conditional early return',()=>{
 const violations=[];
 for(const filename of fs.readdirSync('src/components').filter(file=>file.endsWith('.tsx'))){
  const source=fs.readFileSync(`src/components/${filename}`,'utf8');
  const guard=/^  if \([^\n]+\) return null;/m.exec(source);
  if(!guard)continue;
  const remainder=source.slice(guard.index+guard[0].length);
  if(/^  const [^\n]*=\s*use(?:State|Effect|Ref|Memo|Callback)(?:<[^\n]+>)?\(/m.test(remainder))violations.push(filename);
 }
 assert.deepEqual(violations,[]);
});
