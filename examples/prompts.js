import { input, select, confirm } from '../src/index.js';

async function run() {
  const allow = await confirm('Do you want to run the setup?');
  if (!allow) {
    console.log('Setup aborted.');
    return;
  }
  
  const target = await select('Select deployment target:', ['Development', 'Staging', 'Production'], { default: 'Development' });
  const key = await input('Enter API key:', { password: true });
  
  console.log(`\nConfigured: ${target} with key length ${key.length}`);
}

run();
