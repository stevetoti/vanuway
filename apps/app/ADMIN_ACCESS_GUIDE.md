# VanuWay Admin Dashboard Access Guide

This guide explains how to access and use all admin features in the VanuWay platform.

---

## 🔐 Admin Access Requirements

### Step 1: Assign Admin Role
To access admin features, a user must have the `admin` role assigned in the database.

**SQL Query to Make a User an Admin:**
```sql
-- First, find your user ID from the auth.users table
SELECT id, email FROM auth.users WHERE email = 'your-admin-email@example.com';

-- Then insert the admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('your-user-id-here', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

**Alternative: Direct Database Update via Supabase Dashboard:**
1. Go to Supabase Dashboard → Table Editor
2. Select `user_roles` table
3. Click "Insert" → "Insert row"
4. Fill in:
   - `user_id`: Your user's UUID (from auth.users)
   - `role`: `admin`
   - Leave other fields as default
5. Click "Save"

---

## 📍 Admin Dashboard URLs

### Main Admin Dashboard
**URL:** `/admin/dashboard`
**Full URL:** `http://localhost:5173/admin/dashboard` (development)

**Features:**
- Overview statistics (drivers, hotels, rides, earnings)
- Pending applications count
- Pending hotels count
- Quick action buttons
- Alert notifications

**Statistics Shown:**
- Total Drivers
- Pending Applications
- Active Drivers
- Pending Documents
- Today's Rides
- Today's Earnings
- Total Hotels
- Pending Hotels

---

## 🚗 Driver Management

### 1. Driver Applications Dashboard
**URL:** `/admin/applications`

**What You Can Do:**
- View all driver applications
- Filter by status (pending, approved, rejected)
- Search by driver name or email
- See application progress
- Click to review individual applications

### 2. Review Individual Driver Application
**URL:** `/admin/applications/:id`

**What You Can Do:**
- View complete driver profile
- Review personal information
- Check license details
- Review vehicle information
- Verify uploaded documents
- View background check status
- **Approve** driver application
- **Reject** driver application with reason
- Add admin notes

**Approval Workflow:**
1. Review all driver details
2. Check all uploaded documents
3. Verify information accuracy
4. Click "Approve Application" or "Reject Application"
5. Add notes (optional for approval, required for rejection)
6. Confirm action

---

## 🏨 Hotel Management

### 1. Hotels Management Dashboard
**URL:** `/admin/hotels`

**What You Can Do:**
- View all registered hotels
- Filter by status:
  - All Status
  - Pending Review
  - Active
  - Inactive
  - Rejected
  - Suspended
  - Draft
- Search by hotel name, owner, or location
- See hotel statistics
- Click to review individual hotels

**Statistics Shown:**
- Total Hotels
- Pending Review
- Active
- Rejected

### 2. Review Individual Hotel
**URL:** `/admin/hotels/:hotelId`

**What You Can Do:**
- View complete hotel details
- Review property information
- Check owner details and verification status
- View all rooms and pricing
- See contact information and policies
- **Approve** hotel (makes it publicly visible)
- **Reject** hotel with reason
- **Suspend** active hotel
- **Reactivate** suspended hotel
- View public hotel page
- Add admin notes

**Approval Workflow:**
1. Review hotel information
2. Check owner verification status
3. Verify rooms have been added
4. Review pricing and policies
5. Click "Approve Hotel" or "Reject Hotel"
6. Add notes or rejection reason
7. Confirm action

---

## 🔍 Quick Navigation Guide

### From Main Admin Dashboard:

**Quick Actions Section:**
1. **Review Applications** → `/admin/applications`
2. **Verify Documents** → `/admin/documents` (future feature)
3. **Manage Drivers** → `/admin/drivers` (future feature)
4. **View Analytics** → `/admin/analytics` (future feature)
5. **Manage Hotels** → `/admin/hotels`

**Stat Cards (Clickable):**
- Click "Pending Applications" → `/admin/applications`
- Click "Pending Documents" → `/admin/documents`
- Click "Total Hotels" → `/admin/hotels`
- Click "Pending Hotels" → `/admin/hotels`

**Alert Banners (Clickable):**
- Click "Review Applications" button in pending applications alert
- Click "Review Hotels" button in pending hotels alert

---

## 📊 Admin Workflow Examples

### Example 1: Approve a New Driver

1. Login with admin account
2. Navigate to `/admin/dashboard`
3. See "5 Pending Applications" alert
4. Click "Review Applications" button
5. See list of pending driver applications
6. Click "Review" on an application
7. Review all driver details:
   - Personal info (name, DOB, contact)
   - License information
   - Vehicle details
   - Uploaded documents (click to view)
   - Background check status
