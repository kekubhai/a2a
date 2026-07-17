// Seed all AI model data into the models table.
// Usage (from packages/db):  node seed-models.mjs
// Reads DATABASE_URL from env or ../../.env.

import { neon } from '@neondatabase/serverless';
import fs from 'fs';

// ─── DB connection ────────────────────────────────────────────────────────────

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL.trim();
  const line = fs
    .readFileSync('../../.env', 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL not found in ../../.env');
  return line.replace(/^DATABASE_URL=/, '').replace(/^"|"$/g, '').trim();
}

const sql = neon(loadDatabaseUrl());

// ─── Helpers ──────────────────────────────────────────────────────────────────

function num(v) {
  if (v === '-' || v === '' || v == null) return null;
  return v;
}

function parseCsvBlock(block) {
  return block
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//'))
    .map((l) => l.split(',').map((c) => c.trim()));
}

// ─── RAW DATA ─────────────────────────────────────────────────────────────────
// Table 1 columns: provider, provider2, name, inputPrice, outputPrice, codingScore, generalScore

const table1Raw = `
Anthropic,Anthropic,Claude Opus 4.6,5.000,25.000,-,-
Anthropic,Anthropic,Claude Opus 4.5,5.000,25.000,73.8,-
Anthropic,Anthropic,Claude Sonnet 4.6,3.000,15.000,-,-
Google,Google,Gemini 3 Pro Preview,2.000,12.000,91.7,-
OpenAI,OpenAI,GPT-5.4,2.500,15.000,-,-
OpenAI,OpenAI,GPT-5.2-Codex,1.750,14.000,-,-
Google,Google,Gemini 3.1 Pro Preview,1.000,6.000,-,-
OpenAI,OpenAI,GPT-5.3 Codex,1.750,14.000,-,-
Kimi,Kimi,Kimi K2.5,0.400,1.900,-,-
MiniMax,MiniMax,MiniMax M2.7,0.000,0.000,-,-
Z AI,Z AI,GLM 5.1,0.966,3.036,-,-
Anthropic,Anthropic,Claude Opus 4.7,5.000,25.000,-,-
DeepSeek,DeepSeek,DeepSeek V3.2 Exp,0.270,0.410,55.4,74.2
DeepSeek,DeepSeek,DeepSeek V4 Pro,0.435,0.870,-,-
Google,Google,Gemini 3 Flash Preview,0.500,3.000,79.7,-
OpenAI,OpenAI,GPT-5.5 Pro,5.000,30.000,-,-
Qwen,Qwen,Qwen3.5 Plus,0.260,1.560,-,-
Alibaba,Alibaba,Qwen2.5 Coder 7B Instruct,0.200,0.200,12.6,-
Z AI,Z AI,GLM 4.7,0.400,1.750,56.2,-
Anthropic,Anthropic,Claude Sonnet 4.5,3.000,15.000,59.0,-
Anthropic,Anthropic,Claude Haiku 4.5,1.000,5.000,51.1,-
DeepSeek,DeepSeek,DeepSeek V3.2,0.214,0.322,59.3,-
Mistral,Mistral,Devstral 2 2512,0.400,0.900,44.8,-
Z AI,Z AI,GLM-4.7-Flash,0.060,0.400,-,-
DeepSeek,DeepSeek,DeepSeek V4 Flash (Non-Reasoning),0.090,0.180,-,-
OpenAI,OpenAI,GPT-5.2 Pro,10.500,84.000,88.9,-
MiniMax,MiniMax,MiniMax M2.5,0.150,0.900,-,-
DeepSeek,DeepSeek,DeepSeek V3.2 Speciale,0.270,0.400,89.6,-
Alibaba,Alibaba,Qwen3.5-27B,0.195,0.900,-,-
Mistral,Mistral,Mixtral 8x22B Instruct,1.200,1.200,14.8,-
Anthropic,Anthropic,Claude Opus 4.1,15.000,75.000,-,-
Kimi,Kimi,Kimi K2.6,0.660,3.400,-,-
Anthropic,Anthropic,Claude Fable 5,10.000,50.000,-,-
Anthropic,Anthropic,Claude 3.7 Sonnet,3.000,15.000,39.4,64.9
Kimi,Kimi,Kimi K2 0711,0.550,2.200,85.3,59.1
SpaceXAI,SpaceXAI,Grok 4.1 Fast,0.000,0.000,39.9,-
OpenAI,OpenAI,GPT-5.2,0.875,7.000,89.4,-
Xiaomi,Xiaomi,MiMo v2 Omni,0.400,2.000,-,-
Google,Google,Gemma 4 31B Instruct,0.100,0.350,-,-
Alibaba,Alibaba,Qwen3.6 35B A3B,0.140,0.900,-,-
Google,Google,Gemini 3.5 Flash,0.750,4.500,-,-
Alibaba,Alibaba,Qwen3.7 Max,1.250,3.750,-,-
MiniMax,MiniMax,MiniMax M3,0.300,1.200,-,-
Z AI,Z AI,GLM-5.2,0.930,2.930,-,-
Anthropic,Anthropic,Claude 3 Haiku,0.250,1.250,15.4,47.4
Anthropic,Anthropic,Claude 3.5 Haiku,0.800,4.000,31.4,-
Deepseek,Deepseek,DeepSeek V3,0.014,0.028,-,48.4
OpenAI,OpenAI,o4 Mini,1.100,4.400,85.9,72.0
Google,Google,Gemini 2.5 Pro Preview 06-05,1.250,10.000,77.8,83.1
Alibaba,Alibaba,Qwen3 Coder Next,0.110,0.800,-,-
Qwen,Qwen,Qwen3.5-Flash,0.065,0.260,-,-
OpenAI,OpenAI,GPT-4,30.000,60.000,-,67.7
Meta,Meta,Llama 3.1 8B Instruct,0.020,0.030,11.6,37.6
Nous Research,Nous Research,Hermes 3 70B Instruct,0.700,0.700,18.8,-
Alibaba,Alibaba,Qwen2.5 72B Instruct,0.360,0.400,27.6,65.4
Anthropic,Anthropic,Claude 3.5 Sonnet,3.000,15.000,38.1,84.2
Alibaba,Alibaba,Qwen2.5 Coder 32B Instruct,0.660,0.800,29.5,72.9
Perplexity,Perplexity,Sonar,1.000,1.000,29.5,-
OpenAI,OpenAI,GPT-5 Codex,1.250,10.000,84.0,-
Qwen,Qwen,Qwen3 Coder Plus,0.650,3.250,-,-
Z AI,Z AI,GLM 4.6,0.430,1.750,56.1,-
Liquid AI,Liquid AI,LiquidAI/LFM2-8B-A1B,0.010,0.020,15.1,-
MiniMax,MiniMax,MiniMax M2,0.255,1.020,82.6,-
OpenAI,OpenAI,GPT-5.1-Codex-Mini,0.250,2.000,83.6,-
Z AI,Z AI,GLM 4.6V,0.300,0.900,41.1,-
MiniMax,MiniMax,MiniMax M2.1,0.300,1.200,81.0,-
StepFun,StepFun,Step 3.5 Flash,0.090,0.300,-,-
Z AI,Z AI,GLM 5,0.600,1.920,-,-
Alibaba,Alibaba,Qwen3.5-35B-A3B,0.140,0.900,-,-
OpenAI,OpenAI,GPT-5.4 Pro,15.000,90.000,-,-
Z AI,Z AI,GLM-5 Turbo,1.200,4.000,-,-
InclusionAI,InclusionAI,Ling 2.6 Flash,0.010,0.030,-,-
Anthropic,Anthropic,Claude Opus 4.8,5.000,25.000,-,-
Nex AGI,Nex AGI,Nex N2 Pro,0.250,1.000,-,-
Kimi,Kimi,Kimi K2.7 Code,0.740,3.500,-,-
OpenAI,OpenAI,GPT-3.5 Turbo,0.500,1.500,-,57.9
Mistral,Mistral,Mixtral 8x7B Instruct,0.140,0.420,6.6,-
Mistral,Mistral,Mistral Large,0.500,1.500,17.8,-
OpenAI,OpenAI,GPT-4 Turbo,5.000,15.000,29.1,63.9
Meta,Meta,Llama 3 70B Instruct,0.510,0.740,19.8,49.2
Meta,Meta,Llama 3 8B Instruct,0.040,0.040,9.6,-
Google,Google,Gemma 2 9B,0.080,0.080,-,-
OpenAI,OpenAI,GPT-4o-mini,0.150,0.600,23.4,55.6
Meta,Meta,Llama 3.1 405B Instruct,0.900,0.900,30.5,66.2
Meta,Meta,Llama 3.1 70B Instruct,0.340,0.390,23.2,58.6
Nousresearch,Nousresearch,Hermes 3 405B Instruct,1.000,1.000,-,63.9
Meta,Meta,Llama 3.2 3B Instruct,0.030,0.050,8.3,-
Meta,Meta,Llama 3.2 11B Vision Instruct,0.060,0.060,11.0,-
Meta,Meta,Llama 3.2 1B Instruct,0.020,0.020,1.9,-
Inflection,Inflection,Inflection 3 Productivity,2.500,10.000,-,-
Inflection,Inflection,Inflection 3 Pi,2.500,10.000,-,-
Mistral,Mistral,Pixtral Large 2411,2.000,6.000,26.1,-
Mistral,Mistral,Mistral Large 2407,2.000,6.000,26.7,60.2
Mistral,Mistral,Mistral Large 2411,2.000,6.000,29.3,65.4
Amazon,Amazon,Nova Pro 1.0,0.800,3.200,23.3,54.1
Amazon,Amazon,Nova Micro 1.0,0.035,0.140,14.0,-
Amazon,Amazon,Nova Lite 1.0,0.060,0.240,16.7,-
Meta,Meta,Llama 3.3 70B Instruct,0.100,0.320,28.8,59.4
Microsoft,Microsoft,Phi 4,0.070,0.140,23.1,-
DeepSeek,DeepSeek,R1,0.550,2.190,61.7,64.0
DeepSeek,DeepSeek,R1 Distill Llama 70B,0.750,0.800,26.6,-
DeepSeek,DeepSeek,R1 Distill Qwen 32B,0.300,0.300,27.0,-
Mistral,Mistral,Mistral Small 24B Instruct 2501,0.050,0.080,25.2,-
OpenAI,OpenAI,o3 Mini,0.550,2.200,71.7,60.4
Alibaba,Alibaba,Qwen-Max,1.040,4.160,35.9,21.8
Alibaba,Alibaba,Qwen-Turbo,0.033,0.130,16.3,-
Google,Google,Gemini 2.0 Flash,0.100,0.400,33.4,-
OpenAI,OpenAI,o3 Mini High,1.100,4.400,73.4,-
Mistral,Mistral,Saba,0.200,0.600,-,-
Google,Google,Gemini 2.0 Flash Lite,0.075,0.300,18.5,-
Perplexity,Perplexity,Sonar Pro,3.000,15.000,27.5,-
Perplexity,Perplexity,Sonar Reasoning Pro,2.000,8.000,-,-
Google,Google,Gemma 3 27B,0.080,0.160,13.7,4.9
Cohere,Cohere,Command A,2.500,10.000,28.7,12.0
Google,Google,Gemma 3 12B,0.050,0.150,13.7,-
Google,Google,Gemma 3 4B,0.040,0.080,11.2,-
Allen Institute for AI,Allen Institute for AI,Olmo 2 32B Instruct,0.050,0.200,6.8,-
Mistral,Mistral,Mistral Small 3.1 24B,0.100,0.300,21.2,-
DeepSeek,DeepSeek,DeepSeek V3 0324,0.240,0.900,40.5,55.1
Alibaba,Alibaba,Qwen2.5 VL 32B Instruct,0.900,0.900,24.8,-
Meta,Meta,Llama 4 Scout,0.100,0.300,29.9,-
Meta,Meta,Llama 4 Maverick,0.200,0.600,39.7,15.6
OpenAI,OpenAI,GPT-4.1 Nano,0.050,0.200,32.6,8.9
OpenAI,OpenAI,GPT-4.1 Mini,0.200,0.800,48.3,32.4
OpenAI,OpenAI,GPT-4.1,2.000,8.000,45.7,52.4
OpenAI,OpenAI,o3,2.000,8.000,80.8,81.3
OpenAI,OpenAI,o4 Mini High,1.100,4.400,-,-
Alibaba,Alibaba,Qwen3 235B A22B,0.455,0.900,34.3,59.6
Alibaba,Alibaba,Qwen3 32B,0.080,0.280,28.8,40.0
Alibaba,Alibaba,Qwen3 14B,0.080,0.200,28.0,-
Alibaba,Alibaba,Qwen3 8B,0.117,0.200,20.2,-
Alibaba,Alibaba,Qwen3 30B A3B,0.120,0.500,32.2,-
Alibaba,Alibaba,Qwen3 4B,0.200,0.200,37.7,-
Google,Google,Gemini 2.5 Pro Preview 05-06,0.625,5.000,77.0,76.9
Mistral,Mistral,Mistral Medium 3,0.400,2.000,40.0,-
Google,Google,Gemma 3n 4B,0.060,0.120,14.6,-
Anthropic,Anthropic,Claude Sonnet 4,3.000,15.000,44.9,61.3
DeepSeek,DeepSeek,R1 0528,0.500,2.150,77.0,71.4
Google,Google,Gemini 2.5 Pro,1.250,10.000,80.1,-
Google,Google,Gemini 2.5 Flash,0.300,2.500,49.5,55.1
MiniMax,MiniMax,MiniMax M1,0.400,2.200,71.1,-
Mistral,Mistral,Mistral Small 3.2 24B,0.075,0.200,27.5,-
Baidu,Baidu,ERNIE 4.5 300B A47B,0.900,0.900,46.7,-
SpaceXAI,SpaceXAI,Grok 4,3.000,15.000,81.9,79.6
Mistral,Mistral,Devstral Small 1.1,0.070,0.280,25.4,-
Mistral,Mistral,Devstral Medium,0.400,2.000,33.7,-
Alibaba,Alibaba,Qwen3 235B A22B Instruct 2507,0.090,0.550,52.4,-
Google,Google,Gemini 2.5 Flash Lite,0.050,0.200,40.0,-
Alibaba,Alibaba,Qwen3 Coder 480B A35B (exacto),0.220,0.900,58.5,-
Z AI,Z AI,GLM 4.5 Air,0.130,0.850,68.4,-
Alibaba,Alibaba,Qwen3 30B A3B Instruct 2507,0.048,0.193,51.5,-
Alibaba,Alibaba,Qwen3 Coder 30B A3B Instruct,0.070,0.270,40.3,-
Mistral AI,Mistral AI,Codestral 2508,0.300,0.900,-,11.1
OpenAI,OpenAI,GPT-OSS-20b,0.030,0.130,77.7,-
OpenAI,OpenAI,GPT-OSS-120b,0.037,0.100,87.8,41.8
OpenAI,OpenAI,GPT-5 Nano,0.050,0.400,78.9,-
OpenAI,OpenAI,GPT-5 Mini,0.125,1.000,83.8,-
OpenAI,OpenAI,GPT-5,0.625,5.000,84.6,88.0
AI21 Labs,AI21 Labs,Jamba Large 1.7,2.000,8.000,18.1,-
Z AI,Z AI,GLM 4.5V,0.600,1.800,35.2,-
Mistral,Mistral,Mistral Medium 3.1,0.400,2.000,40.6,-
DeepSeek,DeepSeek,DeepSeek V3.1,0.250,0.950,57.7,-
Nous Research,Nous Research,Hermes 4 405B,1.000,3.000,54.6,-
Nous Research,Nous Research,Hermes 4 70B,0.130,0.400,26.9,-
SpaceXAI,SpaceXAI,Grok Code Fast 1,0.200,1.500,65.7,-
Kimi,Kimi,Kimi K2 0905 (exacto),0.600,2.500,61.0,-
NVIDIA,NVIDIA,Nemotron Nano 9B V2,0.060,0.200,70.1,-
Alibaba,Alibaba,Qwen3 Next 80B A3B Instruct,0.090,0.780,68.4,-
Qwen,Qwen,Tongyi DeepResearch 30B A3B,0.000,0.000,-,-
SpaceXAI,SpaceXAI,Grok 4 Fast,0.200,0.500,40.1,-
DeepSeek,DeepSeek,DeepSeek V3.1 Terminus,0.270,0.950,52.9,-
Alibaba,Alibaba,Qwen3 Max,0.780,3.900,76.7,-
Alibaba,Alibaba,Qwen3 VL 235B A22B Instruct,0.200,0.880,59.4,-
Google,Google,Gemini 2.5 Flash Lite Preview 09-2025,0.100,0.400,64.1,-
Alibaba,Alibaba,Qwen3 VL 30B A3B Instruct,0.130,0.520,47.6,-
NVIDIA,NVIDIA,Llama 3.3 Nemotron Super 49B V1.5,0.400,0.400,29.0,-
Alibaba,Alibaba,Qwen3 VL 8B Instruct,0.117,0.200,33.2,-
Alibaba,Alibaba,Qwen3 VL 32B Instruct,0.104,0.416,51.4,-
NVIDIA,NVIDIA,Nemotron Nano 12B 2 VL,0.200,0.200,34.5,-
Amazon,Amazon,Nova Premier 1.0,2.500,12.500,31.7,-
Moonshotai,Moonshotai,Kimi K2 Thinking,0.600,2.500,-,-
KwaiKAT,KwaiKAT,KAT-Coder-Pro V1,0.207,0.828,74.7,-
OpenAI,OpenAI,GPT-5.1-Codex,1.250,10.000,84.9,-
OpenAI,OpenAI,GPT-5.1,0.625,5.000,86.8,-
Allen Institute for AI,Allen Institute for AI,Olmo 3 7B Think,0.120,0.200,61.7,-
Allen Institute for AI,Allen Institute for AI,Olmo 3 7B Instruct,0.100,0.200,26.6,-
Allen Institute for AI,Allen Institute for AI,Olmo 3 32B Think,0.150,0.500,67.2,-
Prime Intellect,Prime Intellect,INTELLECT-3,0.200,1.100,77.7,-
Mistral AI,Mistral AI,Mistral Large 3 2512,0.500,1.500,-,-
Mistral,Mistral,Ministral 3 8B 2512,0.150,0.150,30.3,-
Mistral,Mistral,Ministral 3 14B 2512,0.200,0.200,35.1,-
Amazon,Amazon,Nova 2 Lite,0.300,2.500,34.6,-
NVIDIA,NVIDIA,Nemotron 3 Nano 30B A3B,0.050,0.200,36.0,-
Xiaomi,Xiaomi,MiMo-V2-Flash,0.090,0.290,40.2,-
Allen Institute for AI,Allen Institute for AI,Olmo 3.1 32B Think,0.150,0.500,69.5,-
Allen Institute for AI,Allen Institute for AI,Olmo 3.1 32B Instruct,0.200,0.600,-,-
Allen Institute for AI,Allen Institute for AI,Molmo 2 8B,0.200,0.200,-,-
Alibaba,Alibaba,Qwen3 Max Thinking,0.780,3.900,53.5,-
Alibaba,Alibaba,Qwen3.5 397B A17B,0.390,0.900,-,-
Alibaba,Alibaba,Qwen3.5-122B-A10B,0.260,0.900,-,-
Google,Google,Gemini 3.1 Flash Lite Preview,0.250,1.500,-,-
OpenAI,OpenAI,GPT-5.3 Chat,1.750,14.000,-,-
Inception,Inception,Mercury 2,0.250,0.750,-,-
Alibaba,Alibaba,Qwen3.5 9B,0.100,0.150,-,-
Nvidia,Nvidia,Nemotron 3 Super 120B A12B,0.085,0.400,-,-
OpenAI,OpenAI,GPT-5.4 Mini,0.750,4.500,-,-
OpenAI,OpenAI,GPT-5.4 Nano,0.100,0.625,-,-
KwaiKAT,KwaiKAT,KAT Coder Pro V2,0.300,1.200,-,-
Xiaomi,Xiaomi,MiMo v2.5 Pro,0.348,0.696,-,-
Tencent,Tencent,Hunyuan HY3 Preview,0.063,0.210,-,-
InclusionAI,InclusionAI,Ling 2.6 1T,0.075,0.625,-,-
OpenAI,OpenAI,GPT-5.5,5.000,30.000,-,-
Alibaba,Alibaba,Qwen3.6 27B,0.289,0.900,-,-
Qwen,Qwen,Qwen3.6 Max Preview,1.040,6.240,-,-
Qwen,Qwen,Qwen3.6 Flash,0.188,1.125,-,-
Mistral,Mistral,Mistral Medium 3.5,1.500,7.500,-,-
StepFun,stepfun,step-3.7-flash,0.200,1.150,-,-
Alibaba,Alibaba,Qwen3.7 Plus,0.320,1.280,-,-
Anthropic,Anthropic,Claude Sonnet 5,2.000,10.000,-,-
Tencent,Tencent,Hy3-preview (Non-reasoning),0.140,0.580,-,-
SpaceXAI,SpaceXAI,Grok 4.5,2.000,6.000,-,-
OpenAI,OpenAI,GPT-5.6 Sol,2.500,15.000,-,-
OpenAI,OpenAI,GPT-5.6 Terra,2.500,15.000,-,-
OpenAI,OpenAI,GPT-5.6 Luna,0.500,3.000,-,-
OpenAI,OpenAI,o1,15.000,60.000,67.9,84.2
OpenAI,OpenAI,o1-pro,150.000,600.000,-,-
Anthropic,Anthropic,Claude Opus 4,15.000,75.000,54.2,72.0
SpaceXAI,SpaceXAI,Grok 3,3.000,15.000,42.5,-
SpaceXAI,SpaceXAI,Grok 3 Mini,0.250,0.500,69.6,-
OpenAI,OpenAI,o3 Pro,20.000,80.000,-,84.9
Z AI,Z AI,GLM-5V Turbo,1.200,4.000,-,-
Google,Google,Gemma 4 26B A4B Instruct,0.070,0.300,-,-
NVIDIA,NVIDIA,Nemotron 3 Ultra 550B A55B,0.500,2.200,-,-
OpenAI,OpenAI,GPT-4o,2.500,10.000,-,74.4
OpenAI,OpenAI,GPT-5 Chat,1.250,10.000,54.3,-
NVIDIA,NVIDIA,Llama 3.1 Nemotron 70B Instruct,0.880,0.880,16.9,54.9
Alibaba,Alibaba,QwQ 32B,0.900,0.900,63.1,26.2
`.trim();

