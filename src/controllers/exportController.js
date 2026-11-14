const {
  generateInternsExcel,
  generateProjectsExcel,
  generateAssignmentsExcel,
  generateWeeklyReportsExcel,
  generateMonthlyReportsExcel
} = require('../services/excelService');

const sendWorkbookResponse = async (workbook, filename, res) => {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
};

const exportInterns = async (req, res) => {
  try {
    const workbook = await generateInternsExcel();
    await sendWorkbookResponse(workbook, `Phoenix_Interns_${Date.now()}.xlsx`, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export failed: ' + error.message });
  }
};

const exportProjects = async (req, res) => {
  try {
    const workbook = await generateProjectsExcel();
    await sendWorkbookResponse(workbook, `Phoenix_Projects_${Date.now()}.xlsx`, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export failed: ' + error.message });
  }
};

const exportAssignments = async (req, res) => {
  try {
    const workbook = await generateAssignmentsExcel();
    await sendWorkbookResponse(workbook, `Phoenix_Assignments_${Date.now()}.xlsx`, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export failed: ' + error.message });
  }
};

const exportWeeklyReports = async (req, res) => {
  try {
    const workbook = await generateWeeklyReportsExcel();
    await sendWorkbookResponse(workbook, `Phoenix_Weekly_Reports_${Date.now()}.xlsx`, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export failed: ' + error.message });
  }
};

const exportMonthlyReports = async (req, res) => {
  try {
    const workbook = await generateMonthlyReportsExcel();
    await sendWorkbookResponse(workbook, `Phoenix_Monthly_Summary_${Date.now()}.xlsx`, res);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Export failed: ' + error.message });
  }
};

module.exports = {
  exportInterns,
  exportProjects,
  exportAssignments,
  exportWeeklyReports,
  exportMonthlyReports
};
