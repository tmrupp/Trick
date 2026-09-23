import {access,mkdir,readFile,writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {chromium} from "playwright";
import {blessedCards,buildDeckCards,suitCards} from "../card_registry.mjs";
import "../items/item_catalog.js";
import "../races/race_catalog.js";
import "../rules_reference.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const output=path.join(root,"exports/qa");
await mkdir(output,{recursive:true});
const cards=buildDeckCards();
if(cards.length!==54 || new Set(cards.map(c=>c.id)).size!==54 || cards.filter(c=>c.file==="blessed.html").length!==2) throw Error("Standard-deck export must have 54 unique entries: 52 cards and 2 Blessed");
for(const suit of suitCards){
  if(cards.filter(c=>c.file===suit.file).length!==10 || cards.filter(c=>c.file===suit.statusFile).length!==3) throw Error(`Wrong standard-deck composition: ${suit.suit}`);
}
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1050,height:1470}});
const errors=[],overflows=[],screens=[];
page.on("pageerror",error=>errors.push(error.message));
const url=(file,params={})=>{
  const result=pathToFileURL(path.join(root,file));
  for(const [key,value] of Object.entries(params))result.searchParams.set(key,String(value));
  return result.href;
};
const samples=[...suitCards.flatMap(s=>[{id:s.suit,file:s.file,params:{value:10}},{id:s.statusName,file:s.statusFile,params:{}}]),{id:"blessed",file:blessedCards[0].file,params:{}},...globalThis.TrickRaceCatalog.raceCatalog.map(c=>({id:c.id,file:c.file,params:c.params})),...globalThis.TrickItemCatalog.itemCatalog.map(c=>({id:c.id,file:c.file,params:c.params,item:true}))];
const rulesSides=globalThis.TrickRulesCard.sides;
try{
  for(const sample of samples){
    await page.goto(url(sample.file,{...sample.params,export:1}));
    await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0));
    await page.evaluate(()=>document.fonts.ready);
    const bounds=await page.evaluate(()=>{
      const text=document.querySelector(".rules-text"),panel=document.querySelector(".text-panel"),card=document.querySelector(".card");
      const t=text.getBoundingClientRect(),p=panel.getBoundingClientRect(),c=card.getBoundingClientRect();
      return {bottom:t.bottom,panelBottom:p.bottom,cardBottom:c.bottom,horizontal:text.scrollWidth>text.clientWidth+1,text:text.textContent.trim()};
    });
    // Item text stretches to fill its panel and pins the Mark to the foot, so only a text block pushed past the panel counts.
    const tooLow=sample.item?bounds.bottom>bounds.panelBottom+1:(bounds.bottom>bounds.panelBottom-12||bounds.bottom>bounds.cardBottom-25);
    if(!bounds.text||tooLow||bounds.horizontal)overflows.push({id:sample.id,...bounds});
    if(["strength","weird","injury","curse","rootborn","shared-timing","dying-ring-price","hollow-blindfold"].includes(sample.id)){
      const buffer=await page.screenshot({path:path.join(output,`${sample.id}.png`)});
      screens.push({id:sample.id,data:`data:image/png;base64,${buffer.toString("base64")}`});
    }
  }
  // The rules card lays its own sections out, so measure the last one against the card edge.
  for(const side of rulesSides){
    await page.goto(url("rules_reference_card.html",{side:side.side,export:1}));
    await page.waitForFunction(()=>Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0));
    const bounds=await page.evaluate(()=>{
      const body=document.querySelector(".ref-body"),last=document.querySelector(".ref-section:last-child"),card=document.querySelector(".card");
      const l=last.getBoundingClientRect(),c=card.getBoundingClientRect();
      return {bottom:l.bottom,cardBottom:c.bottom,horizontal:body.scrollWidth>body.clientWidth+1,text:body.textContent.trim()};
    });
    if(!bounds.text||bounds.bottom>bounds.cardBottom-30||bounds.horizontal)overflows.push({id:side.id,...bounds});
    const buffer=await page.screenshot({path:path.join(output,`${side.id}.png`)});
    screens.push({id:side.id,data:`data:image/png;base64,${buffer.toString("base64")}`});
  }

  await page.setViewportSize({width:1100,height:900});
  const docs=["player_guide.html","rules.html","reference.html","trick_taking_rpg_rules_v4.html","index.html","race_mechanics.html","setting_races.html","rules_reference_card.html","races/race_card.html","relic_brainstorm.html"];
  for(const file of docs){
    await page.goto(url(file));
    const links=await page.locator("a[href],script[src],link[href]").evaluateAll(nodes=>nodes.map(n=>n.href||n.src));
    for(const link of links){
      if(!link.startsWith("file:"))continue;
      const parsed=new URL(link);parsed.hash="";parsed.search="";
      try{await access(fileURLToPath(parsed));}catch{errors.push(`Broken link in ${file}: ${link}`);}
    }
    if(file==="player_guide.html")await page.screenshot({path:path.join(output,"player-guide.png"),fullPage:true});
    if(file==="index.html"){
      const count=await page.locator("[data-core-section] .card-link").count();
      if(count!==9)errors.push(`Gallery has ${count} current cards, expected 9: 4 consolations, 4 statuses, and Blessed`);
      await page.screenshot({path:path.join(output,"gallery.png"),fullPage:false});
    }
  }
  await page.setContent(`<html><body style="margin:0;background:#ddd;display:grid;grid-template-columns:repeat(3,350px)">${screens.map(s=>`<div><p style="font:18px system-ui;padding:5px">${s.id}</p><img style="width:350px;display:block" src="${s.data}"></div>`).join("")}</body></html>`);
  await page.setViewportSize({width:1050,height:1150});
  await page.screenshot({path:path.join(output,"card-contact-sheet.png"),fullPage:true});
  const report={cardsChecked:samples.length+rulesSides.length,standardDeckEntries:cards.length,documentsChecked:docs.length,errors,overflows};
  await writeFile(path.join(output,"report.json"),JSON.stringify(report,null,2)+"\n");
  console.log(JSON.stringify(report,null,2));
  if(errors.length||overflows.length)process.exitCode=1;
}finally{await browser.close();}
