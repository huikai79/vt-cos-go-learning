(function(root){"use strict";
const Comparison=typeof require==="function"&&typeof module!=="undefined"?require("./decision-comparison.js"):root.GoDecisionComparison;
const DEFAULT_TIMEOUT_MS=30000;
function normalizeEndpoint(value){const text=String(value||"").trim();if(!text)throw new Error("comparison_endpoint_missing");let u;try{u=new URL(text);}catch{throw new Error("comparison_endpoint_invalid");}if(!["http:","https:"].includes(u.protocol))throw new Error("comparison_endpoint_protocol_not_allowed");return u.toString();}
async function requestComparison(request,options={}){
 const error=Comparison.validateRequest(request);if(error)throw new Error(error);
 const endpoint=normalizeEndpoint(options.endpoint),controller=new AbortController(),timeoutMs=Number.isFinite(options.timeoutMs)?Math.max(1000,options.timeoutMs):DEFAULT_TIMEOUT_MS,timer=setTimeout(()=>controller.abort(),timeoutMs);
 let response;try{response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(request),signal:controller.signal});}
 catch(error){if(error&&error.name==="AbortError")throw new Error("comparison_timeout");throw new Error("comparison_network_error");}
 finally{clearTimeout(timer);}
 if(!response.ok){let code="comparison_http_"+response.status;try{const body=await response.json();if(body&&typeof body.error==="string"&&body.error)code=body.error;}catch{}throw new Error(code);}
 let result;try{result=await response.json();}catch{throw new Error("comparison_json_invalid");}
 const resultError=Comparison.validateResult(result,request);if(resultError)throw new Error(resultError);return result;
}
const api={DEFAULT_TIMEOUT_MS,normalizeEndpoint,requestComparison};if(typeof module!=="undefined"&&module.exports)module.exports=api;root.GoDecisionComparisonProvider=api;
})(typeof window!=="undefined"?window:globalThis);