// Table 2 columns: provider, provider2, name, inputPrice, outputPrice, coding, writing, general
const table2Raw = `
Anthropic,Anthropic,Claude 3.5 Haiku,0.800,4.000,-,42.8,63.4
Anthropic,Anthropic,Claude Sonnet 4.6,3.000,15.000,-,56.6,-
DeepSeek,DeepSeek,DeepSeek V3.2,0.214,0.322,-,49.0,83.7
SpaceXAI,SpaceXAI,Grok 4,3.000,15.000,-,53.7,86.6
Anthropic,Anthropic,Claude Opus 4.6,5.000,25.000,-,44.6,-
Anthropic,Anthropic,Claude Opus 4.5,5.000,25.000,-,43.0,88.9
Google,Google,Gemini 3 Flash Preview,0.500,3.000,-,55.1,88.2
Anthropic,Anthropic,Claude 3 Haiku,0.250,1.250,-,36.1,-
DeepSeek,DeepSeek,R1,0.550,2.190,-,39.0,84.4
Anthropic,Anthropic,Claude Opus 4.7,5.000,25.000,-,58.6,-
Google,Google,Gemini 2.5 Pro,1.250,10.000,90.8,48.7,86.2
OpenAI,OpenAI,GPT-5.1,0.625,5.000,-,72.9,87.0
Google,Google,Gemini 3.1 Pro Preview,1.000,6.000,-,77.1,-
Mistral,Mistral,Mixtral 8x22B Instruct,1.200,1.200,-,-,53.7
DeepSeek,DeepSeek,DeepSeek V3.2 Speciale,0.270,0.400,-,63.9,86.3
Kimi,Kimi,Kimi K2.5,0.400,1.900,92.6,43.7,-
Alibaba,Alibaba,Qwen3 Max Thinking,0.780,3.900,-,53.8,82.4
Deepseek,Deepseek,DeepSeek V3,0.014,0.028,-,-,-
Kimi,Kimi,Kimi K2 0711,0.550,2.200,87.6,68.1,84.8
OpenAI,OpenAI,GPT-5,0.625,5.000,-,73.1,87.1
OpenAI,OpenAI,GPT-5.3 Codex,1.750,14.000,-,75.4,-
OpenAI,OpenAI,GPT-5.4,2.500,15.000,-,74.0,-
DeepSeek,DeepSeek,DeepSeek V4 Flash (Non-Reasoning),0.090,0.180,-,79.2,-
DeepSeek,DeepSeek,DeepSeek V4 Pro,0.435,0.870,-,76.5,-
Mistral,Mistral,Mistral Large,0.500,1.500,-,-,51.5
OpenAI,OpenAI,GPT-4 Turbo,5.000,15.000,-,-,69.4
Anthropic,Anthropic,Claude 3.5 Sonnet,3.000,15.000,-,-,77.2
Mistral,Mistral,Pixtral Large 2411,2.000,6.000,-,34.5,70.1
DeepSeek,DeepSeek,R1 Distill Qwen 32B,0.300,0.300,-,22.9,73.9
OpenAI,OpenAI,o4 Mini High,1.100,4.400,-,-,-
Anthropic,Anthropic,Claude Opus 4,15.000,75.000,-,43.3,86.0
Z AI,Z AI,GLM 4.5 Air,0.130,0.850,-,37.5,81.5
OpenAI,OpenAI,GPT-5 Chat,1.250,10.000,-,45.0,82.0
Alibaba,Alibaba,Qwen3 Max,0.780,3.900,-,48.0,84.1
Google,Google,Gemini 2.5 Flash Lite Preview 09-2025,0.100,0.400,-,41.8,79.6
Z AI,Z AI,GLM 4.6,0.430,1.750,-,36.7,78.4
Google,Google,Gemini 3 Pro Preview,2.000,12.000,-,70.4,89.8
SpaceXAI,SpaceXAI,Grok 4.1 Fast,0.000,0.000,-,36.5,74.3
NVIDIA,NVIDIA,Nemotron 3 Nano 30B A3B,0.050,0.200,-,37.5,57.9
Z AI,Z AI,GLM 4.7,0.400,1.750,90.8,54.6,79.4
OpenAI,OpenAI,GPT-5.3 Chat,1.750,14.000,-,-,-
OpenAI,OpenAI,GPT-5.4 Pro,15.000,90.000,-,-,-
OpenAI,OpenAI,GPT-5.5 Pro,5.000,30.000,-,-,-
OpenAI,OpenAI,GPT-4,30.000,60.000,-,-,-
Google,Google,Gemma 2 9B,0.080,0.080,74.4,-,31.9
OpenAI,OpenAI,GPT-4o-mini,0.150,0.600,-,30.9,64.8
Meta,Meta,Llama 3.1 405B Instruct,0.900,0.900,-,39.1,73.2
Meta,Meta,Llama 3.1 70B Instruct,0.340,0.390,-,34.4,67.6
Nousresearch,Nousresearch,Hermes 3 405B Instruct,1.000,1.000,-,-,-
Nous Research,Nous Research,Hermes 3 70B Instruct,0.700,0.700,-,-,57.1
Alibaba,Alibaba,Qwen2.5 72B Instruct,0.360,0.400,-,36.9,72.0
Meta,Meta,Llama 3.2 3B Instruct,0.030,0.050,-,26.2,34.7
Meta,Meta,Llama 3.2 11B Vision Instruct,0.060,0.060,-,30.4,46.4
Inflection,Inflection,Inflection 3 Productivity,2.500,10.000,-,-,-
Inflection,Inflection,Inflection 3 Pi,2.500,10.000,-,-,-
Alibaba,Alibaba,Qwen2.5 Coder 32B Instruct,0.660,0.800,-,-,63.5
Mistral,Mistral,Mistral Large 2407,2.000,6.000,-,31.6,68.3
Mistral,Mistral,Mistral Large 2411,2.000,6.000,-,31.2,69.7
Amazon,Amazon,Nova Micro 1.0,0.035,0.140,-,29.4,53.1
Amazon,Amazon,Nova Lite 1.0,0.060,0.240,-,34.2,59.0
Meta,Meta,Llama 3.3 70B Instruct,0.100,0.320,-,47.1,71.3
OpenAI,OpenAI,o1,15.000,60.000,-,70.3,84.1
Microsoft,Microsoft,Phi 4,0.070,0.140,-,23.5,71.4
DeepSeek,DeepSeek,R1 Distill Llama 70B,0.750,0.800,-,27.6,79.5
Mistral,Mistral,Mistral Small 24B Instruct 2501,0.050,0.080,-,26.4,65.2
OpenAI,OpenAI,o3 Mini,0.550,2.200,-,-,79.1
Alibaba,Alibaba,Qwen-Max,1.040,4.160,-,-,76.2
Alibaba,Alibaba,Qwen-Turbo,0.033,0.130,-,-,63.3
Google,Google,Gemini 2.0 Flash,0.100,0.400,-,40.2,77.9
OpenAI,OpenAI,o3 Mini High,1.100,4.400,-,67.1,80.2
Mistral,Mistral,Saba,0.200,0.600,-,-,61.1
Anthropic,Anthropic,Claude 3.7 Sonnet,3.000,15.000,-,44.0,80.3
Google,Google,Gemini 2.0 Flash Lite,0.075,0.300,-,-,72.4
Alibaba,Alibaba,QwQ 32B,0.900,0.900,-,38.8,76.4
Perplexity,Perplexity,Sonar Pro,3.000,15.000,-,-,75.5
Perplexity,Perplexity,Sonar Reasoning Pro,2.000,8.000,-,-,-
Google,Google,Gemma 3 27B,0.080,0.160,81.9,31.8,66.9
Cohere,Cohere,Command A,2.500,10.000,-,36.5,71.2
Google,Google,Gemma 3 12B,0.050,0.150,-,36.7,59.5
Google,Google,Gemma 3 4B,0.040,0.080,-,28.3,41.7
Allen Institute for AI,Allen Institute for AI,Olmo 2 32B Instruct,0.050,0.200,-,38.1,51.1
Mistral,Mistral,Mistral Small 3.1 24B,0.100,0.300,-,29.9,65.9
OpenAI,OpenAI,o1-pro,150.000,600.000,-,-,-
DeepSeek,DeepSeek,DeepSeek V3 0324,0.240,0.900,-,41.0,81.9
Alibaba,Alibaba,Qwen2.5 VL 32B Instruct,0.900,0.900,-,-,69.7
Meta,Meta,Llama 4 Scout,0.100,0.300,83.9,39.5,75.2
Meta,Meta,Llama 4 Maverick,0.200,0.600,-,43.0,80.9
OpenAI,OpenAI,GPT-4.1 Nano,0.050,0.200,-,32.0,65.7
OpenAI,OpenAI,GPT-4.1 Mini,0.200,0.800,-,38.3,78.1
OpenAI,OpenAI,GPT-4.1,2.000,8.000,-,43.0,80.6
Alibaba,Alibaba,Qwen2.5 Coder 7B Instruct,0.200,0.200,-,-,47.3
OpenAI,OpenAI,o4 Mini,1.100,4.400,-,68.7,83.2
OpenAI,OpenAI,o3,2.000,8.000,-,71.4,85.3
Alibaba,Alibaba,Qwen3 235B A22B,0.455,0.900,-,36.6,76.2
Alibaba,Alibaba,Qwen3 32B,0.080,0.280,81.3,31.5,72.7
Alibaba,Alibaba,Qwen3 14B,0.080,0.200,-,23.9,67.5
Alibaba,Alibaba,Qwen3 8B,0.117,0.200,-,28.6,64.3
Alibaba,Alibaba,Qwen3 30B A3B,0.120,0.500,-,31.9,71.0
Alibaba,Alibaba,Qwen3 4B,0.200,0.200,-,33.5,67.2
Google,Google,Gemini 2.5 Pro Preview 05-06,0.625,5.000,-,-,83.7
Mistral,Mistral,Mistral Medium 3,0.400,2.000,-,39.3,76.0
Anthropic,Anthropic,Claude Sonnet 4,3.000,15.000,-,45.4,83.7
DeepSeek,DeepSeek,R1 0528,0.500,2.150,-,39.6,84.9
Google,Google,Gemini 2.5 Pro Preview 06-05,1.250,10.000,-,-,85.8
SpaceXAI,SpaceXAI,Grok 3,3.000,15.000,-,46.9,79.9
SpaceXAI,SpaceXAI,Grok 3 Mini,0.250,0.500,-,45.9,82.8
OpenAI,OpenAI,o3 Pro,20.000,80.000,-,-,-
Google,Google,Gemini 2.5 Flash,0.300,2.500,84.3,39.0,80.9
MiniMax,MiniMax,MiniMax M1,0.400,2.200,-,41.8,81.6
Mistral,Mistral,Mistral Small 3.2 24B,0.075,0.200,-,33.5,68.1
Baidu,Baidu,ERNIE 4.5 300B A47B,0.900,0.900,-,39.1,77.6
Mistral,Mistral,Devstral Small 1.1,0.070,0.280,-,34.6,62.2
Mistral,Mistral,Devstral Medium,0.400,2.000,-,29.9,70.8
Alibaba,Alibaba,Qwen3 235B A22B Instruct 2507,0.090,0.550,-,46.1,82.8
Google,Google,Gemini 2.5 Flash Lite,0.050,0.200,-,31.5,72.4
Alibaba,Alibaba,Qwen3 Coder 480B A35B (exacto),0.220,0.900,82.8,40.5,78.8
Alibaba,Alibaba,Qwen3 30B A3B Instruct 2507,0.048,0.193,-,33.1,77.7
Alibaba,Alibaba,Qwen3 Coder 30B A3B Instruct,0.070,0.270,78.7,32.6,70.6
Mistral AI,Mistral AI,Codestral 2508,0.300,0.900,-,-,-
Anthropic,Anthropic,Claude Opus 4.1,15.000,75.000,-,-,-
OpenAI,OpenAI,GPT-OSS-20b,0.030,0.130,-,65.1,74.8
OpenAI,OpenAI,GPT-OSS-120b,0.037,0.100,-,69.0,80.8
OpenAI,OpenAI,GPT-5 Nano,0.050,0.400,-,67.5,78.0
OpenAI,OpenAI,GPT-5 Mini,0.125,1.000,-,75.4,83.7
AI21 Labs,AI21 Labs,Jamba Large 1.7,2.000,8.000,-,35.2,57.7
Z AI,Z AI,GLM 4.5V,0.600,1.800,-,28.6,75.1
Mistral,Mistral,Mistral Medium 3.1,0.400,2.000,-,39.8,68.3
DeepSeek,DeepSeek,DeepSeek V3.1,0.250,0.950,-,37.8,83.3
Nous Research,Nous Research,Hermes 4 405B,1.000,3.000,75.4,34.8,72.9
Nous Research,Nous Research,Hermes 4 70B,0.130,0.400,68.6,29.0,66.4
SpaceXAI,SpaceXAI,Grok Code Fast 1,0.200,1.500,-,41.4,79.3
Kimi,Kimi,Kimi K2 0905 (exacto),0.600,2.500,-,41.7,81.9
NVIDIA,NVIDIA,Nemotron Nano 9B V2,0.060,0.200,-,27.1,73.9
Alibaba,Alibaba,Qwen3 Next 80B A3B Instruct,0.090,0.780,-,39.7,81.9
Qwen,Qwen,Tongyi DeepResearch 30B A3B,0.000,0.000,-,-,-
SpaceXAI,SpaceXAI,Grok 4 Fast,0.200,0.500,-,37.7,73.0
DeepSeek,DeepSeek,DeepSeek V3.1 Terminus,0.270,0.950,-,41.2,83.6
OpenAI,OpenAI,GPT-5 Codex,1.250,10.000,-,74.2,86.5
Qwen,Qwen,Qwen3 Coder Plus,0.650,3.250,-,-,-
Alibaba,Alibaba,Qwen3 VL 235B A22B Instruct,0.200,0.880,-,42.6,82.3
DeepSeek,DeepSeek,DeepSeek V3.2 Exp,0.270,0.410,88.1,43.1,83.6
Anthropic,Anthropic,Claude Sonnet 4.5,3.000,15.000,-,42.6,86.0
Alibaba,Alibaba,Qwen3 VL 30B A3B Instruct,0.130,0.520,-,33.1,76.4
NVIDIA,NVIDIA,Llama 3.3 Nemotron Super 49B V1.5,0.400,0.400,-,39.5,69.8
Alibaba,Alibaba,Qwen3 VL 8B Instruct,0.117,0.200,-,32.3,68.6
Anthropic,Anthropic,Claude Haiku 4.5,1.000,5.000,-,42.0,80.0
Liquid AI,Liquid AI,LiquidAI/LFM2-8B-A1B,0.010,0.020,-,26.3,50.5
Alibaba,Alibaba,Qwen3 VL 32B Instruct,0.104,0.416,-,39.2,79.1
MiniMax,MiniMax,MiniMax M2,0.255,1.020,-,72.3,82.0
NVIDIA,NVIDIA,Nemotron Nano 12B 2 VL,0.200,0.200,-,25.9,64.9
Amazon,Amazon,Nova Premier 1.0,2.500,12.500,-,36.2,73.3
Moonshotai,Moonshotai,Kimi K2 Thinking,0.600,2.500,-,-,-
KwaiKAT,KwaiKAT,KAT-Coder-Pro V1,0.207,0.828,-,68.4,81.3
OpenAI,OpenAI,GPT-5.1-Codex-Mini,0.250,2.000,-,67.9,82.0
OpenAI,OpenAI,GPT-5.1-Codex,1.250,10.000,-,70.0,86.0
Allen Institute for AI,Allen Institute for AI,Olmo 3 7B Think,0.120,0.200,-,41.5,65.5
Allen Institute for AI,Allen Institute for AI,Olmo 3 7B Instruct,0.100,0.200,-,32.8,52.2
Allen Institute for AI,Allen Institute for AI,Olmo 3 32B Think,0.150,0.500,-,49.1,75.9
Prime Intellect,Prime Intellect,INTELLECT-3,0.200,1.100,-,34.0,82.2
Mistral AI,Mistral AI,Mistral Large 3 2512,0.500,1.500,-,-,-
Mistral,Mistral,Ministral 3 8B 2512,0.150,0.150,-,29.1,64.2
Mistral,Mistral,Ministral 3 14B 2512,0.200,0.200,-,32.0,69.3
Amazon,Amazon,Nova 2 Lite,0.300,2.500,-,40.5,74.3
Z AI,Z AI,GLM 4.6V,0.300,0.900,-,27.9,75.2
Mistral,Mistral,Devstral 2 2512,0.400,0.900,-,38.1,76.2
OpenAI,OpenAI,GPT-5.2,0.875,7.000,-,65.2,85.9
OpenAI,OpenAI,GPT-5.2 Pro,10.500,84.000,-,75.4,87.4
Xiaomi,Xiaomi,MiMo-V2-Flash,0.090,0.290,-,71.8,74.4
Allen Institute for AI,Allen Institute for AI,Olmo 3.1 32B Think,0.150,0.500,-,66.0,76.3
MiniMax,MiniMax,MiniMax M2.1,0.300,1.200,-,69.9,87.5
Allen Institute for AI,Allen Institute for AI,Olmo 3.1 32B Instruct,0.200,0.600,-,39.2,-
Allen Institute for AI,Allen Institute for AI,Molmo 2 8B,0.200,0.200,-,26.9,-
OpenAI,OpenAI,GPT-5.2-Codex,1.750,14.000,-,77.6,-
Z AI,Z AI,GLM-4.7-Flash,0.060,0.400,-,46.3,-
StepFun,StepFun,Step 3.5 Flash,0.090,0.300,-,66.5,-
Alibaba,Alibaba,Qwen3 Coder Next,0.110,0.800,-,35.2,-
Z AI,Z AI,GLM 5,0.600,1.920,-,55.2,-
MiniMax,MiniMax,MiniMax M2.5,0.150,0.900,-,71.6,-
Alibaba,Alibaba,Qwen3.5 397B A17B,0.390,0.900,-,78.8,-
Qwen,Qwen,Qwen3.5 Plus,0.260,1.560,-,-,-
Qwen,Qwen,Qwen3.5-Flash,0.065,0.260,-,-,-
Alibaba,Alibaba,Qwen3.5-122B-A10B,0.260,0.900,-,75.7,-
Alibaba,Alibaba,Qwen3.5-27B,0.195,0.900,-,75.6,-
Alibaba,Alibaba,Qwen3.5-35B-A3B,0.140,0.900,-,72.5,-
Google,Google,Gemini 3.1 Flash Lite Preview,0.250,1.500,-,77.2,-
Inception,Inception,Mercury 2,0.250,0.750,-,69.8,-
Alibaba,Alibaba,Qwen3.5 9B,0.100,0.150,-,66.7,-
Nvidia,Nvidia,Nemotron 3 Super 120B A12B,0.085,0.400,-,-,-
Z AI,Z AI,GLM-5 Turbo,1.200,4.000,-,73.2,-
OpenAI,OpenAI,GPT-5.4 Mini,0.750,4.500,-,73.3,-
OpenAI,OpenAI,GPT-5.4 Nano,0.100,0.625,-,75.9,-
MiniMax,MiniMax,MiniMax M2.7,0.000,0.000,-,75.7,-
Xiaomi,Xiaomi,MiMo v2 Omni,0.400,2.000,-,53.5,-
KwaiKAT,KwaiKAT,KAT Coder Pro V2,0.300,1.200,-,66.7,-
Z AI,Z AI,GLM-5V Turbo,1.200,4.000,-,61.1,-
Google,Google,Gemma 4 31B Instruct,0.100,0.350,-,75.6,-
Google,Google,Gemma 4 26B A4B Instruct,0.070,0.300,-,72.5,-
Z AI,Z AI,GLM 5.1,0.966,3.036,-,76.3,-
Kimi,Kimi,Kimi K2.6,0.660,3.400,-,76.0,-
InclusionAI,InclusionAI,Ling 2.6 Flash,0.010,0.030,-,57.4,-
Xiaomi,Xiaomi,MiMo v2.5 Pro,0.348,0.696,-,79.9,-
Tencent,Tencent,Hunyuan HY3 Preview,0.063,0.210,-,63.1,-
InclusionAI,InclusionAI,Ling 2.6 1T,0.075,0.625,-,56.9,-
OpenAI,OpenAI,GPT-5.5,5.000,30.000,-,75.8,-
Alibaba,Alibaba,Qwen3.6 27B,0.289,0.900,-,67.5,-
Qwen,Qwen,Qwen3.6 Max Preview,1.040,6.240,-,-,-
Alibaba,Alibaba,Qwen3.6 35B A3B,0.140,0.900,-,64.3,-
Qwen,Qwen,Qwen3.6 Flash,0.188,1.125,-,-,-
Mistral,Mistral,Mistral Medium 3.5,1.500,7.500,-,68.8,-
Google,Google,Gemini 3.5 Flash,0.750,4.500,-,76.3,-
Alibaba,Alibaba,Qwen3.7 Max,1.250,3.750,-,80.5,-
Anthropic,Anthropic,Claude Opus 4.8,5.000,25.000,-,62.2,-
StepFun,stepfun,step-3.7-flash,0.200,1.150,-,67.3,-
MiniMax,MiniMax,MiniMax M3,0.300,1.200,-,82.9,-
Alibaba,Alibaba,Qwen3.7 Plus,0.320,1.280,-,78.0,-
NVIDIA,NVIDIA,Nemotron 3 Ultra 550B A55B,0.500,2.200,-,81.4,-
Nex AGI,Nex AGI,Nex N2 Pro,0.250,1.000,-,66.2,-
Anthropic,Anthropic,Claude Fable 5,10.000,50.000,-,63.5,-
Kimi,Kimi,Kimi K2.7 Code,0.740,3.500,-,63.1,-
Z AI,Z AI,GLM-5.2,0.930,2.930,-,73.3,-
Anthropic,Anthropic,Claude Sonnet 5,2.000,10.000,-,-,-
Tencent,Tencent,Hy3-preview (Non-reasoning),0.140,0.580,-,48.0,-
SpaceXAI,SpaceXAI,Grok 4.5,2.000,6.000,-,-,-
OpenAI,OpenAI,GPT-5.6 Sol,2.500,15.000,-,72.7,-
OpenAI,OpenAI,GPT-5.6 Terra,2.500,15.000,-,71.2,-
OpenAI,OpenAI,GPT-5.6 Luna,0.500,3.000,-,-,-
OpenAI,OpenAI,GPT-3.5 Turbo,0.500,1.500,-,-,46.2
Mistral,Mistral,Mixtral 8x7B Instruct,0.140,0.420,-,-,38.7
Meta,Meta,Llama 3 70B Instruct,0.510,0.740,-,37.1,57.4
Meta,Meta,Llama 3.1 8B Instruct,0.020,0.030,-,28.6,47.6
Meta,Meta,Llama 3.2 1B Instruct,0.020,0.020,-,22.8,20.0
NVIDIA,NVIDIA,Llama 3.1 Nemotron 70B Instruct,0.880,0.880,-,30.8,69.0
Amazon,Amazon,Nova Pro 1.0,0.800,3.200,81.9,38.1,69.1
Perplexity,Perplexity,Sonar,1.000,1.000,-,-,68.9
Google,Google,Gemma 3n 4B,0.060,0.120,-,27.9,48.8
Meta,Meta,Llama 3 8B Instruct,0.040,0.040,-,24.6,40.5
OpenAI,OpenAI,GPT-4o,2.500,10.000,-,-,-
`.trim();

