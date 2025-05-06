// server/src/routes/api/export/[getExportPDF].js
// Route: GET /export/pdf

// GETTING RELATED DATA FROM DATABASE
// Step1: VERIFY THE USER + FIND RELATED BABY_ID
// Step2: FOR EACH BABY_ID, GET THE RELATED DATA: BABY_INFO, GROWTH_RECORDS, MILESTONES, FEEDING_SCHEDULE, STOOL_RECORDS
// Step3: EXPORT THE DATA AS CSV
// ===> PARSE CSV-TO-HTML
// ===> CONVERT HTML-TO-PDF

const pdf = require('html-pdf');

const logger = require('../../../utils/logger');
const { createSuccessResponse, createErrorResponse } = require('../../../utils/response');
const pool = require('../../../../database/db');
const { getUserId } = require('../../../utils/userIdHelper');

// GET /export/pdf
// req.headers.[authorization]: is JWT token
// req.query.startDate + endDate: are date range
// req.query include options for each category (babyInfo, growth,...)
module.exports = async (req, res) => {
  try {
    // Helper function to format date for Readibility [[NOT FOR CSV]]
    // format date to [MM/DD/YYYY]
    const formatDate = (dateStr) => {
      if (!dateStr) return "";

      const d = new Date(dateStr);
      return isNaN(d) ? dateStr : d.toLocaleDateString('en-US');  // MM/DD/YYYY
    };    


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
    logger.debug(`Checking if any baby exist for this user: ${checkBabyExist.rows[0].count}`);
    
    const babyProfilesResult = await pool.query(
      `SELECT b.* FROM baby b
       JOIN user_baby ub ON b.baby_id = ub.baby_id
       JOIN users u ON u.user_id = ub.user_id
       WHERE u.user_id = $1
       ORDER BY b.baby_id ASC`,
      [parseInt(user_id, 10)]
    );

    const babies = babyProfilesResult.rows;
    logger.debug( `Baby profiles: ${babies.length} babies found for user_id ${user_id}`);


    // Step2: For each baby, query related data and append CSV sections : baby_info, growth_records, milestones, feeding_schedule, stool_records
    
    // Build HTML content
    let htmlContent = `
    <html>
    <head>
      <style>
          body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
          h2 { border-bottom: 2px solid #000; padding-bottom: 5px; font-size: 14px;}
          h3 { margin-top: 30px; font-size: 14px;}

          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #000; padding: 6px; text-align: left; font-size: 10px; }
          
          .separator { 
                margin: 40px 0; 
                border-top: 4px solid #000; 
                height: 10px; 
                background: repeating-linear-gradient(
                    45deg,
                    #000,
                    #000 10px,
                    #fff 10px,
                    #fff 20px
                );
              }
      </style>
    </head>
    <body>
    `;  // STYLE for html

    // LOOP THROUGH EACH BABY
    for (let baby of babies) {
      // Baby header
      htmlContent += `<h2>Baby: ${baby.first_name} ${baby.last_name}</h2>\n`;

      // DOB: ${baby.birthdate || "N/A"
      // htmlContent += `, DOB: ${baby.birthdate || "N/A"}`;  //TEMPORARILY REMOVED DOB
      // htmlContent += `\n`;

      // --- Baby Information ---
      if (includeBabyInfo) {
        
        //   // htmlContent += "DOB,";  //TEMPORARILY REMOVED DOB
        //   htmlContent += "Gender,Weight,Created At\n";
        //   htmlContent += `${baby.baby_id},${baby.first_name},${baby.last_name}`;
        //   //htmlContent += `,${baby.birthdate || "N/A"}`;  //TEMPORARILY REMOVED DOB
        
        htmlContent += `<h3>Baby Information</h3>
        <table>
          <tr>
            <th>ID</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Gender</th>
            <th>Weight</th>
            <th>Created At</th>
          </tr>
          <tr>
            <td>${baby.baby_id}</td>
            <td>${baby.first_name}</td>
            <td>${baby.last_name}</td>
            <td>${baby.gender}</td>
            <td>${baby.weight}</td>

            <td>${formatDate(baby.created_at)}</td>

          </tr>
        </table>`;
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
          htmlContent += `<h3>Growth Records</h3>`;
          htmlContent += `<p>No growth records found</p>`;
        }
        else {  // at least one growth record
          const growthResult = await pool.query(
            "SELECT * FROM growth WHERE baby_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC",
            [baby.baby_id, startDate, endDate]
          );
          
          // htmlContent += "---------------------------,---------------------------,----------------------\n";
          // htmlContent += "Growth Records\n";
          // htmlContent += "Growth ID,Date,Weight,Height,Notes\n";
          htmlContent += `<h3>Growth Records</h3>`;
          htmlContent += `<table>
          <tr>
            <th>Growth ID</th>
            <th>Date</th>
            <th>Weight</th>
            <th>Height</th>
            <th>Notes</th>
          </tr>`;
          
          growthResult.rows.forEach(record => {
            htmlContent += `<tr>
            <td>${record.growth_id}</td>

            <td>${formatDate(record.date)}</td>

            <td>${record.weight}</td>
            <td>${record.height}</td>
            <td>${record.notes || ""}</td>
          </tr>`;
          });
          htmlContent += `</table>`;
        }
      } //--- /end of Growth Records Section ---

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
          htmlContent += `<h3>Milestones</h3>`;
          htmlContent += `<p>No milestones found</p>`;
        }
        else {  // at least one milestone record
          const milestonesResult = await pool.query(
            "SELECT * FROM milestones WHERE baby_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC",
            [baby.baby_id, startDate, endDate]
          );

          // htmlContent += "---------------------------,---------------------------,----------------------\n";
          // htmlContent += "Milestones\n";
          // htmlContent += "Milestone ID,Date,Title,Details\n";
          htmlContent += `<h3>Milestones</h3>`;
          htmlContent += `<table>
              <tr>
                <th>Milestone ID</th>
                <th>Date</th>
                <th>Title</th>
                <th>Details</th>
              </tr>`;
              
          milestonesResult.rows.forEach(milestone => {
            htmlContent += `<tr>
                <td>${milestone.milestone_id}</td>

                <td>${formatDate(milestone.date)}</td> 
                
                <td>${milestone.title}</td>
                <td>${milestone.details || ""}</td>
              </tr>`;
          });
          htmlContent += `</table>`;
        }
      } //--- /end of Milestones Section ---

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
          htmlContent += `<h3>Feeding Schedule</h3>`;
          htmlContent += `<p>No feeding schedule records found</p>`;
        }
        else {  // at least one feeding schedule record
          const feedingResult = await pool.query(
            "SELECT * FROM feedingschedule WHERE baby_id = $1 AND date BETWEEN $2 AND $3 ORDER BY date ASC, time ASC",
            [baby.baby_id, startDate, endDate]
          );

          htmlContent += `<h3>Feeding Schedule</h3>`;
          htmlContent += `<table>
                <tr>
                  <th>Schedule ID</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Meal</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Issues</th>
                  <th>Notes</th>
                </tr>`;

          feedingResult.rows.forEach(feed => {
            htmlContent += `<tr>
                  <td>${feed.feeding_schedule_id}</td>

                  <td>${formatDate(feed.date)}</td>
                  <!-- Format date to MM/DD/YYYY -->
                  
                  <td>${feed.time.split('.')[0]}</td> 
                  <!-- Split time to remove milliseconds, result: HH:mm:ss -->

                  <td>${feed.meal}</td>
                  <td>${feed.amount}</td>
                  <td>${feed.type}</td>
                  <td>${feed.issues || ""}</td>
                  <td>${feed.notes || ""}</td>
                </tr>`;
          });
          htmlContent += `</table>`;
        } //--- /end of Feeding Schedule Section ---

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
            htmlContent += `<h3>Stool Records</h3>`;
            htmlContent += `<p>No stool records found</p>`;
          }
          else {  // at least one stool record
            const stoolResult = await pool.query(
              "SELECT * FROM stool_entries WHERE baby_id = $1 AND date(timestamp) BETWEEN $2 AND $3 ORDER BY timestamp DESC",
              [baby.baby_id, startDate, endDate]
            );

            htmlContent += `<h3>Stool Records</h3>`;
            htmlContent += `<table>
                  <tr>
                    <th>Stool ID</th>
                    <th>Timestamp</th>
                    <th>Color</th>
                    <th>Consistency</th>
                    <th>Notes</th>
                  </tr>`;

            stoolResult.rows.forEach(entry => {
              htmlContent += `<tr>
                    <td>${entry.stool_id}</td>
                    
                    <td>${formatDate(entry.timestamp)}</td>
                    
                    <td>${entry.color && entry.color !== "null" ? entry.color : ""}</td>
                    <td>${entry.consistency && entry.consistency !== "null" ? entry.consistency : ""}</td> 
                    <!-- if null, show empty string -->
                    
                    <td>${entry.notes || ""}</td>
                  </tr>`;
            });
            htmlContent += `</table>`;
          }
        } //--- /end of Stool Records Section ---

        // Separate each baby
        htmlContent += `<div class="separator"></div>\n`;
      }
    } //--- /end of LOOP THROUGH EACH BABY ---

    htmlContent += `</body></html>`;  // END of HTML content

    // Build file name based on included sections and date range
    let fileNameParts = ["ExportedBabyData"];
    if (includeBabyInfo) fileNameParts.push("Info");
    if (includeGrowthRecords) fileNameParts.push("Growth");
    if (includeMilestones) fileNameParts.push("Milestones");
    if (includeFeedingSchedule) fileNameParts.push("Feeding");
    if (includeStoolRecords) fileNameParts.push("Stool");
    fileNameParts.push(`from${startDate}`);
    fileNameParts.push(`to${endDate}`);

    const fileName = fileNameParts.join("_") + ".pdf";

    // Insert export record into exporteddocument table
    const exportDate = new Date().toISOString(); 
    const insertResult = await pool.query(
      "INSERT INTO exporteddocument (file_name, file_format, created_at) VALUES ($1, $2, $3) RETURNING *",
      [fileName, "PDF", exportDate]
    );
    logger.info(`Export record created: ${JSON.stringify(insertResult.rows[0])}`);

    //====== Convert HTML to PDF ======
    const pdfOptions = {
      format: "Letter",
      border: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in"
      },
      header: {
        height: "20mm",
        contents: {
          default: `<div style="text-align: center; font-size: 10px;">Exported Baby Data - ${exportDate}</div>`
        }
      },
      // DEBUG-: ERROR FOOTER not showing real number of pages:
      //       Page: { #pageNum } of { #numPages } 
      // footer: {
      //   height: "20mm",
      //   contents: {
      //     default: `<div style="text-align: center; font-size: 10px;">Page: {#pageNum} of {#numPages}</div>`
      // //   }
      // }
    };

    // Convert HTML to PDF 
    pdf.create(htmlContent, pdfOptions).toBuffer((err, buffer) => {
      if (err) {
        logger.error(err, "ERROR in getExportPDF(), Error converting HTML to PDF: ");
        return res.status(500).json(createErrorResponse(500, "Internal server error"));
      }

      
      // Set headers to expose our custom headers (without using middleware)
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition, exportfilename");
      // Set headers to trigger file download with the dynamic file name
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      // add a header for filename
      res.setHeader("exportfilename", fileName);
      res.send(buffer); //SEND RESPONSE
    });

  } catch (err) {
    logger.error(err, "ERROR in getExportPDF(), Error exporting data: ");
    return res.status(500).json(createErrorResponse(500, "Internal server error"));
  }
};