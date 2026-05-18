const { MongoClient } = require('mongodb');
const dns = require('node:dns');

async function diagnostic() {
  console.log('--- MongoDB Connection Diagnostic ---');
  console.log('OS:', process.platform);
  console.log('Node Version:', process.version);
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI is not set in environment.');
    return;
  }
  
  console.log('URI format:', uri.startsWith('mongodb+srv://') ? 'SRV (New)' : 'Standard (Old)');
  
  if (uri.startsWith('mongodb+srv://')) {
    const host = uri.split('@')[1].split('/')[0].split('?')[0];
    console.log('Target Host:', host);
    
    console.log('\nTesting SRV Resolution...');
    try {
      const records = await dns.promises.resolveSrv('_mongodb._tcp.' + host);
      console.log('SRV Records found:', records.length);
      records.forEach(r => console.log(` - ${r.name}:${r.port}`));
    } catch (err) {
      console.error('SRV Resolution Failed:', err.message);
      console.log('Code:', err.code);
      console.log('Syscall:', err.syscall);
    }
  }

  console.log('\nAttempting MongoClient.connect()...');
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    console.log('Success: Connected to MongoDB!');
    const dbName = process.env.MONGODB_DB || 'test';
    const db = client.db(dbName);
    const result = await db.command({ ping: 1 });
    console.log('Ping result:', result);
    await client.close();
  } catch (err) {
    console.error('Connection Failed:', err.message);
    if (err.message.includes('whitelisted')) {
      console.log('\n>>> ACTION REQUIRED: Your IP is likely not whitelisted in MongoDB Atlas Network Access.');
    } else if (err.code === 'ECONNREFUSED' || err.message.includes('querySrv')) {
      console.log('\n>>> ACTION REQUIRED: DNS SRV resolution failed. Try using a standard connection string (mongodb:// instead of mongodb+srv://).');
    }
  }
}

diagnostic();