// Table 3: Image Generation Models
// name, elo, textRanking, photorealism, latency
const imageModelsRaw = `
GPT Image 2,OpenAI,1295,#1 Overall,#2 Industry Tier,High (Slightly Stylized),4.5 – 6.0 seconds
GPT Image 1.5,OpenAI,1264,#2 Overall,#3 Industry Tier,Balanced Commercial,3.0 – 4.0 seconds
Gemini 3.1 Flash Image,Google,1210,#3 Overall,#4 Industry Tier,Moderate,1.2 – 2.5 seconds
Flux 2 Max,Black Forest Labs,1165,#9 Overall,#5 Industry Tier,Elite (Ultra-Realistic),8.0 – 12.0 seconds
Flux 2 Pro,Black Forest Labs,1157,#11 Overall,#6 Industry Tier,Elite (Ultra-Realistic),6.0 – 9.0 seconds
Ideogram 4.0 (Quality),Ideogram,1148,#14 Overall,#1 Industry Tier,Moderate (Graphic Design),5.5 – 7.0 seconds
Recraft V4.1 Pro,Recraft,1135,#18 Overall,#2 Graphic Layout,Low (Engineered for Vectors),4.0 – 5.5 seconds
`.trim();

// ─── Parse & merge ────────────────────────────────────────────────────────────

