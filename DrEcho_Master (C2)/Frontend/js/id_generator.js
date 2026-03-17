/* frontend/js/id_generator.js
   Universal ID Generator for Dr. Echo
   
   Usage: 
   const newId = await generateNextId('users', 'U'); // Returns "U000001"
   const newId = await generateNextId('chatLogs', 'C'); // Returns "C000001"
*/

/**
 * Generates the next sequential ID for a given collection.
 * @param {string} collectionName - The name of the collection (e.g., 'reports_echo')
 * @param {string} prefix - The prefix for the ID (e.g., 'RA')
 * @param {number} padding - Number of digits (default 6)
 * @returns {Promise<string>} The new ID (e.g., "RA000001")
 */
async function generateNextId(collectionName, prefix, padding = 6) {
    const db = firebase.firestore();
    const counterRef = db.collection('counters').doc(`${collectionName}_counter`);

    try {
        const newId = await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);
            
            let nextNum = 1;
            if (counterDoc.exists) {
                // If counter exists, get the next number
                nextNum = counterDoc.data().current + 1;
            }

            // Update the counter in the database
            transaction.set(counterRef, { current: nextNum }, { merge: true });

            // Format the ID: Prefix + Zero Padding + Number
            // Example: "RA" + "000001"
            const idString = String(nextNum).padStart(padding, '0');
            return `${prefix}${idString}`;
        });

        console.log(`[ID-GEN] Generated ${newId} for ${collectionName}`);
        return newId;

    } catch (error) {
        console.error("[ID-GEN] Transaction failed: ", error);
        // Fallback (Timestamp) if database fails, so the app doesn't crash
        return `${prefix}-${Date.now()}`; 
    }
}