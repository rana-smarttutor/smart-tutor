/*
  Run from the smart-tutor project root:
    node scripts/import-percentage-level1.cjs --import
    node scripts/import-percentage-level1.cjs --approve --reviewer="Your name"
    node scripts/import-percentage-level1.cjs --status
  New questions remain PENDING until reviewed in data/percentage-level1-review.json
  and explicitly approved with --approve.
*/
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {loadEnvConfig} = require('@next/env');
const {MongoClient} = require('mongodb');
loadEnvConfig(process.cwd());
const mode = process.argv.find(s=>['--import','--approve','--status'].includes(s));
if (!mode) { console.error('Specify --import, --approve or --status');process.exit(2); }
const inputPath=path.join(process.cwd(),'data','percentage-level1-review.json');
const rows=JSON.parse(fs.readFileSync(inputPath,'utf8'));
if(rows.length!==50)throw new Error(`Expected 50 level-1 questions; got ${rows.length}`);
const fingerprint=q=>crypto.createHash('sha256').update(q.trim().toLowerCase().replace(/\s+/g,' ')).digest('hex');
const seen=new Set();
for(const row of rows){
 const hash=fingerprint(row.question);
 if(seen.has(hash))throw new Error('Repeated question: '+row.question);
 seen.add(hash);
 if(row.exam!=='ssc-cgl'||row.subject!=='Quantitative Aptitude'||row.topicId!=='percentage'||row.progressionLevel!==1)throw new Error('Wrong bank context: '+row.question);
 if(!Array.isArray(row.options)||row.options.length!==4||new Set(row.options).size!==4||!row.options.includes(row.correctAnswer)||!row.explanation?.trim())throw new Error('Invalid question: '+row.question);
}
const uri=process.env.MONGODB_URI||process.env.MONGODB_URL;
if(!uri)throw new Error('MONGODB_URI or MONGODB_URL not found in .env');
const dbArg=process.argv.find(s=>s.startsWith('--db='))?.slice(5);
const dbName=dbArg||process.env.MONGODB_DB_NAME||process.env.MONGODB_DB||process.env.MONGODB_DATABASE||decodeURIComponent(new URL(uri).pathname.replace(/^\//,''));
if(!dbName)throw new Error('MongoDB database name unknown. Supply --db=YOUR_PROJECT_DATABASE_NAME. Check lib/mongodb.ts for exact name.');
const reviewer=process.argv.find(s=>s.startsWith('--reviewer='))?.slice(11);
if(mode==='--approve'&&!reviewer?.trim())throw new Error('Approval requires --reviewer="Your name"');
(async()=>{
 const client=new MongoClient(uri,{serverSelectionTimeoutMS:15000});
 try{
  await client.connect();const coll=client.db(dbName).collection('government_question_bank');
  await coll.createIndex({id:1},{unique:true,name:'government_question_unique_id'});
  await coll.createIndex({exam:1,subject:1,topicId:1,fingerprint:1},{unique:true,name:'government_question_unique_topic'});
  await coll.createIndex({exam:1,subject:1,topicId:1,progressionLevel:1,status:1},{name:'government_question_selection'});
  if(mode==='--import'){
   let inserted=0,skipped=0;
   for(const row of rows){
    const hash=fingerprint(row.question),now=new Date().toISOString();
    const result=await coll.updateOne({exam:row.exam,subject:row.subject,topicId:row.topicId,fingerprint:hash},{ $setOnInsert:{ id:`government-question-${crypto.randomUUID()}`,exam:row.exam,subject:row.subject,topicId:row.topicId,topicName:row.topicName,progressionLevel:row.progressionLevel,question:row.question,options:row.options,correctAnswer:row.correctAnswer,explanation:row.explanation,fingerprint:hash,status:'pending',source:'import',syllabusYear:row.syllabusYear,createdAt:now,updatedAt:now }},{upsert:true});
    if(result.upsertedCount)inserted++;else skipped++;
   }
   console.log(`Imported ${inserted} new pending questions; ${skipped} already existed. Nothing auto-approved.`);
  }
  if(mode==='--approve'){
   let approved=0,unchecked=0,skipped=0;
   for(const row of rows){
    if(row.reviewApproved!==true){unchecked++;continue;}
    const hash=fingerprint(row.question);const now=new Date().toISOString();
    const result=await coll.updateOne({exam:row.exam,subject:row.subject,topicId:row.topicId,fingerprint:hash,progressionLevel:1,status:'pending',correctAnswer:row.correctAnswer,options:row.options,explanation:row.explanation},{ $set:{status:'approved',reviewedAt:now,reviewedBy:reviewer,updatedAt:now} });
    if(result.modifiedCount)approved++;else skipped++;
   }
   console.log(`Approved ${approved} reviewed questions; ${unchecked} not marked reviewed; ${skipped} not pending/mismatched.`);
  }
  const match={exam:'ssc-cgl',subject:'Quantitative Aptitude',topicId:'percentage',progressionLevel:1};
  console.log('Database:',dbName,'Approved:',await coll.countDocuments({...match,status:'approved'}),'Pending:',await coll.countDocuments({...match,status:'pending'}));
 }finally{await client.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