function parseTable1(raw) {
  const rows = parseCsvBlock(raw);
  const map = new Map();
  for (const row of rows) {
    // provider, provider2, name, inputPrice, outputPrice, codingScore, generalScore
    const [provider, , name, inputPrice, outputPrice, coding, general] = row;
    const key = `${provider}||${name}`;
    if (!map.has(key)) {
      map.set(key, {
        provider,
        name,
        inputPrice,
        outputPrice,
        codingBenchmark: num(coding),
        writingBenchmark: null,
        generalBenchmark: num(general),
      });
    }
  }
  return map;
}

function parseTable2(raw) {
  const rows = parseCsvBlock(raw);
  const map = new Map();
  for (const row of rows) {
    // provider, provider2, name, inputPrice, outputPrice, coding, writing, general
    const [provider, , name, inputPrice, outputPrice, coding, writing, general] = row;
    const key = `${provider}||${name}`;
    map.set(key, {
      provider,
      name,
      inputPrice,
      outputPrice,
      codingBenchmark: num(coding),
      writingBenchmark: num(writing),
      generalBenchmark: num(general),
    });
  }
  return map;
}

function parseImageModels(raw) {
  const rows = parseCsvBlock(raw);
  return rows.map((row) => {
    // name, provider, elo, textRanking, photorealism, latency
    const [name, provider, elo, textRanking, photorealism, latency] = row;
    return {
      provider,
      name,
      modelType: 'image',
      inputPrice: '0.000',
      outputPrice: '0.000',
      codingBenchmark: null,
      writingBenchmark: null,
      generalBenchmark: null,
      imageElo: elo,
      imageTextRanking: textRanking,
      imagePhotorealism: photorealism,
      imageLatency: latency,
    };
  });
}

