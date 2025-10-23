const response = (res, success, message, list = [], totalRecords, currentPage, totalPages, hasMore,yesterdayCount,todayCount,OverallPercentageChange) => {
    const result = { message, list };
    if (totalRecords !== undefined) result.totalRecords = totalRecords;
    if (totalPages !== undefined) result.totalPages = totalPages;
    if (currentPage !== undefined) result.currentPage = currentPage;
    if (hasMore !== undefined) result.hasMore = hasMore;
    if (yesterdayCount !== undefined) result.yesterdayCount = yesterdayCount;
    if (todayCount !== undefined) result.todayCount = todayCount;
    if (OverallPercentageChange !== undefined) result.OverallPercentageChange = OverallPercentageChange;
    return res.json({ success, result });
};

module.exports = { response };