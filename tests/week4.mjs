import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
function load(path, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022}}).outputText;
  const loadedModule = {exports:{}};
  vm.runInNewContext(code, {module:loadedModule, exports:loadedModule.exports, require:name => {
    if (!(name in dependencies)) throw new Error(`Unexpected dependency: ${name}`);
    return dependencies[name];
  }, process, Intl, Date, FormData, Response, AbortSignal, fetch:dependencies.fetch});
  return loadedModule.exports;
}
const helpers = load('lib/captions.ts');
function actionHarness({user = {id:'user-a'}, authError = null, credit = 'ok', insertError = null, updateError = null} = {}) {
  const calls = [];
  const query = {insert:async row => {calls.push(['insert',row]);return {error:insertError};},update:row => {calls.push(['update',row]);return {eq:(key,value)=>{calls.push(['eq',key,value]);return {eq:async(key,value)=>{calls.push(['eq',key,value]);return {error:updateError};}};}}}};
  const supabase = {auth:{getUser:async()=>({data:{user},error:authError})},from:name=>{calls.push(['table',name]);return query;},rpc:async name=>{calls.push(['rpc',name]);return {data:credit,error:null};}};
  const actions=load('app/captions/actions.ts',{'@/lib/captions':helpers,'@/lib/supabase/server':{createClient:async()=>supabase},'next/cache':{revalidatePath:path=>calls.push(['revalidate',path])},'@/lib/ai/gemini':{generateCaption:async()=>{calls.push(['ai']);return {caption:'Test caption',model:'test',prompt:'exact prompt',system_prompt:'exact system'};}}});
  return {actions,calls};
}
function form() {const f=new FormData();f.set('scene','A very long walk for a slice of pizza');f.set('dish','pizza');f.set('tone','Deadpan');f.set('user_id','attacker');return f;}
const id='123e4567-e89b-12d3-a456-426614174000';
test('unauthenticated generation and vote never reach DB writes or AI',async()=>{const h=actionHarness({user:null});assert.ok((await h.actions.createCaption({},form())).error);assert.ok((await h.actions.rateCaption(id,1)).error);assert.equal(h.calls.length,0);});
test('invalid vote identifiers and values are rejected',async()=>{const h=actionHarness();assert.ok((await h.actions.rateCaption('bad',1)).error);assert.ok((await h.actions.rateCaption(id,2)).error);assert.equal(h.calls.length,0);});
test('first vote inserts a new row tied to authenticated user and caption',async()=>{const h=actionHarness();assert.ok((await h.actions.rateCaption(id,1)).success);assert.equal(h.calls[1][1].user_id,'user-a');assert.equal(h.calls[1][1].generation_id,id);assert.equal(h.calls[1][1].value,1);});
test('duplicate vote changes only this user’s existing vote',async()=>{const h=actionHarness({insertError:{code:'23505'}});assert.ok((await h.actions.rateCaption(id,-1)).success);assert.ok(h.calls.some(c=>c[0]==='eq' && c[1]==='user_id' && c[2]==='user-a'));assert.ok(h.calls.some(c=>c[0]==='eq' && c[1]==='generation_id' && c[2]===id));});
test('denied vote does not report success or revalidate',async()=>{const h=actionHarness({insertError:{code:'42501'}});assert.ok((await h.actions.rateCaption(id,1)).error);assert.ok(!h.calls.some(c=>c[0]==='revalidate'));});
test('generation uses session ownership and saves exact prompts',async()=>{process.env.GEMINI_API_KEY='test-only';const h=actionHarness();assert.ok((await h.actions.createCaption({},form())).success);const row=h.calls.find(c=>c[0]==='insert')[1];assert.equal(row.user_id,'user-a');assert.equal(row.prompt,'exact prompt');assert.equal(row.system_prompt,'exact system');});
test('cooldown and daily quota stop AI calls',async()=>{for(const credit of ['cooldown','daily_limit']){const h=actionHarness({credit});assert.ok((await h.actions.createCaption({},form())).error);assert.ok(!h.calls.some(c=>c[0]==='ai'));}});
test('daily prompt changes at midnight in New York',()=>{assert.equal(helpers.dailyChallenge(new Date('2026-10-07T03:59:59Z')),helpers.dailyChallenge(new Date('2026-10-06T20:00:00Z')));assert.notEqual(helpers.dailyChallenge(new Date('2026-10-07T04:00:00Z')),helpers.dailyChallenge(new Date('2026-10-07T03:59:59Z')));});
test('scene, tone, and food are validated before mutation',async()=>{const h=actionHarness();const f=form();f.set('scene','x');assert.ok((await h.actions.createCaption({},f)).error);assert.equal(h.calls.length,0);});
test('provider quota failure never fabricates a caption',async()=>{process.env.GEMINI_API_KEY='test-only';const ai=load('lib/ai/gemini.ts',{'server-only':{},fetch:async()=>new Response('{}',{status:429})});await assert.rejects(ai.generateCaption('A slice of pizza','pizza','Deadpan'),/quota/);});
test('blocked or invalid AI output is rejected',async()=>{process.env.GEMINI_API_KEY='test-only';const ai=load('lib/ai/gemini.ts',{'server-only':{},fetch:async()=>new Response(JSON.stringify({candidates:[]}),{status:200})});await assert.rejects(ai.generateCaption('A slice of pizza','pizza','Deadpan'),/No usable/);});