const t1 = parseTable1(table1Raw);
const t2 = parseTable2(table2Raw);

// Merge: start with Table 1, then overlay Table 2 writing & general benchmarks.
const llmModels = [];
const merged = new Map();

for (const [key, model] of t1) {
  merged.set(key, { ...model });
}

for (const [key, t2Model] of t2) {
  if (merged.has(key)) {
    const existing = merged.get(key);
    // Overlay writing from Table 2
    if (t2Model.writingBenchmark != null) {
      existing.writingBenchmark = t2Model.writingBenchmark;
    }
    // Overlay general from Table 2
    if (t2Model.generalBenchmark != null) {
      existing.generalBenchmark = t2Model.generalBenchmark;
    }
    // Table 2 may have coding data not in Table 1
    if (existing.codingBenchmark == null && t2Model.codingBenchmark != null) {
      existing.codingBenchmark = t2Model.codingBenchmark;
    }
  } else {
    // Model only in Table 2
    merged.set(key, { ...t2Model });
  }
}

for (const model of merged.values()) {
  llmModels.push({
    ...model,
    modelType: 'llm',
    imageElo: null,
    imageTextRanking: null,
    imagePhotorealism: null,
    imageLatency: null,
  });
}

const imageModels = parseImageModels(imageModelsRaw);

