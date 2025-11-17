"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const utils_1 = require("../shared/utils");
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient);
const EVENTS_TABLE = process.env.EVENTS_TABLE;
const PARTICIPANTS_TABLE = process.env.PARTICIPANTS_TABLE;
const handler = async (event) => {
    try {
        const tenantId = (0, utils_1.extractTenantId)(event);
        if (!tenantId) {
            return (0, utils_1.createResponse)(401, {
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Invalid or missing token' }
            });
        }
        // Get all events for tenant
        const eventsQuery = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: EVENTS_TABLE,
            IndexName: 'GSI1-tenant-created',
            KeyConditionExpression: 'tenant_id = :tid',
            ExpressionAttributeValues: {
                ':tid': tenantId
            }
        }));
        const events = eventsQuery.Items || [];
        const now = Math.floor(Date.now() / 1000);
        // Calculate stats
        const totalEvents = events.length;
        const eventsByStatus = {
            draft: events.filter((e) => e.status === 'draft').length,
            published: events.filter((e) => e.status === 'published').length,
            cancelled: events.filter((e) => e.status === 'cancelled').length,
            completed: events.filter((e) => e.dates?.end < now).length
        };
        const upcomingEvents = events.filter((e) => e.status === 'published' && e.dates?.start > now).length;
        // Get participants stats
        const participantsQuery = await docClient.send(new lib_dynamodb_1.QueryCommand({
            TableName: PARTICIPANTS_TABLE,
            IndexName: 'GSI2-tenant-created',
            KeyConditionExpression: 'tenant_id = :tid',
            ExpressionAttributeValues: {
                ':tid': tenantId
            },
            Select: 'COUNT'
        }));
        const totalParticipants = participantsQuery.Count || 0;
        // Get checked-in count (approximate)
        let totalCheckins = 0;
        for (const event of events) {
            totalCheckins += event.checked_in_count || 0;
        }
        // Get recent events (last 5)
        const recentEvents = events
            .sort((a, b) => (b.created_at || 0) - (a.created_at || 0))
            .slice(0, 5)
            .map((e) => ({
            event_id: e.event_id,
            title: e.title,
            registered_count: e.registered_count || 0,
            checked_in_count: e.checked_in_count || 0,
            dates: e.dates
        }));
        // Weekly stats (last 7 days)
        const sevenDaysAgo = now - (7 * 24 * 60 * 60);
        const weeklyStats = [];
        for (let i = 6; i >= 0; i--) {
            const dayStart = now - (i * 24 * 60 * 60);
            const dayEnd = dayStart + (24 * 60 * 60);
            // This is simplified - in production, you'd query participants created in this range
            weeklyStats.push({
                date: new Date(dayStart * 1000).toISOString().split('T')[0],
                registrations: 0, // Would need to query participants
                checkins: 0 // Would need to query check-in logs
            });
        }
        return (0, utils_1.createResponse)(200, {
            success: true,
            data: {
                total_events: totalEvents,
                total_participants: totalParticipants,
                total_checkins: totalCheckins,
                upcoming_events: upcomingEvents,
                events_by_status: eventsByStatus,
                recent_events: recentEvents,
                weekly_stats: weeklyStats
            }
        });
    }
    catch (error) {
        console.error('Error getting dashboard stats:', error);
        return (0, utils_1.createResponse)(500, {
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to get dashboard stats'
            }
        });
    }
};
exports.handler = handler;
//# sourceMappingURL=index.js.map