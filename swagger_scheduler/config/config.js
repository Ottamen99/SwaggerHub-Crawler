exports.priorities = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2
}

exports.refreshTimer = 1000 * (process.env.REFRESH_RATE || 5)

exports.fetchLimitSize = 1172

exports.waitingTime = 1000 * (process.env.WAITING_TIME || 91)