// Combine into final array, deduplicated by provider+name
const seen = new Set();
const allModels = [];

for (const m of [...llmModels, ...imageModels]) {
  const key = `${m.provider}||${m.name}`;
  if (!seen.has(key)) {
    seen.add(key);
    allModels.push(m);
  }
}

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding models table...\n');

  await sql`DELETE FROM models`;
  console.log('Cleared existing models');

  let inserted = 0;
  let errors = 0;

  for (const m of allModels) {
    try {
      await sql`
        INSERT INTO models (
          provider, name, model_type,
          input_price, output_price,
          coding_benchmark, writing_benchmark, general_benchmark,
          image_elo, image_text_ranking, image_photorealism, image_latency,
          is_active, metadata
        ) VALUES (
          ${m.provider},
          ${m.name},
          ${m.modelType},
          ${m.inputPrice},
          ${m.outputPrice},
          ${m.codingBenchmark},
          ${m.writingBenchmark},
          ${m.generalBenchmark},
          ${m.imageElo},
          ${m.imageTextRanking},
          ${m.imagePhotorealism},
          ${m.imageLatency},
          true,
          '{}'::jsonb
        )
      `;
      inserted++;
    } catch (e) {
      errors++;
      console.error(`  FAILED: ${m.provider}/${m.name}: ${e.message}`);
    }
  }

  const counts = await sql`
    SELECT
      (SELECT count(*) FROM models) as total,
      (SELECT count(*) FROM models WHERE model_type = 'llm') as llm,
      (SELECT count(*) FROM models WHERE model_type = 'image') as image,
      (SELECT count(*) FROM models WHERE coding_benchmark IS NOT NULL) as with_coding,
      (SELECT count(*) FROM models WHERE writing_benchmark IS NOT NULL) as with_writing,
      (SELECT count(*) FROM models WHERE general_benchmark IS NOT NULL) as with_general
  `;

  console.log('\n─── Summary ─────────────────────────────');
  console.log(`  Total models:  ${counts[0].total}`);
  console.log(`  LLM models:    ${counts[0].llm}`);
  console.log(`  Image models:  ${counts[0].image}`);
  console.log(`  With coding:   ${counts[0].with_coding}`);
  console.log(`  With writing:  ${counts[0].with_writing}`);
  console.log(`  With general:  ${counts[0].with_general}`);
  console.log(`  Inserted:      ${inserted}`);
  if (errors > 0) console.log(`  Errors:        ${errors}`);
  console.log('\nModels seed complete!');
}

main().catch((err) => {
  console.error('Models seed failed:', err);
  process.exit(1);
});
