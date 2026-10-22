import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateModel, validateFeedback, emptyFeedback} from '../skills/ipo-dev/scripts/lib.mjs';

const plan = JSON.parse(fs.readFileSync(new URL('../project.json', import.meta.url), 'utf8'));
const demo = JSON.parse(fs.readFileSync(new URL('./fixtures/running-example/project.json', import.meta.url), 'utf8'));
test('贯穿案例：筛选结果与求和结果一致，跨环节引用同一数据对象', () => {
  validateModel(demo);
  const values = new Map(demo.runningExample.values.map(v => [v.artifactId, v.value]));
  assert.deepEqual(values.get('orders').filter(o => o.status === 'paid'), values.get('paid-orders'));
  assert.equal(values.get('paid-orders').reduce((s,o) => s + o.amount, 0), values.get('total').total);
  assert.equal(values.get('report'), `已付款金额合计：${values.get('total').total} 元。`);
  assert.equal(demo.nodes[0].output.artifactIds[0], demo.nodes[1].input.artifactIds[0]);
});
function withExample() {
  const m = structuredClone(plan);
  m.runningExample = {
    id: 'one-case', title: '同一份数据的完整演示', summary: '从原始内容到最终结果。', sampleKind: 'illustrative',
    values: m.artifacts.map(a => ({artifactId: a.id, summary: '这个例子中实际使用的内容', value: a.example})),
    steps: m.nodes.map(n => ({nodeId: n.id, outputs: n.output.artifactIds.map(outputId => ({outputId, changes: [
      {id: 'change-' + outputId, before: '具体输入', operation: '按该环节的规则处理', after: '具体输出'},
    ]}))})),
  };
  return m;
}
test('旧模型仍可使用；完整 running example 可通过校验', () => {
  validateModel(plan);
  validateModel(withExample());
});
test('示例拒绝未知、重复或缺失的数据和步骤引用', () => {
  for (const mutate of [
    m => {m.runningExample.values[0].artifactId = 'unknown';},
    m => {m.runningExample.values.push(m.runningExample.values[0]);},
    m => {m.runningExample.values.pop();},
    m => {m.runningExample.steps[0].nodeId = 'unknown';},
    m => {m.runningExample.steps.pop();},
    m => {m.runningExample.steps[0].outputs[0].outputId = 'unknown';},
    m => {m.runningExample.steps[0].outputs[0].changes[0].after = '';},
  ]) assert.throws(() => validateModel(mutateExample(mutate)), /example/i);
});
function mutateExample(mutate) {const m = withExample(); mutate(m); return m;}
test('具体示例的批注可独立定位，并拒绝无效锚点', () => {
  const m = withExample(), n = m.nodes[0], f = emptyFeedback(m);
  f.comments.push({id: 'example-note', nodeId: n.id, field: 'example:change:change-' + n.output.artifactIds[0], body: '这里的计算不对', createdAt: new Date().toISOString()});
  validateFeedback(f, m);
  f.comments[0].field = 'example:change:missing';
  assert.throws(() => validateFeedback(f, m), /anchor/);
});
