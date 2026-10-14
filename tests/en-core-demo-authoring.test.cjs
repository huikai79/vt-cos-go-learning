"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const content=require("../content.js");
const demo=require("../locales/en/core-demo-drafts.json");
const terms=require("../locales/en/core-demo-term-drafts.json");
const locale=require("../site-locales.json");
test("English demonstration copy maps to all canonical lesson steps without duplicating board or reveal authority",()=>{
 assert.equal(demo.status,"candidate-not-runtime");
 assert.equal(demo.lessons.length,content.lessons.length);
 for(const [index,lesson] of content.lessons.entries()){
  const local=demo.lessons[index];
  assert.equal(local.lessonIndex,index);
  assert.equal(local.steps.length,lesson.demoSteps.length,"demo step count: "+index);
  for(const [stepIndex,step] of local.steps.entries()){
   assert.equal(step.stepIndex,stepIndex);
   assert.ok(step.label.length>8 && step.caption.length>35);
   assert.equal(step.editorialStatus,"draft");
   assert.equal(step.goReview,"pending");
   assert.equal(step.nativeReview,"pending");
   for(const protectedField of ["stones","highlights","emphasis","blocked","reference","answer","goal","scoring","exposureStatus"])assert.equal(Object.hasOwn(step,protectedField),false,protectedField);
  }
 }
});
test("English glossary candidates remain distinct from demo copy and incomplete scope remains blocked",()=>{
 assert.equal(terms.lessons.length,8);
 for(const [i,l] of terms.lessons.entries()){
  assert.equal(l.lessonIndex,i);
  assert.deepEqual(Object.keys(l).sort(),["editorialStatus","goReview","lessonIndex","nativeReview","sourceVersion","terms"].sort());
  assert.equal(l.terms.length,content.lessons[i].terms.length);
  for(const [j,t] of l.terms.entries()){
   assert.equal(t.termIndex,j);
   assert.ok(t.term.length>1 && t.definition.length>15);
  }
 }
 assert.equal(locale.locales.find(l=>l.id==="en").publishable,false);
});
