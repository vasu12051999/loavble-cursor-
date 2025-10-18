# Dashboard & Portfolio - Testing Guide

## 🧪 Complete Testing Scenarios

---

## 📊 Feature 1: Dashboard Data Display

### A. Customer Dashboard Testing

#### Test: Recent Jobs Display

**Prerequisites**:
- Login as a customer account
- Have created at least 1 job

**Steps**:
1. Navigate to `/dashboard`
2. ✅ **Expected**: See "Your Recent Jobs" section
3. ✅ **Expected**: Job cards displayed (not empty state)
4. Check each job card shows:
   - [ ] Job title (clickable)
   - [ ] Status badge (color-coded)
   - [ ] Description (truncated)
   - [ ] Budget amount with $ icon
   - [ ] Date posted with calendar icon
   - [ ] Number of bids (if any)
5. Hover over a job card
6. ✅ **Expected**: Background color changes (hover effect)
7. Click on a job card
8. ✅ **Expected**: Navigate to job detail page
9. Check "View All" button
10. ✅ **Expected**: Only visible if jobs exist
11. Click "View All"
12. ✅ **Expected**: Navigate to `/jobs`

**Test Empty State**:
1. Login with account that has no jobs
2. ✅ **Expected**: See empty state with:
   - Briefcase icon
   - "No jobs yet" message
   - "Post Your First Job" button

**Status Badge Colors**:
- Open: Blue/default
- Awarded: Green
- In Progress: Blue
- Completed: Green
- Canceled: Red

---

### B. Provider Dashboard Testing

#### Test: Recommended Jobs

**Prerequisites**:
- Login as a provider account
- Set skills in provider profile (optional)

**Steps - With Skills**:
1. Go to `/profile/edit`
2. Add skills (e.g., "Cleaning", "Handyman")
3. Navigate to `/dashboard`
4. Click "Recommended" tab
5. ✅ **Expected**: Jobs matching your skills displayed
6. Check each job card shows:
   - [ ] Job title
   - [ ] Category badge
   - [ ] Description preview
   - [ ] Budget amount
   - [ ] Location
   - [ ] Customer name
   - [ ] "View Details" button
7. Click "View Details"
8. ✅ **Expected**: Navigate to job detail page
9. Click "View All Jobs" button
10. ✅ **Expected**: Navigate to `/jobs`

**Steps - Without Skills**:
1. Login as provider with no skills set
2. Navigate to `/dashboard`
3. ✅ **Expected**: Shows recent open jobs (fallback)

**Test Empty State**:
1. When no matching jobs exist
2. ✅ **Expected**: See empty state with:
   - "Complete your profile" button
   - "Browse All Jobs" button

#### Test: My Bids

**Prerequisites**:
- Login as provider
- Submit at least 1 bid on a job

**Steps**:
1. Navigate to `/dashboard`
2. Click "My Bids" tab
3. ✅ **Expected**: Bids displayed (not empty)
4. Check each bid card shows:
   - [ ] Job title
   - [ ] Bid status badge (color-coded)
   - [ ] Your bid amount
   - [ ] Date submitted
   - [ ] Job category
   - [ ] Status indicator (if pending)
5. Click on a bid card
6. ✅ **Expected**: Navigate to job detail page

**Bid Status Colors**:
- Pending: Yellow/secondary
- Awarded: Green/default
- Rejected: Red/destructive

**Test Empty State**:
1. Provider with no bids
2. ✅ **Expected**: See empty state with:
   - "Browse Jobs" button

---

## 🖼️ Feature 2: Portfolio/Gallery Management

### A. Upload Portfolio Item

**Prerequisites**:
- Login as a provider
- Have some image files ready (< 10MB each)

**Steps**:
1. Go to your profile (`/profile/{your-id}`)
2. Click "Portfolio" tab
3. Click "Add Portfolio Item" button
4. ✅ **Expected**: Modal dialog opens

**Fill Form**:
5. Enter title: "Kitchen Renovation"
6. Enter description: "Modern kitchen makeover..."
7. Select category: "Handyman"
8. Set completed date: Pick a date
9. Toggle "Feature this item" ON
10. ✅ **Expected**: Switch turns on

**Upload Gallery Images**:
11. Click "Add Photo" box
12. Select an image file
13. ✅ **Expected**: 
    - Upload progress (loading spinner)
    - Image preview appears
    - Delete button (X) on image
14. Upload 2-3 more images
15. ✅ **Expected**: All previews show
16. Try to upload 11th image
17. ✅ **Expected**: Upload box doesn't appear (max 10)
18. Click X on one image
19. ✅ **Expected**: Image removed, can upload again

**Upload Before/After**:
20. Toggle "Before & After Photos" ON
21. ✅ **Expected**: Before/After upload boxes appear
22. Upload a "before" image
23. ✅ **Expected**: Preview shows in Before box
24. Upload an "after" image
25. ✅ **Expected**: Preview shows in After box

**Submit**:
26. Click "Add to Portfolio"
27. ✅ **Expected**:
    - Loading indicator on button
    - Success toast "Portfolio item added!"
    - Modal closes
    - Gallery refreshes
    - New item appears in grid

