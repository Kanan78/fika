import fs from 'node:fs';
import {buildDemoGameSnapshot,buildDemoGameFeatures} from '../x5-loyalty-system/webapp/src/features/home/demo-game-snapshot.ts';
import {DEMO_SHOWCASE_INVENTORY} from '../x5-loyalty-system/webapp/src/features/home/demo-showcase.ts';
fs.writeFileSync('fika-android/game-test-snapshot.json',JSON.stringify({game:buildDemoGameSnapshot(),inventory:DEMO_SHOWCASE_INVENTORY,features:buildDemoGameFeatures(DEMO_SHOWCASE_INVENTORY.map(x=>({itemId:x.item_id,quantity:x.quantity})))}));
