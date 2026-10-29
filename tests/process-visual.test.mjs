import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateModel, validateFeedback, emptyFeedback} from '../skills/ipo-dev/scripts/lib.mjs';
import {exampleModel} from '../skills/ipo-dev/assets/process-example.mjs';

const demo = JSON.parse(fs.readFileSync(new URL('./fixtures/running-example/project.json', import.meta.url), 'utf8'));
const visual = () => ({css: '.dot { color: #285b43; }', frames: [
  {id: 'before', title: '处理前', caption: '三笔订单等待检查。', html: '<div data-key="orders">三笔订单</div>'},
  {id: 'after', title: '处理后', caption: '只留下已付款订单，供后续求和。', html: '<svg viewBox="0 0 240 160"><text x="20" y="50">两笔订单</text></svg>'},
]});
function withVisuals() {
  const m = structuredClone(demo);
  m.nodes[0].process.derivations[0].visual = visual();
  m.runningExample.steps[0].outputs[0].visual = visual();
  return m;
}
test('P supports static and animated free-form visuals without changing I/O', () => {
  const m = withVisuals(); validateModel(m);
  assert.deepEqual(m.artifacts, demo.artifacts);
  assert.deepEqual(m.nodes.map(n => [n.input, n.output]), demo.nodes.map(n => [n.input, n.output]));
  m.nodes[0].process.derivations[0].visual.frames.pop(); validateModel(m);
});
test('P rejects empty/duplicate frames and incomplete descriptions', () => {
  for (const mutate of [
    v => {v.frames = [];}, v => {v.frames[1].id = v.frames[0].id;},
    v => {v.frames[0].caption = '';}, v => {v.frames[0].html = '';},
    v => {v.css = null;}, v => {v.frames[0].holdMs = -1;},
  ]) { const m = withVisuals(); mutate(m.nodes[0].process.derivations[0].visual); assert.throws(() => validateModel(m), /visual/i); }
});
test('frame notes are independent across modes and retained when a frame disappears', () => {
  const m = withVisuals(), f = emptyFeedback(m);
  for (const [id, field] of [['plan', 'visual:keep-paid:before'], ['example', 'example:visual:paid-orders:before']])
    f.comments.push({id, nodeId: 'filter', field, body: '说明这一步的含义', createdAt: '2026-10-29T00:00:00Z'});
  validateFeedback(f, m);
  const bad = structuredClone(f); bad.comments[0].field = 'visual:sum-paid:before';
  assert.throws(() => validateFeedback(bad, m), /anchor/);
  const previous = structuredClone(f); delete m.nodes[0].process.derivations[0].visual;
  validateFeedback(f, m, previous);
});
test('bundled example stays concrete and coherent across every visualized step', () => {
  const m=exampleModel(); validateModel(m);
  const values=new Map(m.runningExample.values.map(v=>[v.artifactId,v.value]));
  assert.deepEqual(values.get('orders').filter(o=>o.status==='paid'),values.get('paid-orders'));
  assert.equal(values.get('paid-orders').reduce((s,o)=>s+o.amount,0),values.get('total').total);
  assert.equal(values.get('report'),`已付款金额合计：${values.get('total').total} 元。`);
  for(const n of m.nodes)assert.ok(n.process.derivations[0].visual.frames.length>1);
  for(const s of m.runningExample.steps)assert.ok(s.outputs[0].visual.frames.length>1);
});