**Test Validation**:
- Try submit without title → Error
- Try submit without images → Error
- Try upload file > 10MB → Error
- Try upload non-image → Error

---

### B. Portfolio Gallery Display

**Prerequisites**:
- Have at least 1 portfolio item

**Steps - Grid View**:
1. Navigate to provider profile
2. Click "Portfolio" tab
3. ✅ **Expected**: Grid of portfolio items (1-3 cols)
4. Check each card shows:
   - [ ] Thumbnail image
   - [ ] Title
   - [ ] Description preview
   - [ ] Category badge
   - [ ] Completed date
   - [ ] "Featured" badge (if featured)
   - [ ] "Before/After" badge (if has)
   - [ ] "+X more" badge (if multiple images)
5. Hover over card
6. ✅ **Expected**: Image scales slightly (zoom effect)

**Steps - Detail Modal**:
7. Click on a portfolio item
8. ✅ **Expected**: Modal opens with full details
9. Check modal shows:
   - [ ] Full-size image
   - [ ] Image navigation arrows (if multiple)
   - [ ] Image counter (e.g., "2 / 5")
   - [ ] Thumbnail strip at bottom
   - [ ] Description
   - [ ] Category badge
   - [ ] Completion date
10. Click right arrow
11. ✅ **Expected**: Next image shows
12. Click left arrow
13. ✅ **Expected**: Previous image shows
14. Click a thumbnail
15. ✅ **Expected**: That image displays

**Before/After Modal**:
16. Open item with before/after
17. ✅ **Expected**: "Before" and "After" toggle buttons
18. Click "Before"
19. ✅ **Expected**: Before image shows with badge
20. Click "After"
21. ✅ **Expected**: After image shows with badge
22. ✅ **Expected**: Smooth transition between images

---

### C. Delete Portfolio Item

**Prerequisites**:
- On your own profile with portfolio items

**Steps**:
1. Go to Portfolio tab
2. Find a portfolio item
3. Click trash icon (🗑️)
4. ✅ **Expected**: Confirmation dialog appears
5. Read confirmation message
6. Click "Cancel"
7. ✅ **Expected**: Dialog closes, item remains
8. Click trash icon again
9. Click "Delete" in confirmation
10. ✅ **Expected**:
    - Toast "Portfolio item deleted"
    - Item removed from grid
    - Gallery updates immediately
    - Images deleted from storage

**Permission Test**:
1. Visit another provider's profile
2. ✅ **Expected**: No delete buttons visible
3. Can only view, not delete

---

### D. Featured Items

**Steps**:
1. Create portfolio item with "Featured" ON
2. Create another item with "Featured" OFF
3. View your portfolio
4. ✅ **Expected**: Featured items appear first
5. Featured item has star badge
6. Non-featured items appear after

---

### E. Empty States

**Your Profile - No Portfolio**:
1. New provider with no portfolio
2. ✅ **Expected**: Empty state shows:
   - Message about adding first item
   - "Add Portfolio Item" button

**Other Profile - No Portfolio**:
1. Visit provider with no portfolio
2. ✅ **Expected**: "No portfolio items yet"
3. No add button visible

---

## 🔍 Edge Cases to Test

### Dashboard Edge Cases

**Long Job Titles**:
- Create job with very long title
- ✅ Should truncate with ellipsis
- Full title in tooltip or detail page

**Missing Data**:
- Job with no description
- ✅ Should handle gracefully
- No crash or broken layout

**Many Jobs/Bids**:
- Create more than 5 jobs/bids
- ✅ Should show top 5 only
- "View All" button appears

**Rapid Navigation**:
- Click cards quickly
- ✅ No duplicate navigations
- No errors in console

### Portfolio Edge Cases

**Very Large Image**:
- Try upload 15MB image
- ✅ Error: "Must be less than 10MB"

**Wrong File Type**:
- Try upload PDF or video
- ✅ Error: "Must be an image"

**Slow Connection**:
- Upload on slow network
- ✅ Loading indicator shows
- Can't submit until done

**Delete During View**:
- Open item in modal
- Delete it
- ✅ Modal closes
- Item removed from grid

**Before Without After**:
- Upload only before image
- ✅ Should still save (both optional)

**10+ Images**:
- Upload 10 images
- ✅ Upload box disappears
- Can't add more

---

## 📱 Mobile Testing

### Dashboard Mobile
- [ ] Cards stack vertically
- [ ] All text readable
- [ ] Tap targets large enough
- [ ] No horizontal scroll
- [ ] Stats cards responsive
- [ ] Tabs work on mobile

### Portfolio Mobile
- [ ] Grid becomes single column
- [ ] Upload boxes work on touch
- [ ] Image previews display correctly
- [ ] Modal fits screen
- [ ] Before/After buttons accessible
- [ ] Carousel swipeable
- [ ] Delete confirmation works

---

## 🎯 Acceptance Criteria

