// ============================================================
// API Response Helper
// ============================================================

/**
 * Send a success response
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = {}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...data,
    });
};

/**
 * Send an error response
 */
const errorResponse = (res, statusCode = 500, message = 'Internal Server Error') => {
    return res.status(statusCode).json({
        success: false,
        message,
    });
};

/**
 * Paginate query results
 * @param {Model} model - Mongoose model
 * @param {object} query - Filter query
 * @param {object} req - Express request (for page/limit)
 * @param {string} populate - Optional populate string
 */
const paginate = async (model, query = {}, req, populate = '') => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await model.countDocuments(query);

    let dbQuery = model.find(query).skip(skip).limit(limit);
    if (populate) dbQuery = dbQuery.populate(populate);

    const data = await dbQuery;

    return {
        data,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

module.exports = { successResponse, errorResponse, paginate };
