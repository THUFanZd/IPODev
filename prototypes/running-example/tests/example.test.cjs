const test=require('node:test');
const assert=require('node:assert/strict');
const example=require('../example.js');

test('the same concrete items survive extraction and sum to the displayed result',()=>{
  assert.equal(example.expenses.length,3);
  assert.deepEqual(example.eligible.map(x=>x.name),['午餐','打车']);
  assert.equal(example.total,84);
  assert.equal(example.expenses.reduce((s,x)=>s+x.amount,0),106);
  assert.ok(example.prompt.includes(example.input));
  assert.deepEqual(JSON.parse(example.response),example.expenses.map(({name,amount,category})=>({name,amount,category})));
});
test('cue positions are ordered, include endpoints and clamp arbitrary input',()=>{
  assert.equal(example.cues[0].time,0);
  assert.equal(example.cues.at(-1).time,example.duration);
  for(let i=1;i<example.cues.length;i++)assert.ok(example.cues[i].time>example.cues[i-1].time);
  assert.equal(example.clampTime(-5),0);
  assert.equal(example.clampTime(Infinity),0);
  assert.equal(example.clampTime(999),example.duration);
  assert.equal(example.sceneAt(18).id,'extract');
  assert.equal(example.sceneAt(0).id,'input');
  assert.equal(example.sceneAt(example.duration).id,'result');
});
