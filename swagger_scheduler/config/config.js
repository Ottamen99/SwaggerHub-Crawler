/**
 * This file contains the configuration of the application.
 */

exports.priorities = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2
}

exports.refreshTimer = 1000 * (process.env.REFRESH_RATE || 60) // 60 seconds

exports.fetchLimitSize = 1172

exports.waitingTime = 1000 * (process.env.WAITING_TIME || 91) // 91 seconds