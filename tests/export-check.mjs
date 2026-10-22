import fs from 'node:fs';
import assert from 'node:assert/strict';
const html=fs.readFileSync(process.argv[2],'utf8');
const model=JSON.parse(html.match(/<script id="ipo-model" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const notes=JSON.parse(html.match(/<script id="ipo-feedback" type="application\/json">([\s\S]*?)<\/script>/)[1]);
assert.equal(model.id,'ipo-dev');assert.ok(Array.isArray(notes.comments));console.log(`HTML readable: ${model.nodes.length} IPO steps, ${notes.comments.length} notes.`);
for(const note of notes.comments)console.log(JSON.stringify({nodeId:note.nodeId,field:note.field,body:note.body,agentReply:note.agentReply}));