8. Click "Approve Application"
9. Optionally add admin notes
10. Click "Approve" in confirmation dialog
11. Driver is now approved and active

### Example 2: Approve a New Hotel

1. Login with admin account
2. Navigate to `/admin/dashboard`
3. See "3 Hotels Pending Review" alert
4. Click "Review Hotels" button
5. See list of pending hotels
6. Click "Review" on a hotel
7. Review hotel details:
   - Property information
   - Owner details and verification
   - Rooms (ensure at least one room exists)
   - Contact information
   - Policies (cancellation, house rules)
8. Click "Approve Hotel"
9. Optionally add admin notes
10. Click "Approve Hotel" in confirmation dialog
11. Hotel is now active and visible to customers

### Example 3: Reject a Hotel with Feedback

1. Navigate to `/admin/hotels/:hotelId`
2. Review hotel details
3. Identify issues (e.g., incomplete information, missing rooms)
4. Click "Reject Hotel"
5. Enter rejection reason:
   ```
   Please add the following:
   - At least 3 room types with competitive pricing
   - Clear cancellation policy
   - High-quality property photos
   - Complete contact information

   Resubmit once these items are addressed.
   ```
6. Optionally add internal admin notes
7. Click "Reject Hotel"
8. Owner receives notification with rejection reason

---

## 🎯 Admin Access Checklist

Before using admin features, ensure:

- [ ] User account created and verified
- [ ] Admin role assigned in `user_roles` table
- [ ] Logged into the application
- [ ] Navigate to `/admin/dashboard` to verify access

**If you see "Access Denied" or are redirected:**
1. Check if admin role is properly assigned
2. Verify you're logged in
3. Try logging out and logging back in
4. Check browser console for errors

---

## 🔧 Database Tables Reference

### For Admin Role Assignment:
```sql
-- View all admin users
SELECT u.email, ur.role, ur.created_at
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin';

-- Add admin role to user
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');

-- Remove admin role from user
DELETE FROM user_roles
WHERE user_id = 'user-uuid-here' AND role = 'admin';
```

### For Driver Applications:
```sql
-- View pending driver applications
SELECT
  d.first_name,
  d.last_name,
  d.email,
  d.application_status,
  da.status as application_status,
  da.submitted_at
FROM drivers d
LEFT JOIN driver_applications da ON da.driver_id = d.id
WHERE da.status = 'submitted'
ORDER BY da.submitted_at DESC;
```

### For Hotels:
```sql
-- View pending hotels
SELECT
  h.name,
  h.city,
  h.status,
  ho.business_name as owner_name,
  h.created_at
FROM hotels h
JOIN hotel_owners ho ON h.owner_id = ho.id
WHERE h.status = 'pending_review'
ORDER BY h.created_at DESC;
```

---

## 🚨 Common Issues & Solutions

### Issue: "Cannot access /admin/dashboard"
**Solution:** Ensure admin role is assigned in database

### Issue: "No pending applications showing"
**Solution:** Check that drivers have submitted applications (not just saved as draft)

### Issue: "Cannot approve driver"
**Solution:** Ensure all required documents are uploaded

### Issue: "Hotel has no rooms"
**Solution:** Owner must add at least one room before approval

### Issue: "Stats showing 0 for everything"
**Solution:** Check that database tables have data; may need to create test data

---

## 📱 Mobile Access

All admin features are responsive and work on mobile devices:
- Dashboard: Grid layout adapts to screen size
- Tables: Scroll horizontally on small screens
- Forms: Stack vertically for easy mobile input
- Dialogs: Full screen on mobile

---

## 🔐 Security Notes

- Admin routes are protected by authentication
- Only users with 'admin' role can access admin features
- All admin actions are logged with user ID and timestamp
- Rejection reasons are stored for transparency
- Admin notes are internal-only (not visible to users)

---

## 📞 Support

If you encounter issues with admin access:
1. Check database role assignment
2. Verify authentication token
3. Check browser console for errors
4. Review Supabase logs for database errors

---

## 🎓 Best Practices

1. **Review Thoroughly:** Always check all details before approving
2. **Provide Clear Feedback:** When rejecting, give specific actionable feedback
3. **Use Admin Notes:** Document your review process for internal records
4. **Regular Monitoring:** Check dashboard daily for pending items
5. **Quick Response:** Approve/reject applications within 24-48 hours
6. **Fair Evaluation:** Apply consistent standards to all applications

---

**Last Updated:** 2025-11-14
**System Version:** VanuWay v2.0 (Hotels System Complete)
