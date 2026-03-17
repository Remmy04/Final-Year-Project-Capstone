/**
 * Template Initialization Script
 * 
 * This script adds sample templates to the Firestore 'templates' collection.
 * Run this in the browser console on the admin-templates.html page after logging in.
 * 
 * Usage:
 * 1. Open the admin-templates.html page
 * 2. Log in as admin
 * 3. Open browser console (F12)
 * 4. Copy and paste the initializeSampleTemplates() function below
 * 5. Run: initializeSampleTemplates()
 */

async function initializeSampleTemplates() {
    const sampleTemplates = [
        {
            name: "CT Liver Standard",
            category: "ct",
            specialty: "Radiology",
            status: "active",
            description: "Standard CT scan template for liver imaging with findings and impressions"
        },
        {
            name: "MRI Liver Protocol",
            category: "mri",
            specialty: "Radiology",
            status: "active",
            description: "Complete MRI liver imaging protocol with liver function assessment"
        },
        {
            name: "Abdominal Ultrasound",
            category: "ultrasound",
            specialty: "Radiology",
            status: "active",
            description: "Comprehensive abdominal ultrasound template including liver, pancreas, kidneys"
        },
        {
            name: "Chest X-Ray Report",
            category: "xray",
            specialty: "Radiology",
            status: "active",
            description: "Standard chest X-ray report template with cardiopulmonary findings"
        },
        {
            name: "CT Abdomen Protocol",
            category: "ct",
            specialty: "Radiology",
            status: "draft",
            description: "Extended CT abdomen template for comprehensive abdominal imaging"
        },
        {
            name: "Cardiac MRI Template",
            category: "mri",
            specialty: "Cardiology",
            status: "active",
            description: "Specialized MRI template for cardiac imaging and function assessment"
        }
    ];

    try {
        console.log("Starting template initialization...");
        
        // Check if templates already exist
        const existingSnapshot = await firebase.firestore().collection("templates").get();
        if (existingSnapshot.size > 0) {
            console.warn(`Templates collection already has ${existingSnapshot.size} documents. Skipping initialization.`);
            return;
        }

        // Add sample templates
        for (const template of sampleTemplates) {
            await firebase.firestore().collection("templates").add({
                ...template,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log("✓ Created template:", template.name);
        }

        console.log("✓ All sample templates created successfully!");
        console.log("Total templates added:", sampleTemplates.length);
        
        // Reload the page to show new templates
        setTimeout(() => {
            window.location.reload();
        }, 1000);

    } catch (error) {
        console.error("✗ Error initializing templates:", error);
        alert("Error initializing templates: " + error.message);
    }
}

// Also provide a function to clear all templates (use with caution)
async function clearAllTemplates() {
    if (!confirm("Are you sure you want to DELETE ALL TEMPLATES? This cannot be undone!")) {
        return;
    }

    try {
        const snapshot = await firebase.firestore().collection("templates").get();
        
        for (const doc of snapshot.docs) {
            await firebase.firestore().collection("templates").doc(doc.id).delete();
            console.log("✓ Deleted template:", doc.id);
        }

        console.log("✓ All templates cleared!");
        window.location.reload();
    } catch (error) {
        console.error("✗ Error clearing templates:", error);
    }
}

// Provide a function to view current templates in console
async function listCurrentTemplates() {
    try {
        const snapshot = await firebase.firestore().collection("templates").get();
        console.log(`Total templates: ${snapshot.size}`);
        
        snapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`${index + 1}. ${data.name} (${data.status}) - ${doc.id}`);
        });
    } catch (error) {
        console.error("Error listing templates:", error);
    }
}

console.log("Template initialization script loaded.");
console.log("Available functions:");
console.log("  - initializeSampleTemplates() : Add 6 sample templates");
console.log("  - clearAllTemplates() : Delete all templates (requires confirmation)");
console.log("  - listCurrentTemplates() : View all templates in console");
