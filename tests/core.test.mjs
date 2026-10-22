import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {
  embedFeedback,
  emptyFeedback,
  renderDocument,
  validateFeedback,
} from '../skills/ipo-dev/scripts/lib.mjs';

const plan = JSON.parse(fs.readFileSync(new URL('../project.json', import.meta.url), 'utf8'));
const template = fs.readFileSync(new URL('../skills/ipo-dev/assets/review.html', import.meta.url), 'utf8');

test('HTML 生成：方案完整写入，页面脚本没有语法错误', () => {
  const html = renderDocument(template, plan, emptyFeedback(plan));
  const savedPlan = JSON.parse(
    html.match(/<script id="ipo-model" type="application\/json">([\s\S]*?)<\/script>/)[1],
  );
  assert.deepEqual(savedPlan, plan);

  const pageScript = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1];
  new vm.Script(pageScript);
});

test('批注读回：文字和所属位置在写入 HTML 后完整保留', () => {
  const feedback = emptyFeedback(plan);
  const step = plan.nodes[0];
  feedback.comments.push({
    id: 'example-note',
    nodeId: step.id,
    field: 'artifact:' + step.output.artifactIds[0],
    body: '请补充说明，保留这段原文：<script>中文批注</script>',
    createdAt: '2026-10-22T00:00:00.000Z',
  });
  validateFeedback(feedback, plan, emptyFeedback(plan));

  const html = renderDocument(template, plan, emptyFeedback(plan));
  const updatedHtml = embedFeedback(html, feedback);
  const savedFeedback = JSON.parse(
    updatedHtml.match(/<script id="ipo-feedback" type="application\/json">([\s\S]*?)<\/script>/)[1],
  );
  assert.deepEqual(savedFeedback, feedback);
});