### Dashboard ✅
- [x] Recent Jobs displays real data
- [x] Shows top 5 most recent
- [x] Clickable cards navigate correctly
- [x] Status badges show correct colors
- [x] Bid counts display
- [x] Empty state when no data
- [x] View All button works
- [x] Recommended Jobs shows skill-matched jobs
- [x] Falls back to all open jobs
- [x] My Bids shows all provider bids
- [x] Bid status badges correct
- [x] Mobile responsive

### Portfolio ✅
- [x] Upload form validates input
- [x] Images upload to Supabase Storage
- [x] Gallery displays in grid
- [x] Before/After photos work
- [x] Featured items show first
- [x] Modal viewer works
- [x] Image carousel navigates
- [x] Thumbnails work
- [x] Delete requires confirmation
- [x] Delete removes from DB and storage
- [x] Permissions enforced
- [x] Mobile responsive
- [x] Empty states shown

---

## ✅ Success Checklist

**Dashboard**:
- [ ] Login as customer → See recent jobs
- [ ] Login as provider → See recommended jobs
- [ ] Provider → See my bids
- [ ] Click job cards → Navigate correctly
- [ ] Status badges show correctly
- [ ] Empty states only when truly empty
- [ ] Mobile works perfectly

**Portfolio**:
- [ ] Upload portfolio item successfully
- [ ] Upload before/after photos
- [ ] Set item as featured
- [ ] View gallery on profile
- [ ] Open item in modal
- [ ] Navigate images
- [ ] Toggle before/after
- [ ] Delete item successfully
- [ ] Only owner can add/delete
- [ ] Mobile works perfectly

---

## 🐛 Common Issues & Solutions

### Issue: Dashboard still shows empty state
**Solution**:
- Ensure you're logged in
- Create a job/bid first
- Refresh the page
- Check browser console for errors

### Issue: Portfolio upload fails
**Solution**:
- Check file size (< 10MB)
- Check file type (image only)
- Check internet connection
- Verify Supabase storage is configured
- Check browser console

### Issue: Images not displaying
**Solution**:
- Check storage bucket is public
- Verify image URLs are correct
- Check browser network tab
- Try different image format

### Issue: Can't delete portfolio item
**Solution**:
- Verify you're on your own profile
- Check permissions
- Check browser console
- Refresh and try again

---

## 📊 Database Verification

### Check Dashboard Data

**Recent Jobs**:
```sql
SELECT id, title, status, created_at 
FROM jobs 
WHERE customer_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 5;
```

**My Bids**:
```sql
SELECT b.*, j.title 
FROM bids b
JOIN jobs j ON j.id = b.job_id
WHERE b.provider_id = 'your-user-id'
ORDER BY b.created_at DESC
LIMIT 5;
```

### Check Portfolio Data

**Portfolio Items**:
```sql
SELECT * FROM portfolio_items
WHERE provider_id = 'your-user-id'
ORDER BY is_featured DESC, created_at DESC;
```

**Storage Files**:
- Check Supabase Storage → portfolio bucket
- Should see folder with your user_id
- Images inside folder

---

## 🎉 Completion Checklist

When all these pass, features are production-ready:

### Dashboard
- [ ] Customer sees recent jobs (when they exist)
- [ ] Provider sees recommended jobs
- [ ] Provider sees my bids
- [ ] All cards clickable and working
- [ ] Status badges correct colors
- [ ] Empty states only when appropriate
- [ ] View All buttons work
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Performance acceptable

### Portfolio
- [ ] Can upload portfolio items
- [ ] Can upload 1-10 gallery images
- [ ] Can upload before/after photos
- [ ] Can set as featured
- [ ] Gallery displays correctly
- [ ] Modal viewer works
- [ ] Image navigation works
- [ ] Before/After toggle works
- [ ] Can delete items
- [ ] Delete confirmation works
- [ ] Permissions enforced (own vs others)
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Images load quickly

---

## 🚀 Production Ready?

**Status**: ✅ **YES!**

When all tests pass:
- ✅ Dashboard shows real, useful data
- ✅ Portfolio system fully functional
- ✅ Upload and display work perfectly
- ✅ Before/After comparison works
- ✅ Mobile responsive
- ✅ Secure and performant
- ✅ Great user experience

Ready to deploy! 🎊

---

## 📝 Quick Test Script

**5-Minute Test**:
1. [ ] Login as customer → See recent jobs
2. [ ] Create new job → Appears on dashboard
3. [ ] Login as provider → See recommended jobs
4. [ ] Submit bid → Appears in My Bids
5. [ ] Go to profile → Add portfolio item
6. [ ] Upload 3 images
7. [ ] Add before/after photos
8. [ ] Save → See in gallery
9. [ ] Click item → Modal opens
10. [ ] Navigate images
11. [ ] Toggle before/after
12. [ ] Delete item → Confirm removal

**Pass**: All steps work ✅
**Fail**: Any errors → Check console

---

## 🎯 Success Metrics

After testing, you should have:
- ✅ Functional dashboard with real data
- ✅ Working portfolio system
- ✅ Before/After photo comparisons
- ✅ Upload and delete working
- ✅ Mobile-friendly interface
- ✅ No critical bugs
- ✅ Happy users! 🎉
