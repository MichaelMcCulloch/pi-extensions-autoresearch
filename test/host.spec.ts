import { expect, it } from 'vitest';
import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import autoresearch from '../src/index.ts';
it('uses the normal nested bash pipeline and respects aborted settlement', async () => {
  const handlers = new Map<string,(event:any,ctx?:any) => any>(); let tool: any;
  let shellCalls = 0;
  autoresearch({on:(name:string,handler:any) => handlers.set(name,handler),registerTool:(t:any) => {tool=t;},appendEntry() {},events:{emit() {}}} as unknown as ExtensionAPI);
  const ctx = {cwd:'/tmp',executeTool:async (name:string) => {expect(name).toBe('bash');shellCalls++;return {isError:true,result:{content:[],structuredContent:{output:'METRIC score=9',exit_code:0,truncated:false}}};}};
  const call = (params:unknown) => tool.execute('test',params,undefined,undefined,ctx);
  await call({action:'init',metric:'score',direction:'higher',decimals:0,maxRuns:3});
  const result = await call({action:'run',command:'measure'});
  expect(shellCalls).toBe(1); expect(result.structuredContent.result.valid).toBe(false);
  await expect(call({action:'keep',ticket:1})).rejects.toThrow('keep-refused');
  await call({action:'discard',ticket:1}); await call({action:'start'});
  expect(handlers.get('agent_before_settle')!({outcome:'aborted',context:{canContinue:true}})).toBeUndefined();
  expect(handlers.get('agent_before_settle')!({outcome:'completed',context:{canContinue:true}})).toMatchObject({continue:true});
  expect(handlers.get('agent_before_settle')!({outcome:'completed',context:{canContinue:true}})).toBeUndefined();
});
