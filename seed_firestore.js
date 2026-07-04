const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, addDoc } = require('firebase/firestore');
const campusData = require('./jamia_hamdard_data.json');

const firebaseConfig = {
    apiKey: "AIzaSyCF1AJX9cWEYJjwCCUbVfX5XW3Mb6aJ-h4",
    authDomain: "campuscart-1d6a0.firebaseapp.com",
    projectId: "campuscart-1d6a0",
    storageBucket: "campuscart-1d6a0.firebasestorage.app",
    messagingSenderId: "99375204002",
    appId: "G-XBKE4HQFPM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function importCampusData() {
    console.log("🚀 Initializing Cloud Handshake...");

    const hubRef = doc(db, 'campus_hubs', campusData.hubId);

    // 1. Write the Top-Level Campus Hub parameters
    await setDoc(hubRef, {
        name: campusData.name,
        latitude: campusData.latitude,
        longitude: campusData.longitude
    });
    console.log(`✅ Base Hub set up: ${campusData.name}`);

    // 2. Loop through and create Blocks
    for (const block of campusData.blocks) {
        const blockRef = doc(db, 'campus_hubs', campusData.hubId, 'blocks', block.id);
        await setDoc(blockRef, { name: block.name });
        console.log(`   ├── Block configured: ${block.name}`);

        // 3. Loop through and create Floors per block
        for (const floor of block.floors) {
            const floorRef = doc(db, 'campus_hubs', campusData.hubId, 'blocks', block.id, 'floors', floor.id);
            await setDoc(floorRef, { name: floor.name });

            // 4. Loop through and add target rooms/shops (Nodes)
            for (const nodeName of floor.nodes) {
                // Use auto-generated IDs for individual rooms
                const nodeColRef = collection(db, 'campus_hubs', campusData.hubId, 'blocks', block.id, 'floors', floor.id, 'nodes');
                await addDoc(nodeColRef, { name: nodeName });
            }
            console.log(`   │   └── Floor populated: ${floor.name} (${floor.nodes.length} nodes added)`);
        }
    }

    console.log("\n🎉 Data Import Complete! Your nested database is fully built.");
    process.exit();
}

importCampusData().catch(console.error);