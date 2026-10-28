import 'server-only';
import type {SupabaseClient} from '@supabase/supabase-js';
import {requestGemini,type GeminiPart} from './gemini';
type Step={id:string;position:number;name:string;instruction:string;model_id:string;temperature:number;max_output_tokens:number};
type Chain={id:string;name:string;version:number;steps:Step[];terms:{term:string;definition:string;example:string}[];examples:{input:string;output:string}[]};
const schema={type:'object',properties:{caption:{type:'string'}},required:['caption'],additionalProperties:false};
export async function generateObservedReview(client:SupabaseClient,coreSystem:string,photo:Uint8Array,mimeType:string,scene:string,dish:string,persona:string,replyStyle:string,language:string){
 const input={food:dish,dish,context:scene,persona,reaction:replyStyle,language};
 const {data,error}=await client.rpc('foodfolio_generation_start',{p_persona:persona,p_input:input});
 if(error||!data?.request_id)throw Error(error?.code==='54000'?'You have reached today’s AI request limit.':'The generation pipeline is unavailable. Ask an administrator to check the chain mix and enabled models.');
 const requestId:string=data.request_id;const chain=data.chain as Chain;let caption='';let finalModel='';
 try{
  if(!chain.steps?.length)throw Error('The selected prompt chain has no steps.');
  for(const step of chain.steps){
   const system=coreSystem+'\n\nCURRENT CHAIN STEP: '+step.instruction;
   const prompt=JSON.stringify({...input,chain_name:chain.name,step:step.position,previous_draft:caption||undefined,glossary:chain.terms,examples:chain.examples});
   const parts:GeminiPart[]=[{text:prompt}];if(step.position===chain.steps[0].position)parts.push({inlineData:{mimeType,data:Buffer.from(photo).toString('base64')}});
   const payload={system_prompt:system,text_prompt:prompt,photo_attached:parts.length>1};const started=Date.now();let result;
   try{result=await requestGemini(system,parts,schema,step.max_output_tokens,Number(step.temperature),step.model_id);}
   catch(failure){const message=failure instanceof Error?failure.message:'Provider request failed.';const {error:loggingError}=await client.rpc('foodfolio_record_response',{p_request:requestId,p_step:step.id,p_status:'failed',p_model:step.model_id,p_text:'',p_error:message,p_ms:Date.now()-started,p_input_tokens:null,p_output_tokens:null,p_payload:payload});if(loggingError)console.error('Foodfolio response log unavailable',{code:loggingError.code});throw failure;}
   const {error:loggingError}=await client.rpc('foodfolio_record_response',{p_request:requestId,p_step:step.id,p_status:'succeeded',p_model:result.model,p_text:result.text,p_error:null,p_ms:Date.now()-started,p_input_tokens:result.inputTokens,p_output_tokens:result.outputTokens,p_payload:payload});
   if(loggingError)throw Error('The AI responded, but its generation trace could not be saved. Please try again.');
   let value:unknown;try{value=JSON.parse(result.text).caption;}catch{throw Error('The AI returned an invalid caption. Try another photo or reaction.');}
   if(typeof value!=='string'||!value.trim()||value.trim().length>700)throw Error('The AI returned an invalid caption. Please try again.');
   caption=value.trim();finalModel=result.model;
  }
  return {caption,model:finalModel,prompt:JSON.stringify({...input,request_id:requestId,chain_id:chain.id,chain_version:chain.version}),system_prompt:`Full per-step prompts are recorded in generation request ${requestId}.\n\n${coreSystem}`,generation_request_id:requestId};
 }catch(failure){const message=failure instanceof Error?failure.message:'Generation failed.';const {error:logError}=await client.rpc('foodfolio_finish_generation',{p_request:requestId,p_status:'failed',p_generation:null,p_error:message});if(logError)console.error('Foodfolio completion log unavailable',{code:logError.code});throw failure;}
}
