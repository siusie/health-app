// server/src/routes/api/export/[getExportCSV].js
// Route: GET /export/csv

// GETTING RELATED DATA FROM DATABASE
// Step1: VERIFY THE USER + FIND RELATED BABY_ID
// Step2: FOR EACH BABY_ID, GET THE RELATED DATA: BABY_INFO, GROWTH_RECORDS, MILESTONES, FEEDING_SCHEDULE, STOOL_RECORDS
// Step3: EXPORT THE DATA AS CSV

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');
const { getUserId } = require('../../../utils/userIdHelper');

// GET /export/csv
// req.headers.authorization: is JWT token
// req.query.startDate + endDate: are date range
// req.query include options for each category (babyInfo, growth,...)
module.exports = async (req, res) => {
  try {
    // Step1: Verify the user token- get related baby_id
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json(createErrorResponse(401, "No authorization token provided"));
    } // 401 UNAUTHORIZED
    logger.debug(authHeader, `Authorization header: `);


    const user_id = await getUserId(authHeader);
    if (!user_id) {
      return res.status(401).json(createErrorResponse(401, "Invalid user ID"));
    } // 401 UNAUTHORIZED
    logger.debug(user_id, `User ID is: `);

    // Extract DATE RANGE and selected categories
    let { startDate, endDate, babyInfo, growthRecords, milestones, feedingSchedule, stoolRecords } = req.query;


    // if no date range ->Set Default date range: startDate = user account creation date, endDate = today
    // (formatted as YYYY - MM - DD)
    // {Requirement} user_id: user is already exist with the token
    if (!startDate) {
      const userResult = await pool.query(
        `SELECT to_char(created_at, 'YYYY-MM-DD') as created_at FROM users WHERE user_id = $1`,
        [parseInt(user_id, 10)]
      );

      if (userResult.rows.length === 0) {
        throw new Error("User not found");
      } else {
        startDate = userResult.rows[0].created_at;
      }
    }

    if (!endDate) {
      endDate = new Date().toISOString().split("T")[0];
    }
    logger.debug(startDate, `Start Date: `);
    logger.debug(endDate, `End Date: `);



    // set "undefined" to "true"
    babyInfo = babyInfo === undefined ? "true" : babyInfo;
    growthRecords = growthRecords === undefined ? "true" : growthRecords;
    milestones = milestones === undefined ? "true" : milestones;
    feedingSchedule = feedingSchedule === undefined ? "true" : feedingSchedule;
    stoolRecords = stoolRecords === undefined ? "true" : stoolRecords;
    // convert to boolean
    const includeBabyInfo = babyInfo === "true";
    const includeGrowthRecords = growthRecords === "true";
    const includeMilestones = milestones === "true";
    const includeFeedingSchedule = feedingSchedule === "true";
    const includeStoolRecords = stoolRecords === "true";
  
    logger.debug(includeBabyInfo, `Include Baby Info: `);
    logger.debug(includeGrowthRecords, `Include Growth Records: `);
    logger.debug(includeMilestones, `Include Milestones: `);
    logger.debug(includeFeedingSchedule, `Include Feeding Schedule: `);
    logger.debug(includeStoolRecords, `Include Stool Records: `);


    // Query to fetch baby profiles for this user
    // {Requirement} baby_id: must have at least one baby
    // {checkingRequirement} check if any baby exist for this user
    const checkBabyExist = await pool.query(
      `SELECT COUNT(*) FROM user_baby WHERE user_id = $1`,
      [parseInt(user_id, 10)]
    );
    if (checkBabyExist.rows[0].count === "0") {
      return res
        .status(404)
        .json(createErrorResponse(404, "No baby profiles found for this user"));
    }

    logger.debug(`Checking if any baby exist for this user: ${checkBabyExist.rows[0].count} babies found`);
    
    const babyProfilesResult = await pool.query(
      `SELECT b.* FROM baby b
       JOIN user_baby ub ON b.baby_id = ub.baby_id
       JOIN users u ON u.user_id = ub.user_id
       WHERE u.user_id = $1 
       ORDER BY b.baby_id ASC`,
      [parseInt(user_id, 10)]
    );

    const babies = babyProfilesResult.rows;
    logger.debug(`Baby profiles: ${babies.length} babies found for user_id ${user_id}`);



    // Step2: For each baby, query related data and append CSV sections : baby_info, growth_records, milestones, feeding_schedule, stool_records
    
    // Build CSV content
    let csvContent = "";

    // LOOP THROUGH EACH BABY
    for (let baby of babies) {
      // add [separator] between next baby
      if (csvContent.length > 0) {
        csvContent += "==========,==============,============,============,====================\n";
      }

      // Baby header
      csvContent += `Baby: ${baby.first_name} ${baby.last_name}\n`;
      // csvContent += `, DOB: ${baby.birthdate || "N/A"}`;  //TEMPORARILY REMOVED DOB
      csvContent += `\n`;

      // --- Baby Information ---
      if (includeBabyInfo) {
        csvContent += "Baby Information\n";
        csvContent += "ID,First Name,Last Name,";
        // csvContent += "DOB,";  //TEMPORARILY REMOVED DOB
        csvContent += "Gender,Weight,Created At\n";

        csvContent += `${baby.baby_id},${baby.first_name},${baby.last_name}`;
        //csvContent += `,${baby.birthdate || "N/A"}`;  //TEMPORARILY REMOVED DOB
        csvContent += `,${baby.gender},${baby.weight},${baby.created_at}`;
        csvContent += `\n\n`;
      }

      // --- Growth Records Section ---
      // {Requirement} growth: must have at least one growth record
      if (includeGrowthRecords) {
        // {checkingRequirement} growth
        const checkGrowthExist = await pool.query(
          `SELECT COUNT(*) FROM growth WHERE baby_id = $1`,
          [baby.baby_id]
        );

        // if no growth record
        if (checkGrowthExist.rows[0].count === "0") {
          csvContent += "No growth records found\n";
        } else {  // at least one growth record
          const growthResult = await pool.query(
            "SELECT * FROM growth WHERE baby_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC",
            [baby.baby_id, startDate, endDate]
          );

          csvContent += "---------------------------,---------------------------,----------------------\n";
          csvContent += "Growth Records\n";
          csvContent += "Growth ID,Date,Weight,Height,Notes\n";
          
          growthResult.rows.forEach(record => {
            csvContent += `${record.growth_id},${record.date},${record.weight},${record.height},${record.notes || ""}\n`;
          });
        }

        csvContent += "\n";
      }

      // --- Milestones Section ---
      // {Requirement} milestones: must have at least one milestone
      if (includeMilestones) {
        // {checkingRequirement} milestones
        const checkMilestoneExist = await pool.query(
          `SELECT COUNT(*) FROM milestones WHERE baby_id = $1`,
          [baby.baby_id]
        );

        // if no milestone record
        if (checkMilestoneExist.rows[0].count === "0") {
          csvContent += "No milestones found\n";
        } else {  // at least one milestone record
          const milestonesResult = await pool.query(
            "SELECT * FROM milestones WHERE baby_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC",
            [baby.baby_id, startDate, endDate]
          );
          
          csvContent += "---------------------------,---------------------------,----------------------\n";
          csvContent += "Milestones\n";
          csvContent += "Milestone ID,Date,Title,Details\n";
          
          milestonesResult.rows.forEach(milestone => {
            csvContent += `${milestone.milestone_id},${milestone.date},${milestone.title},${milestone.details || ""}\n`;
          });
        }

        csvContent += "\n";
      }

      // --- Feeding Schedule Section ---
      // {Requirement} feeding: must have at least one feeding schedule
      if (includeFeedingSchedule) {
        // {checkingRequirement} feeding
        const checkFeedingExist = await pool.query(
          `SELECT COUNT(*) FROM feedingschedule WHERE baby_id = $1`,
          [baby.baby_id]
        );

        // if no feeding schedule record
        if (checkFeedingExist.rows[0].count === "0") {
          csvContent += "No feeding schedule records found\n";
        } else {  // at least one feeding schedule record
          const feedingResult = await pool.query(
            "SELECT * FROM feedingschedule WHERE baby_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC, time ASC",
            [baby.baby_id, startDate, endDate]
          );

          csvContent += "---------------------------,---------------------------,----------------------\n";
          csvContent += "Feeding Schedule\n";
          csvContent += "Schedule ID,Date,Time,Meal,Amount,Type,Issues,Notes\n";
          
          feedingResult.rows.forEach(feed => {
            csvContent += `${feed.feeding_schedule_id},${feed.date},${feed.time},${feed.meal},${feed.amount},${feed.type},${feed.issues || ""},${feed.notes || ""}\n`;
          });
        }

        csvContent += "\n";
      }

      // --- Stool Records Section ---
      // {Requirement} stool: must have at least one stool record
      if (includeStoolRecords) {
        // {checkingRequirement} stool
        const checkStoolExist = await pool.query(
          `SELECT COUNT(*) FROM stool_entries WHERE baby_id = $1`,
          [baby.baby_id]
        );

        // if no stool record
        if (checkStoolExist.rows[0].count === "0") {
          csvContent += "No stool records found\n";
        } else {  // at least one stool record
          const stoolResult = await pool.query(
            "SELECT * FROM stool_entries WHERE baby_id = $1 AND date(timestamp) BETWEEN $2 AND $3 ORDER BY timestamp ASC",
              [baby.baby_id, startDate, endDate]
          );

          csvContent += "---------------------------,---------------------------,----------------------\n";
          csvContent += "Stool Records\n";
          csvContent += "Stool ID,Timestamp,Color,Consistency,Notes\n";
            
          stoolResult.rows.forEach(entry => {
            csvContent += `${entry.stool_id},${entry.timestamp},${entry.color},${entry.consistency},${entry.notes || ""}\n`;
          });
        }
          
        csvContent += "\n";
      }

      // Separate each baby
      csvContent += "\n\n";
    }

    // Build file name based on included sections and date range
    let fileNameParts = ["ExportedBabyData"];
    if (includeBabyInfo) fileNameParts.push("Info");
    if (includeGrowthRecords) fileNameParts.push("Growth");
    if (includeMilestones) fileNameParts.push("Milestones");
    if (includeFeedingSchedule) fileNameParts.push("Feeding");
    if (includeStoolRecords) fileNameParts.push("Stool");
    fileNameParts.push(`from${startDate}`);
    fileNameParts.push(`to${endDate}`);
    const fileName = fileNameParts.join("_") + ".csv";

    // Insert export record into exporteddocument table
    const exportDate = new Date().toISOString();
    const insertResult = await pool.query(
      "INSERT INTO exporteddocument (file_name, file_format, created_at) VALUES ($1, $2, $3) RETURNING *",
      [fileName, "CSV", exportDate]
    );
    logger.info(`Export record created: ${JSON.stringify(insertResult.rows[0])}`);

    // Set headers to expose our custom headers (without using middleware).
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, exportfilename");
    

    // Set headers to trigger CSV download with the dynamic file name
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    // add a header for filename
    res.setHeader("exportfilename", fileName);
    res.send(csvContent);
  } catch (err) {
    logger.error(err, "ERROR in getExportCSV(), Error exporting data: ");
    return res.status(500).json(createErrorResponse(500, "Internal server error"));
  }
};