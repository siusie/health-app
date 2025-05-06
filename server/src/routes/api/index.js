// src/routes/api/index.js
// Our authentication middleware
const { authenticate } = require('../../auth');
const { checkPostOwnership, checkReplyOwnership } = require('../../auth/ownershipCheck');
/**
 * The main entry-point for the v1 version of the API.
 */
const express = require('express');
const multer = require('multer');

// Create a router on which to mount our API endpoints
const router = express.Router();

// Configure Multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Import all of stool API endpoints
const { getStoolEntries } = require('./baby/stool/getStool');
const { createStoolEntry } = require('./baby/stool/postStool');
const { updateStoolEntry } = require('./baby/stool/putStool');
const { deleteStoolEntry } = require('./baby/stool/deleteStool');

// Import all of reminders API endpoints
const { getReminders } = require('./baby/reminders/getReminders');
const { createReminder } = require('./baby/reminders/postReminder');
const { updateReminder } = require('./baby/reminders/putReminder');
const { deleteReminders } = require('./baby/reminders/deleteReminders');

// Import childcare services routes
const careServices = require('./careServices/getAllChildcareServices');
const favoritesHandler = require('./careServices/saveFavorites');

router.post('/login', require('./login'));
router.post('/signup', require('./signup'));

// ************ /feedingSchedule routes ************
router.get('/baby/:id/getFeedingSchedules', authenticate(), require('./baby/getFeedingSchedules'));
router.get('baby/:id/getLatestFeed', authenticate(), require('./baby/getLatestFeed'));

router.put(
  '/baby/:babyId/updateFeedingSchedule/:mealId',
  authenticate(),
  require('./baby/updateFeedingSchedule')
);

router.delete(
  '/baby/:id/deleteFeedingSchedule/:mealId',
  authenticate(),
  require('./baby/deleteFeedingSchedule')
);

router.post('/baby/:id/addFeedingSchedule', authenticate(), require('./baby/addFeedingSchedule'));

router.get(
  '/user/:id/getBabyProfiles',
  authenticate(),
  require('./baby/babyProfile/getBabyProfile')
);

//************ /user routes ************
router.get('/user', authenticate(), require('./user/getUser').getUser);

router.get('/user/:id', authenticate(), require('./user/getUserById').getUserById);

router.put('/user/:id', authenticate(), require('./user/putUser').updateUserById);

router.delete('/user/:id', authenticate(), require('./user/deleteUser').deleteUserById);

// ************ /growth routes ************
router.get('/baby/:babyId/growth/', authenticate(), require('./growth/getGrowth').getAllGrowth); // Get all Growth records by [:babyId]

router.post('/baby/:babyId/growth', authenticate(), require('./growth/postGrowth').createGrowth);

router.put(
  '/baby/:babyId/growth/:growthId',
  authenticate(),
  require('./growth/putGrowth').updateGrowthById
);

router.delete(
  '/baby/:babyId/growth/:growthId',
  authenticate(),
  require('./growth/deleteGrowth').deleteGrowthById
);

// ************ /milestones routes ************
router.get('/milestones', authenticate(), require('./milestones/getAllMilestones'));

router.get(
  '/baby/:baby_id/milestones',
  authenticate(),
  require('./milestones/getMilestones').getMilestoneByBabyId
);

router.post(
  '/baby/:baby_id/milestones',
  authenticate(),
  require('./milestones/postMilestone').createMilestone
);

router.put(
  '/baby/:baby_id/milestones/:milestone_id',
  authenticate(),
  require('./milestones/putMilestone').updateMilestoneById
);

router.delete(
  '/baby/:baby_id/milestones/:milestone_id',
  authenticate(),
  require('./milestones/deleteMilestone').deleteMilestoneById
);

// ************ /babyProfile routes ************
router.post('/baby', authenticate(), require('./baby/babyProfile/addBabyProfile'));

router.get('/babies', authenticate(), require('./baby/babyProfile/getAllBabyProfiles'));

router.get('/baby/:baby_id', authenticate(), require('./baby/babyProfile/getBabyProfile'));

router.get(
  '/doctor/:doctor_id/baby/:baby_id/profile',
  authenticate(),
  require('./baby/babyProfile/getBabyProfileByDoctor')
);

router.put('/baby/:baby_id', authenticate(), require('./baby/babyProfile/putBabyProfile'));

router.delete('/baby/:baby_id', authenticate(), require('./baby/babyProfile/deleteBabyProfile'));

// ************ /journal routes ************
router.post('/journal', authenticate(), require('./journal/addJournalEntry'));

router.get('/journal', authenticate(), require('./journal/getJournalEntries'));

router.get('/journal/:id', authenticate(), require('./journal/getJournalEntry'));

router.put('/journal/:id', authenticate(), require('./journal/putJournalEntry'));

router.delete('/journal/:id', authenticate(), require('./journal/deleteJournalEntry'));

// ************ /forum routes ************
router.post('/forum/posts/add', authenticate(), require('./forum/posts/addPost'));

router.get('/forum/posts/:post_id', authenticate(), require('./forum/posts/getPost'));

router.get('/forum/posts', authenticate(), require('./forum/posts/getPosts'));

router.put(
  '/forum/posts/:post_id',
  authenticate(),
  checkPostOwnership,
  require('./forum/posts/putPost')
);

router.delete(
  '/forum/posts/:post_id',
  authenticate(),
  checkPostOwnership,
  require('./forum/posts/deletePost')
);

router.post('/forum/posts/:post_id/reply', authenticate(), require('./forum/replies/addReply'));

router.get('/forum/posts/:post_id/replies', authenticate(), require('./forum/replies/getReplies'));

