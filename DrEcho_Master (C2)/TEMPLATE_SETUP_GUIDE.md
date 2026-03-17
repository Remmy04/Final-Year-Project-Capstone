# Template Management System - Setup Guide

## Overview
The admin template management page is now fully connected to the Firestore database. Administrators can create, edit, search, and delete templates directly from the web interface.

## Features Implemented

### 1. **Load Templates from Firestore**
- Templates are automatically loaded from the Firestore `templates` collection when the admin panel loads
- The `loadDataFromFirebase()` function in `admin-common.js` fetches all templates

### 2. **Create New Templates**
- Click "Add New Template" button to open the modal
- Fill in the form with:
  - **Template Name**: Unique identifier for the template
  - **Category**: CT, MRI, Ultrasound, or X-Ray
  - **Specialty**: Medical specialty (e.g., Radiology, Cardiology)
  - **Status**: Active, Inactive, or Draft
  - **Description**: Template description and notes
- Click "Save Template" to save to Firestore

### 3. **Edit Templates**
- Click the "Edit" button on any template card
- Modify the template details in the modal
- Click "Save Template" to update in Firestore

### 4. **Delete Templates**
- Click the "Delete" button on any template card
- Confirm the deletion in the modal
- Template is removed from Firestore immediately

### 5. **Search Templates**
- Use the search bar to filter templates by name, category, specialty, or status
- Real-time search results as you type

## Database Structure

### Firestore Collection: `templates`
```json
{
  "id": "document-id",
  "name": "Template Name",
  "category": "ct|mri|ultrasound|xray",
  "specialty": "Medical Specialty",
  "status": "active|inactive|draft",
  "description": "Template description",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Setup Instructions

### Step 1: Ensure Firestore is Configured
Make sure your Firebase project has:
- Firestore Database created
- Proper security rules to allow admin users to read/write templates

### Step 2: Configure Security Rules (Optional)
Add these rules to your Firestore to restrict template access to admins:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow admins to manage templates
    match /templates/{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.owner_uid || 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Rest of your rules...
  }
}
```

### Step 3: Add Sample Templates
You have two options:

#### Option A: Using Browser Console (Easy)
1. Navigate to `admin-templates.html`
2. Log in as admin
3. Open browser Developer Tools (F12)
4. Run the following command:
   ```javascript
   // Copy this entire function into console and run it
   async function initializeSampleTemplates() {
       const sampleTemplates = [
           {
               name: "CT Liver Standard",
               category: "ct",
               specialty: "Radiology",
               status: "active",
               description: "Standard CT scan template for liver imaging"
           },
           {
               name: "MRI Liver Protocol",
               category: "mri",
               specialty: "Radiology",
               status: "active",
               description: "Complete MRI liver imaging protocol"
           }
           // ... more templates
       ];
       
       for (const template of sampleTemplates) {
           await firebase.firestore().collection("templates").add({
               ...template,
               createdAt: firebase.firestore.FieldValue.serverTimestamp(),
               updatedAt: firebase.firestore.FieldValue.serverTimestamp()
           });
       }
       window.location.reload();
   }
   
   initializeSampleTemplates();
   ```

#### Option B: Include Templates Init Script
Add this line to `admin-templates.html` before the closing `</body>` tag:
```html
<script src="../js/templates-init.js"></script>
```

Then run from console: `initializeSampleTemplates()`

### Step 4: Test the Application
1. Go to Admin > Manage Templates
2. Verify templates are displayed
3. Test adding a new template
4. Test editing an existing template
5. Test deleting a template
6. Test searching/filtering templates

## Files Modified

### Frontend Files
1. **admin-common.js**
   - Updated `loadDataFromFirebase()` to load templates from Firestore
   - Added `deleteTemplateFromFirebase()` function for async deletion
   - Updated `confirmDelete()` to handle template deletion

2. **admin-templates.js**
   - Updated `saveTemplate()` to be async and save to Firestore
   - Now uses Firestore document IDs instead of sequential IDs
   - Handles create and update operations

3. **templates-init.js** (New)
   - Helper script for initializing sample templates
   - Provides utility functions for managing template data

## Integration with Backend (Optional)

If you want to also expose templates via API endpoints, you can add these to `main.py`:

```python
from fastapi import HTTPException

@app.get("/api/templates")
async def get_templates():
    """Fetch all templates from Firestore"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        docs = db.collection('templates').stream()
        
        templates = []
        for doc in docs:
            templates.append({
                'id': doc.id,
                **doc.to_dict()
            })
        return {'templates': templates}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/templates")
async def create_template(template_data: dict):
    """Create a new template in Firestore"""
    try:
        from firebase_admin import firestore
        db = firestore.client()
        doc_ref = db.collection('templates').add(template_data)
        return {'id': doc_ref.id, 'message': 'Template created successfully'}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Troubleshooting

### Templates Not Showing
- Check browser console for errors
- Verify Firestore is initialized correctly
- Ensure user is logged in as admin

### Save/Delete Fails
- Check Firestore security rules
- Verify user has admin role
- Check browser console for specific error messages

### Performance Issues
- Consider adding pagination if you have many templates
- Add indexes to Firestore for filter queries

## Future Enhancements

1. **Template Content Editor**: Allow admins to define template fields/schema
2. **Template Versioning**: Track changes to templates over time
3. **Template Usage Statistics**: Track which templates are most used
4. **Bulk Operations**: Import/export templates, bulk status changes
5. **Backend Sync**: Add backend endpoints to serve templates to the chatbot
6. **Template Sharing**: Share templates between organizations

## Support

For issues or questions, contact: admin@drecho.com
