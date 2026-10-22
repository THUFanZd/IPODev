import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateModel} from '../skills/ipo-dev/scripts/lib.mjs';

const plan = JSON.parse(fs.readFileSync(new URL('../project.json', import.meta.url), 'utf8'));

test('编号引用：接受正确方案，拒绝不存在的输入编号和缺失的步骤依赖', () => {
  validateModel(plan);

  const unknownInput = structuredClone(plan);
  unknownInput.nodes[0].input.artifactIds[0] = 'nonexistent-input';
  assert.throws(() => validateModel(unknownInput), /Missing concrete input/);

  const missingDependency = structuredClone(plan);
  const step = missingDependency.nodes.find(node => node.input.artifactIds.some(id =>
    missingDependency.artifacts.find(artifact => artifact.id === id).producedBy,
  ));
  assert.ok(step, '仓库示例应包含使用前面步骤输出的环节');
  step.dependsOn = [];
  assert.throws(() => validateModel(missingDependency), /Input dependency missing/);
});