router.put(
  '/forum/replies/:reply_id',
  authenticate(),
  checkReplyOwnership,
  require('./forum/replies/putReply')
);

router.delete(
  '/forum/replies/:reply_id',
  authenticate(),
  checkReplyOwnership,
  require('./forum/replies/deleteReply')
);

// ************ /coupons routes ************
router.get('/coupons', require('./coupons/getAllCoupons'));

// ************ /quiz routes ************
router.get('/quiz', require('./quiz/getAllQuizzes'));

// ************ /voiceCommand routes ************
router.post('/voiceCommand', require('./voiceCommand/processVoiceCommand').processVoiceCommand);

// ************ /tips routes ************
router.get('/tips', require('./tips/getAllTips'));
router.get('/tips/notification', require('./tips/tipsNotification/getCustomTipsAllBabies'));
router.put('/tips/notification', require('./tips/tipsNotification/putTipsNotificationSettings'));

// ************ Stool routes ************
router.get('/baby/:babyId/stool', authenticate(), getStoolEntries);
router.post('/baby/:babyId/stool', authenticate(), createStoolEntry);
router.put('/baby/:babyId/stool/:stoolId', authenticate(), updateStoolEntry);
router.delete('/baby/:babyId/stool/:stoolId', authenticate(), deleteStoolEntry);

// ************ /medicalProfessional routes ************
router.get(
  '/medical-professional',
  require('./medicalProfessional/getAllMedicalProfessional').getAllMedicalProfessional
);

router.post(
  '/medical-professional/:doctor_id/connect',
  require('./medicalProfessional/connectMedicalProfessional').connectMedicalProfessional
);

router.get(
  '/medical-professional/:doctor_id/babies',
  require('./medicalProfessional/getAssignedBabiesByDoctorId').getAssignedBabiesByDoctorId
);

// Fetched assigned babies to a doctor from parent side
router.get(
  '/medical-professional/:doctor_id/getAssignedBabiesToDoctor',
  require('./medicalProfessional/getAssignedBabiesToDoctor').getAssignedBabiesToDoctor
);

// ************ Check Products ************
router.get('/products/checkProduct', require('./products/checkProduct').checkProduct);

// ************ /healthRecord routes ************
router.get(
  '/doctor/:doctorId/healthRecords',
  require('./healthRecord/getAllHealthRecords').getAllHealthRecords
);

// ************ /export routes ************
router.get('/export/csv', require('./export/getExportCSV'));

router.get('/export/pdf', require('./export/getExportPDF'));

// ************ /reminders routes ************
// GET /baby/:babyId/reminders - Get all reminders for a baby
router.get('/baby/:babyId/reminders', authenticate(), getReminders);

// POST /baby/:babyId/reminders - Create a new reminder
router.post('/baby/:babyId/reminders', authenticate(), createReminder);

// PUT /baby/:babyId/reminders/:reminderId - Update an existing reminder
router.put('/baby/:babyId/reminders/:reminderId', authenticate(), updateReminder);

// DELETE /baby/:babyId/reminders - Unified deletion endpoint (single or bulk)
router.delete('/baby/:babyId/reminders', authenticate(), deleteReminders);

// ************ /careServices routes ************
router.get('/careServices', authenticate(), careServices);
router.get('/careServices/favorites', favoritesHandler.getFavorites);
router.post('/careServices/favorites', favoritesHandler.toggleFavorite);

// ************ /profile-picture routes ************
router.post(
  '/profile-picture/upload',
  authenticate(),
  require('./profilePicture/putProfilePicture')
);

// Get a profile picture (public access, no authentication required)
router.get(
  '/profile-picture/:entityType/:entityId',
  require('./profilePicture/getProfilePicture.js')
);

// Delete a profile picture
router.delete(
  '/profile-picture/:entityType/:entityId',
  authenticate(),
  require('./profilePicture/deleteProfilePicture')
);

// ************ /bookmarks routes ************
// router.get('/forum/bookmarks', authenticate(), require('./forum/bookmarks/getBookmarks'));

// router.post('/forum/bookmarks/:postId', authenticate(), require('./forum/bookmarks/addBookmark'));

// Testing the authentication middleware
// router.get('/test', authenticate(), require('./test'));

// ************ /Sharing Doctor - Parent files routes ************
// Parent upload file for a baby to a doctor
router.post(
  '/parent/:parentId/babies/:babyId/doctors/:doctorId/uploadFile',
  authenticate(),
  upload.single('document'), // Middleware to handle file upload
  require('./parent/uploadFile').uploadFile
);

// Doctor upload file for a baby to a parent
router.post(
  '/doctor/:doctorId/babies/:babyId/parent/:parentId/uploadFile',
  authenticate(),
  upload.single('document'),
  require('./doctor/uploadFile').uploadFile
);

// Doctor get all files sent by all parents to the doctor
router.get(
  '/doctor/:doctorId/getAllFiles',
  authenticate(),
  require('./doctor/getAllFiles').getAllFiles
);

// Doctor get all sent files to parents
router.get(
  '/doctor/:doctorId/getSentFiles',
  authenticate(),
  require('./doctor/getSentFiles').getSentFiles
);

// Parent get all files sent by a doctor to a baby
router.get(
  '/parent/:parentId/doctors/:doctorId/babies/:babyId/getFiles',
  authenticate(),
  require('./parent/getFiles').getFiles
);

// Parent get all files sent to a doctor by a baby
router.get(
  '/parent/:parentId/babies/:babyId/doctors/:doctorId/getSentFiles',
  authenticate(),
  require('./parent/getSentFiles').getSentFiles
);

// Download file by document_id, it can be used by both parent and doctor
router.get(
  '/documents/:document_id/download',
  authenticate(),
  require('./parent/downloadFile').downloadFile
);
module.exports = router;
